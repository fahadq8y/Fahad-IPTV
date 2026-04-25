/**
 * Cloudflare Worker — IPTV Proxy
 * 
 * Replaces Vercel proxy with unlimited bandwidth and better performance.
 * Handles both API requests and media streaming.
 * 
 * Deploy: wrangler deploy
 * URL: https://fahad-iptv-proxy.{your-subdomain}.workers.dev/
 */

interface Env {
  // Bindings would go here if needed
}

function b64urlDecode(s: string): string {
  const str = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return new TextDecoder().decode(
    Uint8Array.from(atob(str + pad), (c) => c.charCodeAt(0))
  );
}

function b64urlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function isPlaylist(contentType: string, urlPath: string): boolean {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("mpegurl") || ct.includes("vnd.apple.mpegurl")) return true;
  if (ct.includes("application/x-mpegurl")) return true;
  if (/\.m3u8(\?|$)/i.test(urlPath)) return true;
  return false;
}

function rewritePlaylist(
  text: string,
  baseUrl: string,
  proxyOrigin: string
): string {
  const base = new URL(baseUrl);
  return text
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
          try {
            const abs = new URL(uri, base).toString();
            return `URI="${proxyOrigin}/?u=${b64urlEncode(abs)}"`;
          } catch {
            return _m;
          }
        });
      }
      try {
        const abs = new URL(trimmed, base).toString();
        return `${proxyOrigin}/?u=${b64urlEncode(abs)}`;
      } catch {
        return line;
      }
    })
    .join("\n");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Range, Content-Type, Accept",
          "Access-Control-Expose-Headers":
            "Content-Length, Content-Range, Accept-Ranges, Content-Type",
        },
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    let target = "";
    try {
      const u = url.searchParams.get("u");
      if (!u) {
        return new Response(JSON.stringify({ error: "Missing 'u' parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      target = b64urlDecode(u);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid 'u' parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid target URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new Response(
        JSON.stringify({ error: "Only http/https targets allowed" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Forward request headers
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (compatible; FahadIPTV-Proxy/2.0; +https://fahad-iptv.vercel.app)",
      Accept: "*/*",
    };

    const range = request.headers.get("range");
    if (range) {
      headers["Range"] = range;
    }

    try {
      const upstream = await fetch(parsed.toString(), {
        method: request.method,
        headers,
        redirect: "follow",
      });

      const contentType =
        upstream.headers.get("content-type") || "application/octet-stream";

      // Detect if this is an HLS playlist
      if (isPlaylist(contentType, parsed.pathname)) {
        const text = await upstream.text();
        const proxyOrigin = url.origin;
        const rewritten = rewritePlaylist(text, parsed.toString(), proxyOrigin);

        return new Response(rewritten, {
          status: upstream.status,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
          },
        });
      }

      // Pass-through for binary (media files)
      const responseHeaders = new Headers();
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      responseHeaders.set(
        "Access-Control-Expose-Headers",
        "Content-Length, Content-Range, Accept-Ranges, Content-Type"
      );

      // Copy relevant headers
      const headersToProxy = [
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
        "cache-control",
        "last-modified",
        "etag",
      ];

      for (const h of headersToProxy) {
        const v = upstream.headers.get(h);
        if (v) responseHeaders.set(h, v);
      }

      // Always advertise byte ranges for media
      if (!responseHeaders.has("accept-ranges")) {
        responseHeaders.set("Accept-Ranges", "bytes");
      }

      if (request.method === "HEAD" || !upstream.body) {
        return new Response(null, {
          status: upstream.status,
          headers: responseHeaders,
        });
      }

      return new Response(upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: "Upstream fetch failed",
          message: err?.message || String(err),
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
} satisfies ExportedHandler<Env>;
