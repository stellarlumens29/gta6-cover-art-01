// Recorded re-attribution pass — 19 Nov 2026 (sealed recording session).
// Fixed scenes for screenshots and QA: ?shot=cover shows the cover alone
// (controls hidden), ?shot=editor shows the app with photos loaded.
// Query params: preset=sunset|neon|coastal, ratio=square|portrait|wide,
// photo=pier|boulevard, photo2=..., caption=..., subtitle=..., issue=...
// ?qa=export renders all 3 export sizes and reports exact pixel dims;
// ?qa=photos renders covers from 6 synthetic photo types (portrait,
// landscape, dark, bright, close-up, full-body) across all 3 sizes.
// window.__shotReady is set once painted.
import { EXPORT_SIZES } from './presets.js';

function setReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

function fakePhoto(kind) {
  // Synthetic test photo (canvas, not shipped content): distinct size and
  // exposure per kind so the renderer is exercised, not just the samples.
  const specs = {
    portrait: [600, 900, '#3a6ea5', '#f2c14e'],
    landscape: [1200, 700, '#c25e3a', '#2e4a3a'],
    dark: [800, 800, '#14101f', '#3a2a5e'],
    bright: [900, 700, '#ffe9a8', '#ff8a5e'],
    closeup: [500, 500, '#7a2a3a', '#e8b4c2'],
    fullbody: [500, 1000, '#2a5e4a', '#c2e8d2'],
  };
  const [w, h, c1, c2] = specs[kind];
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(w * 0.5, h * 0.32, w * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(w * 0.32, h * 0.48, w * 0.36, h * 0.45);
  // Expose naturalWidth/Height like an <img>.
  return { img: c, zoom: 1, fx: 0.5, fy: 0.42, ox: 0, oy: 0 };
}

export async function runShot(query, app) {
  const { state, loadSample, redraw, coverState, renderCover, statusEl } = app;
  const shot = query.get('shot');
  const qa = query.get('qa');
  if (query.get('preset')) state.preset = query.get('preset');
  if (query.get('ratio')) state.ratio = query.get('ratio');
  if (query.get('caption')) { state.headline = query.get('caption'); document.getElementById('headline').value = state.headline; }
  if (query.get('subtitle')) { state.subtitle = query.get('subtitle'); document.getElementById('subtitle').value = state.subtitle; }
  if (query.get('issue')) { state.issue = query.get('issue'); document.getElementById('issue').value = state.issue; }

  if (qa === 'export' || qa === 'photos') {
    const lines = [];
    const kinds = qa === 'photos'
      ? ['portrait', 'landscape', 'dark', 'bright', 'closeup', 'fullbody']
      : [null];
    for (const kind of kinds) {
      if (kind) state.photos = [fakePhoto(kind), fakePhoto('landscape'), null, null];
      else { await loadSample('pier', 0); await loadSample('boulevard', 1); }
      for (const s of EXPORT_SIZES) {
        const c = renderCover(s.w, s.h, coverState());
        const ok = c.width === s.w && c.height === s.h;
        lines.push(`${qa} ${kind ?? 'samples'} ${s.w}x${s.h}: ${ok ? 'OK' : 'FAIL'} canvas=${c.width}x${c.height}`);
      }
    }
    const el = document.getElementById('qa');
    el.hidden = false;
    el.textContent = lines.join('\n');
    document.title = lines.every((l) => l.includes('OK')) ? 'QA PASS' : 'QA FAIL';
    redraw();
    setReady();
    return;
  }

  // Screenshot scenes: load the requested photos, then paint.
  await loadSample(query.get('photo') ?? 'pier', 0);
  if (query.get('photo2')) await loadSample(query.get('photo2'), 1);
  else if (shot === 'editor') await loadSample('boulevard', 1);
  // Optional per-shot focal overrides (wide bands need the face, which
  // sits near the top of a portrait photo): ?fy=0.16&fy2=0.2.
  if (query.get('fy') && state.photos[0]) state.photos[0].fy = Number(query.get('fy'));
  if (query.get('fy2') && state.photos[1]) state.photos[1].fy = Number(query.get('fy2'));
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (statusEl) statusEl.textContent = 'Sample photos loaded — 100% local, nothing uploaded.';
  redraw();
  setReady();
}
