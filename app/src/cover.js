// Recorded re-attribution pass — 19 Nov 2026 (sealed recording session).
// Vice City Multi-Panel Photo Composer — the cover renderer.
// One function, drawCover(canvas, state), paints the whole dossier cover
// for any of the 3 export sizes. Everything is drawn from scratch on
// canvas: sunset/neon/coastal skies, a slatted retro sun, a skyline
// silhouette, halftone dots, grain and condensed headline lettering.
// No Rockstar artwork, logos or fonts; no external assets at all.
//
// Focal-point model: each photo carries { img, zoom, fx, fy, ox, oy }.
// fx/fy (0..1) is the point of the photo that stays centred, so a crop
// chosen in one ratio survives a switch to another ratio; ox/oy are a
// small manual pan. A panel with no photo re-uses slot 0 at a different
// crop, or falls back to a drawn graphic panel — so 1 photo still fills
// a 4-panel cover and 0 photos still shows a finished artwork.

import { PRESETS, mulberry32 } from './presets.js';

const FONT_STACK = `'Arial Narrow', 'Helvetica Neue', Impact, 'Franklin Gothic Medium', sans-serif`;
const FONT_CONDENSED = `'Impact', 'Arial Narrow', 'Helvetica Neue', sans-serif`;

/** Panel geometry for a W x H cover. Returns rects in pixels. */
export function coverLayout(W, H) {
  const m = Math.round(W * 0.022);
  const g = Math.max(6, Math.round(W * 0.011));
  const wide = W / H > 1.3;
  const headerH = Math.round(H * 0.048);
  const footH = Math.round(H * 0.045);
  // Bands share exactly the height left after header, footer and gutters,
  // so the layout can never overflow the canvas on any ratio.
  const avail = H - 2 * m - headerH - footH - 4 * g;
  const heroH = Math.round(avail * (wide ? 0.52 : 0.55));
  const midH = Math.round(avail * 0.22);
  const headH = avail - heroH - midH;
  const y0 = m;
  const heroY = y0 + headerH + g;
  const midY = heroY + heroH + g;
  const headY = midY + midH + g;
  const footY = headY + headH + g;
  const midAW = Math.round((W - 2 * m - g) * 0.58);
  return {
    m, g, wide,
    header: { x: m, y: y0, w: W - 2 * m, h: headerH },
    hero: { x: m, y: heroY, w: W - 2 * m, h: heroH },
    midA: { x: m, y: midY, w: midAW, h: midH },
    midB: { x: m + midAW + g, y: midY, w: W - 2 * m - midAW - g, h: midH },
    headline: { x: m, y: headY, w: W - 2 * m, h: headH },
    footer: { x: m, y: footY, w: W - 2 * m, h: footH },
  };
}

function skyGradient(ctx, preset, x, y, w, h) {
  const gr = ctx.createLinearGradient(x, y, x, y + h);
  const stops = preset.sky;
  stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c));
  return gr;
}

function drawSun(ctx, preset, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = preset.sun;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = preset.sunCore;
  ctx.fill();
  // Slats: horizontal cuts through the lower half, sky showing through.
  ctx.globalCompositeOperation = 'destination-out';
  const slits = 5;
  for (let i = 0; i < slits; i++) {
    const sy = cy + r * 0.08 + i * (r * 0.17);
    const sh = r * (0.05 + i * 0.022);
    ctx.fillRect(cx - r - 2, sy, r * 2 + 4, sh);
  }
  ctx.restore();
}

function drawSkyline(ctx, preset, x, y, w, h, seed) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = preset.ink;
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.06 + rnd() * 0.09);
    const bh = h * (0.35 + rnd() * 0.6);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    // Antenna on some towers.
    if (rnd() > 0.6) ctx.fillRect(bx + bw / 2 - 1, y + h - bh - h * 0.16, 2, h * 0.16);
    // Lit windows.
    ctx.fillStyle = preset.accent;
    const cols = Math.max(1, Math.floor(bw / (w * 0.028)));
    const rows = Math.max(1, Math.floor(bh / (h * 0.16)));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rnd() > 0.55) {
          ctx.fillRect(bx + w * 0.012 + c * (w * 0.028), y + h - bh + h * 0.06 + r * (h * 0.16), Math.max(2, w * 0.008), Math.max(2, h * 0.05));
        }
      }
    }
    ctx.fillStyle = preset.ink;
    bx += bw + w * 0.012;
  }
}

