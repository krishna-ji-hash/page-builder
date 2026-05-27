/**
 * Entrance / emphasis animation presets for style_json.interactions.animation
 * (builder canvas, draft preview, published live — keyframes in live-site.css).
 */

/** @typedef {{ id: string, label: string, group: string, legacyIds?: string[] }} AnimationPresetDef */

/** @type {AnimationPresetDef[]} */
export const ANIMATION_PRESET_GROUPS = [
  {
    group: 'Basic',
    presets: [
      { id: 'fade', label: 'Fade in', group: 'Basic' },
      { id: 'pop', label: 'Pop in', group: 'Basic' },
      { id: 'bounce-in', label: 'Bounce in', group: 'Basic' },
    ],
  },
  {
    group: 'Slide in (direction)',
    presets: [
      { id: 'slide-from-top', label: 'From top ↓', group: 'Slide in (direction)', legacyIds: ['slide-down'] },
      { id: 'slide-from-bottom', label: 'From bottom ↑', group: 'Slide in (direction)', legacyIds: ['slide-up'] },
      { id: 'slide-from-left', label: 'From left →', group: 'Slide in (direction)' },
      { id: 'slide-from-right', label: 'From right ←', group: 'Slide in (direction)' },
    ],
  },
  {
    group: 'Zoom',
    presets: [
      { id: 'zoom-in', label: 'Zoom in', group: 'Zoom', legacyIds: ['zoom'] },
      { id: 'zoom-out', label: 'Zoom out', group: 'Zoom' },
    ],
  },
  {
    group: 'Continuous',
    presets: [
      { id: 'pulse', label: 'Pulse', group: 'Continuous' },
      { id: 'float', label: 'Float', group: 'Continuous' },
      { id: 'glow', label: 'Glow', group: 'Continuous' },
      { id: 'shimmer', label: 'Shimmer', group: 'Continuous' },
    ],
  },
];

const PRESET_BY_ID = new Map();
const LEGACY_TO_ID = new Map();

for (const { presets } of ANIMATION_PRESET_GROUPS) {
  for (const p of presets) {
    PRESET_BY_ID.set(p.id, p);
    for (const legacy of p.legacyIds || []) {
      LEGACY_TO_ID.set(legacy, p.id);
    }
  }
}

/** Flat list for inspector (includes None). */
export function animationPresetOptionsForInspector() {
  return [{ id: 'none', label: 'None', group: '' }, ...Array.from(PRESET_BY_ID.values())];
}

/** Map legacy preset ids to current canonical id. */
export function normalizeAnimationPreset(preset) {
  const raw = String(preset || 'none').trim() || 'none';
  if (raw === 'none') return 'none';
  if (PRESET_BY_ID.has(raw)) return raw;
  if (LEGACY_TO_ID.has(raw)) return LEGACY_TO_ID.get(raw);
  return 'fade';
}

export function isValidAnimationPreset(preset) {
  const id = normalizeAnimationPreset(preset);
  return id === 'none' || PRESET_BY_ID.has(id);
}

/** CSS @keyframes name (without bld-ix- prefix). */
export function animationKeyframeId(preset) {
  return normalizeAnimationPreset(preset);
}

/** Full keyframes name used in animation-name. */
export function animationKeyframeName(preset) {
  const id = animationKeyframeId(preset);
  if (id === 'none') return '';
  return `bld-ix-${id}`;
}
