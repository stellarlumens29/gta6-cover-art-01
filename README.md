# Vice City Multi-Panel Photo Composer — 4 Photo Slots, 3 Export Sizes, 100% Local

**Competition:** `gta6-cover-art-01` — Make GTA 6 Cover Art ($250, top 50 share).
**Title (submission):** Vice City Multi-Panel Photo Composer — 4 Photo Slots, 3 Export Sizes, 100% Local

## Concept — "Vice City: the personal crime dossier"

Not a generic photo filter. 1–4 photos become a fictional Vice City crime
dossier cover: a professionally art-directed collectible poster. Top panel:
large cinematic portrait. Middle panel: secondary photo at a different crop.
Bottom: smaller lifestyle/action image (or a drawn skyline band). Original
pink-orange sunset into deep violet, oversized condensed headline lettering,
editorial labels and issue numbering, grain, halftone, shadows, controlled
neon highlights.

## What it does

- **3 deterministic art-direction presets** — Sunset Dossier, Neon
  Nightlife, Coastal Crime Editorial. Each fixes typography hierarchy, panel
  geometry and colour treatment, so the cover looks excellent before the user
  touches anything.
- **Real photo composition editor** — 4 photo slots (file upload or kit
  samples), drag-to-reposition on the preview, wheel/scroll zoom, zoom + pan
  sliders, focal-point presets (top/centre), slot swap, headline/subtitle/
  issue editing, headline alignment, warmth/contrast/saturation grading.
  Focal-point model: the crop chosen in one ratio survives switching ratios.
  1 photo still fills all 4 panels (hero + tighter detail crops); 0 photos
  still shows a finished drawn artwork.
- **Instant verifiably-local export** — browser Canvas renders exact PNGs at
  **1080×1080, 1080×1350 and 1920×1080** in milliseconds; a "100% LOCAL •
  OFFLINE" badge and per-export timing are shown. No upload, no network
  after load, no external fonts/assets/CDN.
- **Ratio preview** — square 1:1, portrait 4:5, wide 16:9, one click.

## Originality

All art, lettering and panels are drawn originally in `app/src/cover.js`
(slatted retro sun, skyline silhouette, halftone dots, grain, duotone
headline shadow). No Rockstar logo, artwork or fonts. System font stacks
only. Sample photos are the kit's free-to-use AI-made images
(`app/samples/`).

## Validation performed (19 Nov 2026)

- `?qa=export` in headless Chromium: all 3 export sizes render at exactly
  1080×1080, 1080×1350, 1920×1080.
- `?qa=photos`: 6 synthetic photo types (portrait, landscape, dark, bright,
  close-up, full-body) × all 3 export sizes — all renders OK, no errors.
- `node main.ts` (MAKEFUN_OUTPUT_DIR=out) twice: identical dossier bytes;
  `grade-local` / bundle dry-run exit 0 (see BUILD-REPORT.md).
- Screenshots are real renders of the app in headless Chromium (see
  `take-shots.mjs`): 1 = wide exported cover (Sunset), 2 = editor with
  photos loaded, 3 = portrait exported cover (Neon), 4 = square exported
  cover (Coastal).

## Run it

```sh
node serve.ts            # http://localhost:8080
# or: node main.ts with MAKEFUN_OUTPUT_DIR=out
```

## Layout

- `main.ts` — Node 22 entrypoint: copies `app/` + `screenshots/` to
  `/output`, writes `dossier.json` via `vendor/makefun-app.ts` (unchanged).
- `app/index.html`, `app/style.css` — editor UI.
- `app/src/cover.js` — the cover renderer (panels, presets, grading, grain).
- `app/src/presets.js` — the 3 presets + export sizes + seeded PRNG.
- `app/src/main.js` — editor wiring, drag/zoom, export.
- `app/src/shots.js` — fixed `?shot=` scenes + `?qa=` self-tests.
- `app/samples/` — kit sample photos (free to use).
- `screenshots/` — 4 screenshots (cover first).
- `vendor/makefun-app.ts` — kit copy, unchanged.

Recorded re-attribution pass — 19 Nov 2026 (sealed recording session).
