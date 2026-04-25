/*
  Vercel Serverless Function — Streaming proxy for IPTV media.
  Handles three concerns the API proxy cannot:
    1. Mixed Content for media URLs (HLS .m3u8, .ts, MP4, MKV).
    2. CORS for HLS sub-requests (each .ts segment is its own fetch).
    3. HTTP Range Requests for VOD seeking (browser asks for byte ranges).

  Usage from the client:
    /api/stream?u=<base64url(originalUrl)>

  We base64url-encode the upstream URL so URL parsing is bulletproof,
  and we keep the path short (m3u8 playlists rewrite all child URLs
  to point back through this same endpoint).
*/

export const config = {
  runtime: "nodejs",
};

function b64urlDecode(s: string): string {
  const str = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str + pad, "base64").toString("utf8");
}

function b64urlEncode(s: string): string {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function isPlaylist(contentType: string, urlPath: string): boolean {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("mpegurl") || ct.includes("vnd.apple.mpegurl")) return true;
  if (ct.includes("application/x-mpegurl")) return true;
  if (/\.m3u8(\?|$)/i.test(urlPath)) return true;
  return false;
}

function rewritePlaylist(text: string, baseUrl: string, proxyOrigin: string): string {
  const base = new URL(baseUrl);
  return text
    .split(/\r?\n/)
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      // Comments/tags may contain URI="..." attributes (EXT-X-KEY, EXT-X-MAP, EXT-X-MEDIA)
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
          const abs = new URL(uri, base).toString();
          return `URI="${proxyOrigin}/api/stream?u=${b64urlEncode(abs)}"`;
        });
      }
      // Media URL line — could be relative or absolute
      try {
        const abs = new URL(trimmed, base).toString();
        return `${proxyOrigin}/api/stream?u=${b64urlEncode(abs)}`;
      } catch {
        return line;
      }
    })
    .join("\n");
}

export default async function handler(req: any, res: any) {
  // CORS for browser playback
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Range, Content-Type, Accept",
  );
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Range, Accept-Ranges, Content-Type",
  );

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let target = "";
  try {
    const u = req.query?.u;
    const raw = typeof u === "string" ? u : Array.isArray(u) ? u[0] : "";
    if (!raw) {
      res.status(400).json({ error: "Missing 'u' query parameter" });
      return;
    }
    target = b64urlDecode(raw);
  } catch {
    res.status(400).json({ error: "Invalid 'u' parameter" });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    res.status(400).json({ error: "Invalid target URL" });
    return;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    res.status(400).json({ error: "Only http/https targets are allowed" });
    return;
  }

  // Forward range header so MP4 seeking works
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (compatible; FahadIPTV-Stream/1.0; +https://fahad-iptv.vercel.app)",
    Accept: "*/*",
  };
  const range = req.headers["range"];
  if (typeof range === "string" && range) {
    headers["Range"] = range;
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      method: req.method,
      headers,
      redirect: "follow",
    });
  } catch (err: any) {
    res.status(502).json({
      error: "Upstream fetch failed",
      message: err?.message || String(err),
    });
    return;
  }

  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";

  // Decide if this is an HLS playlist that needs rewriting
  if (isPlaylist(contentType, parsed.pathname)) {
    const text = await upstream.text();

    // Build proxy origin: prefer x-forwarded-host if present (Vercel sets it)
    const host =
      (req.headers["x-forwarded-host"] as string) ||
      (req.headers["host"] as string) ||
      "fahad-iptv.vercel.app";
    const proto =
      (req.headers["x-forwarded-proto"] as string) || "https";
    const proxyOrigin = `${proto}://${host}`;

    const rewritten = rewritePlaylist(text, parsed.toString(), proxyOrigin);

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-store");
    res.status(upstream.status).send(rewritten);
    return;
  }

  // Otherwise: pass-through binary with key headers preserved
  const passHeaders = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "cache-control",
    "last-modified",
    "etag",
  ];
  for (const h of passHeaders) {
    const v = upstream.headers.get(h);
    if (v) res.setHeader(h, v);
  }
  // Always advertise byte ranges for media (fixes some seek issues)
  if (!upstream.headers.get("accept-ranges")) {
    res.setHeader("Accept-Ranges", "bytes");
  }

  res.status(upstream.status);

  if (req.method === "HEAD" || !upstream.body) {
    res.end();
    return;
  }

  // Stream the body to the client without buffering it all in memory
  // Vercel's Node runtime supports piping web streams via Readable.fromWeb
  try {
    // @ts-ignore - Node 18+ has Readable.fromWeb
    const { Readable } = await import("node:stream");
    const nodeStream = Readable.fromWeb(upstream.body as any);
    nodeStream.on("error", () => {
      try {
        res.end();
      } catch {}
    });
    nodeStream.pipe(res);
  } catch {
    // Fallback: buffer (last resort, only for small responses)
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
  }
}
