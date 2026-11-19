// Recorded re-attribution pass — 19 Nov 2026 (sealed recording session).
// Vice City Multi-Panel Photo Composer — editor wiring.
// Photo upload (file input, object URLs — the file never leaves the
// machine), drag reposition + wheel zoom on the preview, slot swap,
// preset / ratio / words / grade controls, and instant Canvas PNG export
// at 1080x1080, 1080x1350 and 1920x1080. `?shot=` scenes live in shots.js.
import { drawCover, renderCover } from './cover.js';
import { PRESETS, PRESET_ORDER, EXPORT_SIZES, sizeFor } from './presets.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const ratioLabel = document.getElementById('ratio-label');

const SLOT_NAMES = ['Hero — top panel', 'Second — middle panel', 'Third — graphic / photo', 'Fourth — bottom strip'];

const state = {
  photos: [null, null, null, null],
  preset: 'sunset',
  ratio: 'square',
  headline: 'Sunset Heist',
  subtitle: 'One last job on Ocean Drive',
  issue: '07',
  align: 'left',
  warmthDelta: 0,
  contrastFactor: 1,
  saturationFactor: 1,
};
let selectedSlot = 0;

function grade() {
  const p = PRESETS[state.preset];
  return {
    saturate: p.grade.saturate * state.saturationFactor,
    contrast: p.grade.contrast * state.contrastFactor,
    brightness: p.grade.brightness,
    sepia: p.grade.sepia,
    warmth: p.grade.warmth + state.warmthDelta,
  };
}

function coverState() {
  return {
    photos: state.photos,
    preset: state.preset,
    headline: state.headline,
    subtitle: state.subtitle,
    issue: state.issue,
    align: state.align,
    grade: grade(),
  };
}

function applyRatio() {
  const s = sizeFor(state.ratio);
  canvas.width = s.w;
  canvas.height = s.h;
  ratioLabel.textContent = `${state.ratio === 'square' ? 'Square' : state.ratio === 'portrait' ? 'Portrait' : 'Wide'} ${s.w} × ${s.h}`;
  document.querySelectorAll('.ratio-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ratio === state.ratio)));
}

function redraw() {
  applyRatio();
  drawCover(canvas, coverState());
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSample(name, slot) {
  const img = await loadImage(`samples/${name}.jpg`);
  state.photos[slot] = { img, zoom: 1, fx: 0.5, fy: 0.35, ox: 0, oy: 0 };
  renderSlots();
  redraw();
}

// ---- slots ---------------------------------------------------------------
const slotsEl = document.getElementById('slots');
function renderSlots() {
  slotsEl.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const div = document.createElement('div');
    div.className = 'slot' + (i === selectedSlot ? ' selected' : '');
    div.innerHTML = `<div class="slot-name">SLOT ${i + 1} · ${SLOT_NAMES[i].toUpperCase()}</div>
      <div class="slot-state">${photo ? 'photo loaded — drag on the cover to move it' : 'empty — 1-photo covers reuse the hero at a tighter crop'}</div>`;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('aria-label', `Photo for slot ${i + 1}`);
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      selectedSlot = i;
      state.photos[i] = { img: await loadImage(URL.createObjectURL(file)), zoom: 1, fx: 0.5, fy: 0.35, ox: 0, oy: 0 };
      statusEl.textContent = `Slot ${i + 1}: ${file.name} loaded — 100% local, nothing uploaded.`;
      renderSlots();
      redraw();
    });
    div.appendChild(input);
    if (photo) {
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'slot-clear';
      clear.textContent = 'Remove photo';
      clear.addEventListener('click', (e) => { e.stopPropagation(); state.photos[i] = null; renderSlots(); redraw(); });
      div.appendChild(clear);
    }
    div.addEventListener('click', () => { selectedSlot = i; syncSlotTools(); renderSlots(); });
    slotsEl.appendChild(div);
  });
}

function syncSlotTools() {
  const p = state.photos[selectedSlot];
  document.getElementById('zoom').value = p ? p.zoom : 1;
  document.getElementById('panx').value = p ? p.ox : 0;
  document.getElementById('pany').value = p ? p.oy : 0;
}

// ---- presets / ratio -----------------------------------------------------
const presetsEl = document.getElementById('presets');
PRESET_ORDER.forEach((id) => {
  const p = PRESETS[id];
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'preset-btn';
  b.dataset.preset = id;
  b.innerHTML = `${p.name} <small>${p.blurb}</small>`;
  b.setAttribute('aria-pressed', String(id === state.preset));
  b.addEventListener('click', () => {
    state.preset = id;
    presetsEl.querySelectorAll('.preset-btn').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.preset === id)));
    redraw();
  });
  presetsEl.appendChild(b);
});

document.querySelectorAll('.ratio-btn').forEach((b) => {
  b.addEventListener('click', () => { state.ratio = b.dataset.ratio; redraw(); });
});

