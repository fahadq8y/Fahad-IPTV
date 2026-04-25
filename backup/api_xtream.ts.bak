/*
  Vercel Serverless Function — Xtream API proxy.
  Solves two problems:
    1. Mixed Content: HTTPS site -> HTTP IPTV server is blocked by browsers.
    2. CORS: IPTV servers don't send CORS headers, so the browser can't read responses.

  Usage from the client:
    fetch('/api/xtream?target=' + encodeURIComponent(fullXtreamUrl))

  The `target` param must be a full URL pointing to an Xtream Codes endpoint.
  Examples:
    /api/xtream?target=http%3A%2F%2Fserver.com%3A8080%2Fplayer_api.php%3Fusername%3Du%26password%3Dp
*/

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: any, res: any) {
  // CORS for the browser
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const target =
      typeof req.query?.target === "string"
        ? req.query.target
        : Array.isArray(req.query?.target)
        ? req.query.target[0]
        : "";

    if (!target) {
      res.status(400).json({ error: "Missing 'target' query parameter" });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      res.status(400).json({ error: "Invalid 'target' URL" });
      return;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      res.status(400).json({ error: "Only http/https targets are allowed" });
      return;
    }

    // Fetch the upstream resource (Node 18+/20+ has global fetch on Vercel)
    const upstream = await fetch(parsed.toString(), {
      method: "GET",
      headers: {
        // Some Xtream servers reject empty UA
        "User-Agent":
          "Mozilla/5.0 (compatible; FahadIPTV-Proxy/1.0; +https://fahad-iptv.vercel.app)",
        Accept: "application/json, text/plain, */*",
      },
      redirect: "follow",
    });

    const contentType =
      upstream.headers.get("content-type") || "application/json; charset=utf-8";
    const body = await upstream.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");
    res.status(upstream.status).send(Buffer.from(body));
  } catch (err: any) {
    res.status(502).json({
      error: "Upstream fetch failed",
      message: err?.message || String(err),
    });
  }
}
