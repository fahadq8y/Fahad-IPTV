# Fahad IPTV — Browser-Based IPTV Player

A polished, browser-only IPTV player built with **React 19 + Vite + Tailwind 4** that connects directly to any **Xtream Codes** portal. No installation required — open the site, sign in, and watch Live TV, Movies, and Series instantly.

> Design system: **Cinema Noir Console** — dark, editorial, cinematic. Serif display + geometric sans + monospace metadata.

## Features

| Area | Capability |
| --- | --- |
| Authentication | Xtream Codes login (server URL + username + password); credentials persisted to `localStorage`. |
| Live TV | Categories rail + channel grid + HLS player (via `hls.js`) with a LIVE pulse indicator. |
| Movies (VOD) | Category chips, poster grid, detail dialog with synopsis and inline player. |
| Series | Category chips, poster grid, season selector, episodes list, inline episode player. |
| Search | Unified search across Live, Movies, and Series. |
| Sharing | Generates a private share URL with credentials encoded in the URL hash (never sent to any server). |
| Responsive | Works on desktop and mobile (collapsible sidebar). |

## Tech Stack

- **Framework:** React 19, Vite 7, Wouter (routing)
- **Styling:** Tailwind CSS 4 + shadcn/ui + custom Cinema Noir design tokens
- **Streaming:** `hls.js` for HLS playback in non-Safari browsers, native HLS in Safari
- **State:** Lightweight React contexts; localStorage for credentials and catalog cache

## Getting Started Locally

```bash
pnpm install
pnpm dev          # start the Vite dev server on http://localhost:3000
pnpm build        # production build to dist/public
pnpm preview      # preview the production build
```

## Deploy to Vercel

This project ships with a `vercel.json` that builds the client and serves it as a static SPA with proper rewrites. To deploy:

1. Import this repository in Vercel (`https://vercel.com/new`).
2. Vercel detects the framework as **Vite** automatically. Keep the defaults:
   - Build command: `pnpm build`
   - Output directory: `dist/public`
3. Click **Deploy**.

No environment variables are required — the player runs entirely client-side.

## Project Structure

```
client/
  src/
    components/      # AppLayout, VideoPlayer, shadcn/ui primitives
    contexts/        # AuthContext, ThemeContext
    hooks/           # useCachedFetch, useMobile, ...
    lib/             # xtream.ts (API client), utils.ts
    pages/           # Login, LiveTV, Movies, Series, Search, Settings, Home
    App.tsx          # Routes + providers
    index.css        # Cinema Noir design tokens
  index.html
server/              # (unused in static deployment, kept for template compat)
vercel.json
```

## Notes on Streaming

- Some IPTV providers serve over plain HTTP. Modern browsers block mixed content when the player is loaded over HTTPS. If your provider only offers HTTP, either request an HTTPS portal or open the player over HTTP as well.
- `.mkv` playback depends on browser codec support (Chrome generally works best).
- Browser autoplay policies may require an initial user gesture before sound plays.

## License

Private project. All rights reserved by the repository owner.
