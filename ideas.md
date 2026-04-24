# Design Ideas — IPTV Web Player

<response>
<text>
**Approach 1 — "Cinema Noir Console"**

- **Design Movement**: Editorial dark-mode cinema UI, inspired by premium streaming platforms (Letterboxd, Criterion Channel) crossed with broadcast control-room dashboards.
- **Core Principles**:
  1. Content-first: the media tile is the hero, chrome recedes.
  2. Deep blacks with one accent hue carrying all emphasis.
  3. Editorial typography: a confident serif display paired with a clean geometric sans for UI.
  4. Cinematic motion — slow fades, subtle parallax, letterbox reveals.
- **Color Philosophy**: Near-black canvas `oklch(0.14 0.01 260)` with carbon cards `oklch(0.20 0.01 260)`, a single amber-copper accent `oklch(0.78 0.14 55)` for focus / play-state, and an ember-red `oklch(0.62 0.22 25)` reserved exclusively for the LIVE indicator. Evokes a darkened screening room.
- **Layout Paradigm**: Persistent left rail (icon + label) for Live / Movies / Series / Search / Settings. Top strip shows breadcrumb + global search + avatar. Main pane uses horizontally scrolling "rows" (Netflix-style) for VOD/Series, and a two-pane master-detail (categories list + channel grid) for Live TV. The player opens in a focused overlay with backdrop blur instead of a modal popup.
- **Signature Elements**:
  - Amber "now playing" pill with a pulsing dot.
  - Thin 1px hairline dividers in warm grey instead of boxy borders.
  - Subtle film-grain noise overlay on hero backgrounds.
- **Interaction Philosophy**: Keyboard-first (arrow keys navigate grids, space toggles play). Hover lifts cards with a soft warm glow; clicking a channel slides the player in from the right edge rather than popping up.
- **Animation**: 250–400ms ease-out for entrances; category switches use a horizontal slide-and-fade. Channel cards scale to 1.03 with a copper glow on hover. LIVE dot pulses at 1.2s.
- **Typography System**: Display = **Fraunces** (serif, 600) for section titles and channel names in hero; UI = **Inter Tight** (500/600) for labels; numeric/metadata = **JetBrains Mono** for stream URLs, resolution, bitrate. Hierarchy driven by weight + size + color, not boxes.
</text>
<probability>0.07</probability>
</response>

<response>
<text>
**Approach 2 — "Broadcast Grid Brutalism"**

- **Design Movement**: Swiss-grid meets 90s TV-guide brutalism. High-contrast, mono-accent, dense information.
- **Core Principles**: Unapologetic grid, monospace accents, zero gradients, sharp corners (radius = 2px), everything labeled.
- **Color Philosophy**: Paper white + ink black with a single neon-lime accent. Feels like a printed TV schedule.
- **Layout Paradigm**: 12-column rigid grid, category filter chips across top, channel matrix below. EPG-style timeline for live.
- **Signature Elements**: Numbered channel cells, monospace timecodes, thick 2px black borders on focus.
- **Interaction Philosophy**: Instant, no easing — state changes are abrupt and confident.
- **Animation**: Minimal (80ms). Mostly color inversions on hover.
- **Typography System**: **Space Grotesk** display + **JetBrains Mono** for everything metadata.
</text>
<probability>0.04</probability>
</response>

<response>
<text>
**Approach 3 — "Aurora Glass Lounge"**

- **Design Movement**: Glassmorphism + aurora gradients, VisionOS-inspired.
- **Core Principles**: Translucent layers, soft blurred color blobs behind, rounded 20px corners, floating panels.
- **Color Philosophy**: Deep indigo base with aurora teal/violet/pink gradient orbs behind glass.
- **Layout Paradigm**: Floating bottom nav bar (mobile-feel even on desktop), full-bleed hero behind glass panels.
- **Signature Elements**: Blurred color orbs, frosted panels, glowing focus rings.
- **Interaction Philosophy**: Playful, bouncy springs.
- **Animation**: Spring-based, 400ms, with scale+blur on transitions.
- **Typography System**: **Geist** sans + **Geist Mono**.
</text>
<probability>0.03</probability>
</response>

---

## Selected Approach: **#1 — Cinema Noir Console**

Rationale: Best fits the product's identity as a premium, focused media-watching tool. Dark UI is ideal for extended viewing, the editorial serif/sans pairing elevates it above generic "dashboard" clones, and the master-detail layout with horizontal VOD rows matches how users mentally browse IPTV content (by category, then channel). The single amber accent keeps the LIVE-red semantic clean and unambiguous.
