# Cloudflare Worker — IPTV Proxy

This is the proxy server for Fahad IPTV, deployed on Cloudflare Workers.

## Features

- ✅ Unlimited bandwidth (no monthly limits)
- ✅ Global edge network (fast everywhere)
- ✅ 99.95% uptime SLA
- ✅ Free tier: 10 million requests/month
- ✅ Full CORS support
- ✅ HLS playlist rewriting
- ✅ Range request support (for seeking in videos)

## Setup

### Prerequisites

1. **Cloudflare Account** (free tier is fine)
2. **Node.js** 18+
3. **Wrangler CLI**

```bash
npm install -g wrangler
```

### Installation

1. **Clone the repo**
```bash
cd wrangler
npm install
```

2. **Login to Cloudflare**
```bash
wrangler login
```

3. **Deploy**
```bash
wrangler deploy
```

This will output a URL like:
```
https://fahad-iptv-proxy.your-subdomain.workers.dev
```

## Configuration

After deployment, update the client code to use your Cloudflare Worker URL:

In `client/src/lib/xtream.ts`, change:
```typescript
// From:
return `/api/xtream?target=${encodeURIComponent(originalUrl)}`;

// To:
return `https://fahad-iptv-proxy.your-subdomain.workers.dev/?u=${streamB64UrlEncode(originalUrl)}`;
```

## Usage

The proxy accepts requests in this format:

```
GET https://fahad-iptv-proxy.your-subdomain.workers.dev/?u=<base64url-encoded-url>
```

Example:
```bash
# Encode the target URL
TARGET="http://tiatro.tv:8080/player_api.php?username=user&password=pass"
ENCODED=$(echo -n "$TARGET" | base64 | tr '+/' '-_' | tr -d '=')

# Make request
curl "https://fahad-iptv-proxy.your-subdomain.workers.dev/?u=$ENCODED"
```

## Monitoring

Check deployment status:
```bash
wrangler deployments list
```

View logs:
```bash
wrangler tail
```

## Pricing

| Plan | Requests/month | Cost |
|------|----------------|------|
| Free | 10 million | $0 |
| Pro | Unlimited | $5 |

For most personal/family use, the free tier is sufficient.

## Troubleshooting

### Worker is slow
- Check Cloudflare dashboard for errors
- Verify upstream server is responding
- Try accessing the upstream directly

### CORS errors
- Ensure `Access-Control-Allow-Origin: *` header is being sent
- Check browser console for exact error

### Bandwidth exceeded
- Upgrade to Pro plan ($5/month)
- Or implement caching on the client side

## Development

Local testing:
```bash
wrangler dev
```

This starts a local server at `http://localhost:8787`

## License

MIT
