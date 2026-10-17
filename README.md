# HardWorx Gym: homepage concept

A scroll-driven redesign concept for [hardworxgym.com](https://hardworxgym.com).

**Concept preview only.** It isn't affiliated with or published by HardWorx Gym, and it's marked `noindex`. All copy, photos and logos belong to the client.

## The story

One member moves through a single gym session from the top of the page to the bottom:

1. Taps a key fob at 3:00 AM and the hex ceiling lights snap on.
2. Warms up on an uncrowded floor.
3. Works the treadmill, pin-stack pulldown, plate-loaded press and dumbbells.
4. Logs the session in the HardWorx App.
5. Sauna, then cold plunge.
6. Grabs a merch tee and squats in the legs section.
7. Walks past the reviews.
8. Deadlifts on the pricing panel.
9. Hits the lockers and showers.
10. Finishes with a flex that turns into the HardWorx H.

The member gets stronger along the way.

**How it's built:**
- The route is a single SVG path that snakes down the page.
- Each chapter is a sticky, scrubbed stage.
- The member is a jointed SVG figure with blended key poses and a strength value that widens the shoulders, arms, chest and thighs.

## Run it

```bash
npm install
npm run dev      # http://127.0.0.1:5174
npm run build    # outputs dist/
```

**Query flags:**
- `?rm=1` forces the reduced-motion version.
- `?debug=1` exposes `__go(chapter, t)` for QA.

## Files

| File | What it is |
|---|---|
| `RESEARCH.md` | Client and inspiration research |
| `STORY_OPTIONS.md` | The three story options |
| `STORYBOARD.md` | Approved storyboard |
| `QA.md` | Test results and open issues |
| `design-tokens.json` | Colours and fonts |
| `content.json` | Verbatim copy and links from the live site |
| `src/figure.js` | The member: jointed figure and poses |
| `src/props.js` | Equipment drawings |
| `src/main.js` | Story engine: camera, lane, chapters |
| `src/ui.js` | Menus, form, HUD |
| `media/` | Journey recordings: desktop MP4 + GIF, mobile MP4 |

Pushing to `main` deploys to GitHub Pages through `.github/workflows/pages.yml`.
