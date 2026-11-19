// Recorded re-attribution pass — 19 Nov 2026 (sealed recording session).
// Vice City Multi-Panel Photo Composer — art direction presets.
// Three original, deterministic presets. Each one fixes the typography
// hierarchy, panel geometry, colour treatment and graphic-panel scene, so
// the cover looks art-directed before the user touches anything.
// No Rockstar artwork, logos or fonts anywhere: every shape below is drawn
// from scratch on canvas.

export const PRESETS = {
  sunset: {
    id: 'sunset',
    name: 'Sunset Dossier',
    blurb: 'Pink-orange sunset into deep violet. Warm file-card dossier.',
    sky: ['#ff9e5e', '#ff5e7a', '#c22e7a', '#4a1e63', '#241239'],
    sun: '#ffd9a0',
    sunCore: '#fff3d6',
    ink: '#241239',
    paper: '#fff6e8',
    band: '#241239',
    header: '#fff6e8',
    headline: '#fff6e8',
    headlineShadow: '#ff2e7e',
    accent: '#2de2ff',
    accent2: '#ffb03a',
    label: '#ffd9a0',
    gutter: '#fff6e8',
    grade: { saturate: 1.25, contrast: 1.08, brightness: 1.02, sepia: 0.18, warmth: 8 },
    tint: 'rgba(255, 94, 122, 0.16)',
    tintMode: 'overlay',
    headlineGlow: 0,
  },
  neon: {
    id: 'neon',
    name: 'Neon Nightlife',
    blurb: 'Midnight violet, magenta + cyan neon. After-dark Vice City.',
    sky: ['#12082b', '#2a0f4d', '#571b6e', '#0d0a1f'],
    sun: '#ff2ea6',
    sunCore: '#ff7ad0',
    ink: '#0d0a1f',
    paper: '#eaf6ff',
    band: '#0d0a1f',
    header: '#eaf6ff',
    headline: '#ffffff',
    headlineShadow: '#ff2ea6',
    accent: '#2de2ff',
    accent2: '#ff2ea6',
    label: '#7df3ff',
    gutter: '#0d0a1f',
    grade: { saturate: 1.45, contrast: 1.18, brightness: 0.98, sepia: 0, warmth: -14 },
    tint: 'rgba(64, 20, 160, 0.22)',
    tintMode: 'overlay',
    headlineGlow: 26,
  },
  coastal: {
    id: 'coastal',
    name: 'Coastal Crime Editorial',
    blurb: 'Teal sea, coral sun, clean editorial rules. Magazine cover.',
    sky: ['#bfeee2', '#7fd4c0', '#2e9d8a', '#14655c', '#0c3a3f'],
    sun: '#ff6b4a',
    sunCore: '#ffd23a',
    ink: '#0c3a3f',
    paper: '#f7f3e8',
    band: '#f7f3e8',
    header: '#0c3a3f',
    headline: '#0c3a3f',
    headlineShadow: '#ff6b4a',
    accent: '#ff6b4a',
    accent2: '#2e9d8a',
    label: '#0c3a3f',
    gutter: '#f7f3e8',
    grade: { saturate: 1.12, contrast: 1.05, brightness: 1.04, sepia: 0.08, warmth: 2 },
    tint: 'rgba(46, 157, 138, 0.12)',
    tintMode: 'soft-light',
    headlineGlow: 0,
  },
};

export const PRESET_ORDER = ['sunset', 'neon', 'coastal'];

// Post sizes the brief names. Every export is a real canvas render at
// exactly these pixels — no upscale, no CSS screenshot.
export const EXPORT_SIZES = [
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
];

export function sizeFor(id) {
  return EXPORT_SIZES.find((s) => s.id === id) ?? EXPORT_SIZES[0];
}

// Deterministic PRNG (mulberry32) so grain/halftone are identical on
// every render of the same cover.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