function drawHalftone(ctx, preset, x, y, w, h, seed) {
  const rnd = mulberry32(seed);
  const step = Math.max(7, w * 0.02);
  ctx.fillStyle = preset.paper;
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const t = (yy - y) / h; // dots grow toward the bottom
      const r = step * (0.08 + 0.3 * t) * (0.7 + rnd() * 0.6);
      ctx.globalAlpha = 0.16 + 0.5 * t;
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/** A drawn graphic panel: sky, slatted sun, skyline, halftone, big number. */
export function drawGraphicPanel(ctx, preset, rect, seed, bigText) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = skyGradient(ctx, preset, x, y, w, h);
  ctx.fillRect(x, y, w, h);
  const r = Math.min(w, h) * 0.42;
  drawSun(ctx, preset, x + w * 0.5, y + h * 0.42, r);
  drawHalftone(ctx, preset, x, y, w, h, seed + 7);
  drawSkyline(ctx, preset, x, y + h * 0.45, w, h * 0.55, seed + 13);
  if (bigText) {
    ctx.font = `900 ${Math.round(h * 0.52)}px ${FONT_CONDENSED}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = preset.paper;
    ctx.globalAlpha = 0.92;
    ctx.fillText(bigText, x + w - w * 0.06, y + h * 0.94);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function coverFitRect(img, rect, photo) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = photo.zoom ?? 1;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const fx = photo.fx ?? 0.5;
  const fy = photo.fy ?? 0.5;
  let dx = rect.x + rect.w / 2 - fx * dw + (photo.ox ?? 0) * rect.w * 0.25;
  let dy = rect.y + rect.h / 2 - fy * dh + (photo.oy ?? 0) * rect.h * 0.25;
  dx = Math.min(rect.x, Math.max(rect.x + rect.w - dw, dx));
  dy = Math.min(rect.y, Math.max(rect.y + rect.h - dh, dy));
  return { dx, dy, dw, dh };
}

function gradeFilter(preset, grade) {
  const g = { ...preset.grade, ...(grade ?? {}) };
  return `saturate(${g.saturate}) contrast(${g.contrast}) brightness(${g.brightness}) sepia(${g.sepia}) hue-rotate(${g.warmth}deg)`;
}

function drawPhotoPanel(ctx, preset, rect, photo, grade, seed) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!photo || !photo.img) {
    drawGraphicPanel(ctx, preset, rect, seed, null);
  } else {
    ctx.filter = gradeFilter(preset, grade);
    const r = coverFitRect(photo.img, rect, photo);
    ctx.drawImage(photo.img, r.dx, r.dy, r.dw, r.dh);
    ctx.filter = 'none';
    // Preset colour grade tint.
    ctx.globalCompositeOperation = preset.tintMode;
    ctx.fillStyle = preset.tint;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    // Bottom shade so captions stay legible.
    const sh = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
    sh.addColorStop(0, 'rgba(10,4,20,0)');
    sh.addColorStop(1, 'rgba(10,4,20,0.42)');
    ctx.fillStyle = sh;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  // Keyline.
  ctx.strokeStyle = preset.ink;
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.strokeRect(x, y, w, h);
}

function wrapHeadline(ctx, text, maxW, startSize) {
  let size = startSize;
  const words = text.split(/\s+/).filter(Boolean);
  while (size > 10) {
    ctx.font = `900 ${size}px ${FONT_CONDENSED}`;
    if (ctx.measureText(text).width <= maxW) return { lines: [text], size };
    // Try two balanced lines.
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const wMax = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
      if (!best || wMax < best.w) best = { lines: [a, b], w: wMax };
    }
    if (best && best.w <= maxW) return { lines: best.lines, size };
    size = Math.round(size * 0.92);
  }
  return { lines: [text], size };
}

function drawHeadline(ctx, preset, rect, headline, subtitle, align) {
  const { x, y, w, h } = rect;
  const pad = w * 0.02;
  const maxW = w - pad * 2;
  const startSize = Math.round(h * (headline.length > 14 ? 0.42 : 0.52));
  const fit = wrapHeadline(ctx, headline.toUpperCase(), maxW, startSize);
  const lineH = fit.size * 0.98;
  const totalH = lineH * fit.lines.length;
  let ty = y + (h - totalH) / 2 + fit.size * 0.78;
  ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
  const tx = align === 'center' ? x + w / 2 : align === 'right' ? x + w - pad : x + pad;
  ctx.save();
  if (preset.headlineGlow) {
    ctx.shadowColor = preset.headlineShadow;
    ctx.shadowBlur = preset.headlineGlow * (w / 1080);
  }
  fit.lines.forEach((line) => {
    // Duotone offset shadow — the poster's own lettering.
    ctx.fillStyle = preset.headlineShadow;
    ctx.fillText(line, tx + fit.size * 0.045, ty + fit.size * 0.045);
    ctx.fillStyle = preset.headline;
    ctx.fillText(line, tx, ty);
    ty += lineH;
  });
  ctx.restore();
  if (subtitle) {
    ctx.font = `700 ${Math.max(11, Math.round(h * 0.14))}px ${FONT_STACK}`;
    try { ctx.letterSpacing = `${Math.max(2, w * 0.004)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = preset.label;
    ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
    const sy = y + h - Math.max(10, h * 0.1);
    ctx.fillText(subtitle.toUpperCase(), tx, sy);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
}

function drawGrain(ctx, W, H, seed) {
  const rnd = mulberry32(seed);
  const n = Math.round((W * H) / 1100);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rnd() * W, rnd() * H, 1.6, 1.6);
  }
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(8,2,16,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Thin bottom strip: sky gradient + skyline silhouette, no sun. */
export function drawStripBand(ctx, preset, rect, seed) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = skyGradient(ctx, preset, x, y, w, h);
  ctx.fillRect(x, y, w, h);
  drawSkyline(ctx, preset, x, y + h * 0.25, w, h * 0.75, seed + 5);
  ctx.restore();
  ctx.strokeStyle = preset.ink;
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.strokeRect(x, y, w, h);
}

/**
 * Paints the cover. state:
 * { photos: [slot0..slot3] ({img,zoom,fx,fy,ox,oy}|null),
 *   preset: 'sunset'|'neon'|'coastal', headline, subtitle, issue,
 *   align: 'left'|'center'|'right', grade: {...} }
 * Stores the panel rects on canvas._layout for editor hit-testing.
 */
export function drawCover(canvas, state) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  const preset = PRESETS[state.preset] ?? PRESETS.sunset;
  const L = coverLayout(W, H);
  const photos = state.photos ?? [];
  const issue = String(state.issue ?? '07').padStart(2, '0');
  const seed = 1234 + issue.charCodeAt(0) * 31 + issue.charCodeAt(1);

  // Background sky.
  ctx.fillStyle = skyGradient(ctx, preset, 0, 0, W, H);
  ctx.fillRect(0, 0, W, H);

  // Header: dossier labels + issue number.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${Math.max(11, Math.round(L.header.h * 0.42))}px ${FONT_STACK}`;
  try { ctx.letterSpacing = `${Math.max(2, W * 0.003)}px`; } catch { /* ignore */ }
  ctx.fillStyle = preset.header;
  ctx.fillText('LEONIDA  •  VICE CITY', L.header.x, L.header.y + L.header.h * 0.68);
  ctx.textAlign = 'right';
  ctx.fillText(`CASE FILE  No. ${issue}`, L.header.x + L.header.w, L.header.y + L.header.h * 0.68);
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  ctx.fillStyle = preset.accent;
  ctx.fillRect(L.header.x, L.header.y + L.header.h + L.g * 0.4, L.header.w, Math.max(2, H * 0.002));

  // Panel photo assignment. A missing slot re-uses slot 0 at a tighter,
  // shifted crop (a different detail of the same photo); with no photo
  // at all the panel becomes drawn graphic art.
  const heroPhoto = photos[0] ?? null;
  const detail = (shift) => (heroPhoto
    ? { ...heroPhoto, zoom: (heroPhoto.zoom ?? 1) * 1.7, fx: shift, fy: 0.38, ox: 0, oy: 0 }
    : null);
  drawPhotoPanel(ctx, preset, L.hero, heroPhoto, state.grade, seed);
  drawPhotoPanel(ctx, preset, L.midA, photos[1] ?? detail(0.72), state.grade, seed + 101);
  if (photos[2]) {
    drawPhotoPanel(ctx, preset, L.midB, photos[2], state.grade, seed + 202);
  } else {
    drawGraphicPanel(ctx, preset, L.midB, seed + 202, issue);
  }
  // Strip under the headline: 4th photo, else a quiet skyline band
  // (gradient + silhouette only — no sun, so the footer labels stay clean).
  const strip = { x: L.m, y: L.footer.y, w: L.footer.w, h: Math.max(8, L.footer.h) };
  if (photos[3]) drawPhotoPanel(ctx, preset, strip, photos[3], state.grade, seed + 303);
  else drawStripBand(ctx, preset, strip, seed + 303);

  // Vertical dossier label down the hero's left edge, sized to fit the
  // hero's height exactly (never spilling into the header).
  ctx.save();
  ctx.translate(L.hero.x + Math.max(10, W * 0.014), L.hero.y + L.hero.h - Math.max(10, W * 0.014));
  ctx.rotate(-Math.PI / 2);
  const vText = 'VICE CITY  —  PERSONAL CRIME DOSSIER';
  let vSize = Math.max(10, Math.round(H * 0.016));
  ctx.font = `700 ${vSize}px ${FONT_STACK}`;
  try { ctx.letterSpacing = '3px'; } catch { /* ignore */ }
  while (ctx.measureText(vText).width > L.hero.h - Math.max(20, W * 0.028) && vSize > 8) {
    vSize -= 1;
    ctx.font = `700 ${vSize}px ${FONT_STACK}`;
  }
  ctx.fillStyle = preset.paper;
  ctx.textAlign = 'left';
  ctx.fillText(vText, 0, 0);
  ctx.restore();
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }

  // Headline band.
  ctx.fillStyle = preset.band;
  ctx.fillRect(L.headline.x - L.g, L.headline.y - L.g * 0.5, L.headline.w + L.g * 2, L.headline.h + L.g);
  drawHeadline(ctx, preset, L.headline, state.headline || 'VICE CITY', state.subtitle || '', state.align || 'left');

  // Footer strip labels, over a dark scrim so they read on any strip art.
  ctx.fillStyle = 'rgba(13, 10, 31, 0.55)';
  ctx.fillRect(L.footer.x, L.footer.y, L.footer.w, L.footer.h);
  ctx.font = `700 ${Math.max(10, Math.round(H * 0.014))}px ${FONT_STACK}`;
  ctx.fillStyle = preset.paper;
  ctx.textAlign = 'left';
  ctx.fillText('100% LOCAL  •  PHOTOS NEVER LEAVE THIS MACHINE', L.footer.x, L.footer.y + L.footer.h * 0.72);
  ctx.textAlign = 'right';
  ctx.fillText('VICE CITY MULTI-PANEL COMPOSER', L.footer.x + L.footer.w, L.footer.y + L.footer.h * 0.72);

  drawVignette(ctx, W, H);
  drawGrain(ctx, W, H, seed + 999);

  canvas._layout = { ...L, panels: { hero: L.hero, midA: L.midA, midB: L.midB, strip } };
  return L;
}

/** Renders a fresh canvas at exactly w x h. Used by exports and tests. */
export function renderCover(w, h, state) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  drawCover(c, state);
  return c;
}