// ---- words / grade -------------------------------------------------------
const bindText = (id, key) => {
  document.getElementById(id).addEventListener('input', (e) => { state[key] = e.target.value; redraw(); });
};
bindText('headline', 'headline');
bindText('subtitle', 'subtitle');
bindText('issue', 'issue');
document.getElementById('align').addEventListener('change', (e) => { state.align = e.target.value; redraw(); });
document.getElementById('grade-warmth').addEventListener('input', (e) => { state.warmthDelta = Number(e.target.value); redraw(); });
document.getElementById('grade-contrast').addEventListener('input', (e) => { state.contrastFactor = Number(e.target.value); redraw(); });
document.getElementById('grade-saturation').addEventListener('input', (e) => { state.saturationFactor = Number(e.target.value); redraw(); });

// ---- slot tools ----------------------------------------------------------
document.getElementById('zoom').addEventListener('input', (e) => {
  const p = state.photos[selectedSlot];
  if (p) { p.zoom = Number(e.target.value); redraw(); }
});
document.getElementById('panx').addEventListener('input', (e) => {
  const p = state.photos[selectedSlot];
  if (p) { p.ox = Number(e.target.value); redraw(); }
});
document.getElementById('pany').addEventListener('input', (e) => {
  const p = state.photos[selectedSlot];
  if (p) { p.oy = Number(e.target.value); redraw(); }
});
const setFocal = (fx, fy) => {
  const p = state.photos[selectedSlot];
  if (p) { p.fx = fx; p.fy = fy; redraw(); }
};
document.getElementById('focal-top').addEventListener('click', () => setFocal(0.5, 0.22));
document.getElementById('focal-center').addEventListener('click', () => setFocal(0.5, 0.5));
const swap = (dir) => {
  const j = selectedSlot + dir;
  if (j < 0 || j > 3) return;
  [state.photos[selectedSlot], state.photos[j]] = [state.photos[j], state.photos[selectedSlot]];
  selectedSlot = j;
  renderSlots();
  redraw();
};
document.getElementById('swap-left').addEventListener('click', () => swap(-1));
document.getElementById('swap-right').addEventListener('click', () => swap(1));

// ---- samples -------------------------------------------------------------
document.getElementById('load-samples').addEventListener('click', async () => {
  await loadSample('pier', 0);
  await loadSample('boulevard', 1);
  statusEl.textContent = '2 sample photos loaded into slots 1–2. Drag the cover to reposition, then export.';
});
document.getElementById('load-one-sample').addEventListener('click', async () => {
  state.photos = [null, null, null, null];
  await loadSample('pier', 0);
  statusEl.textContent = '1 sample photo loaded — hero + tighter detail crops fill the other panels.';
});

// ---- export --------------------------------------------------------------
function exportSize(sizeId) {
  const s = sizeFor(sizeId);
  const t0 = performance.now();
  const c = renderCover(s.w, s.h, coverState());
  c.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${s.w}x${s.h}.png`;
    a.click();
    const ms = Math.round(performance.now() - t0);
    statusEl.textContent = `Saved vice-city-cover-${s.w}x${s.h}.png in ${ms} ms — rendered locally, nothing uploaded.`;
  }, 'image/png');
}
document.getElementById('export-square').addEventListener('click', () => exportSize('square'));
document.getElementById('export-portrait').addEventListener('click', () => exportSize('portrait'));
document.getElementById('export-wide').addEventListener('click', () => exportSize('wide'));

// ---- drag / wheel on the preview -----------------------------------------
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  const px = (clientX - r.left) * sx;
  const py = (clientY - r.top) * sy;
  const panels = canvas._layout?.panels ?? {};
  for (const [name, rect] of Object.entries(panels)) {
    if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) return name;
  }
  return 'hero';
}
const PANEL_SLOT = { hero: 0, midA: 1, midB: 2, strip: 3 };
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const panel = panelAt(e.clientX, e.clientY);
  const slot = PANEL_SLOT[panel];
  const photo = state.photos[slot] ?? state.photos[0];
  if (!photo) return;
  selectedSlot = state.photos[slot] ? slot : 0;
  syncSlotTools();
  renderSlots();
  drag = { photo, x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  drag.photo.ox += ((e.clientX - drag.x) / r.width) * 2.2;
  drag.photo.oy += ((e.clientY - drag.y) / r.height) * 2.2;
  drag.photo.ox = Math.max(-1, Math.min(1, drag.photo.ox));
  drag.photo.oy = Math.max(-1, Math.min(1, drag.photo.oy));
  drag.x = e.clientX;
  drag.y = e.clientY;
  syncSlotTools();
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = panelAt(e.clientX, e.clientY);
  const slot = PANEL_SLOT[panel];
  const photo = state.photos[slot] ?? state.photos[0];
  if (!photo) return;
  photo.zoom = Math.max(1, Math.min(3, photo.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  selectedSlot = state.photos[slot] ? slot : 0;
  syncSlotTools();
  redraw();
}, { passive: false });

// ---- boot ----------------------------------------------------------------
renderSlots();
const query = new URLSearchParams(location.search);
if (query.get('shot') || query.get('qa')) {
  runShot(query, { state, loadSample, redraw, coverState, renderCover, statusEl });
} else {
  redraw();
}
