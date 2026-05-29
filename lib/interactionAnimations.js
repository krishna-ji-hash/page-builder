/**
 * Entrance / emphasis animation presets for style_json.interactions.animation
 * (builder canvas, draft preview, published live — keyframes in live-site.css).
 * Transform + opacity only for performance.
 */

/** @typedef {{ id: string, label: string, group: string, defaultDuration?: number, defaultDelay?: number, defaultEasing?: string, defaultTrigger?: string, legacyIds?: string[] }} AnimationPresetDef */

/** @type {AnimationPresetDef[]} */
export const BUILTIN_ANIMATION_DEFINITIONS = [
  { id: 'fade-in', label: 'Fade in', group: 'Entrance', defaultTrigger: 'on-enter-viewport' },
  { id: 'fade-up', label: 'Fade up', group: 'Entrance', defaultTrigger: 'on-enter-viewport' },
  { id: 'fade-down', label: 'Fade down', group: 'Entrance', defaultTrigger: 'on-enter-viewport' },
  { id: 'slide-left', label: 'Slide left', group: 'Entrance', defaultTrigger: 'on-enter-viewport' },
  { id: 'slide-right', label: 'Slide right', group: 'Entrance', defaultTrigger: 'on-enter-viewport' },
  { id: 'zoom-in', label: 'Zoom in', group: 'Entrance', defaultTrigger: 'on-enter-viewport' },
  { id: 'zoom-out', label: 'Zoom out', group: 'Entrance', defaultTrigger: 'on-enter-viewport' },
  { id: 'bounce-soft', label: 'Bounce soft', group: 'Emphasis', defaultTrigger: 'on-load' },
  { id: 'pulse-soft', label: 'Pulse soft', group: 'Emphasis', defaultTrigger: 'on-hover', defaultDuration: 1.2 },
  { id: 'reveal', label: 'Reveal', group: 'Entrance', defaultTrigger: 'on-enter-viewport' },
  { id: 'stagger', label: 'Stagger', group: 'Entrance', defaultTrigger: 'on-enter-viewport', defaultDuration: 0.8 },
];

/** @type {{ group: string, presets: AnimationPresetDef[] }[]} */
export const ANIMATION_PRESET_GROUPS = [
  { group: 'Entrance', presets: BUILTIN_ANIMATION_DEFINITIONS.filter((p) => p.group === 'Entrance') },
  { group: 'Emphasis', presets: BUILTIN_ANIMATION_DEFINITIONS.filter((p) => p.group === 'Emphasis') },
];

export const ANIMATION_TRIGGER_OPTIONS = [
  { id: 'on-load', label: 'On load' },
  { id: 'on-scroll', label: 'On scroll' },
  { id: 'on-enter-viewport', label: 'On enter viewport' },
  { id: 'on-hover', label: 'On hover' },
  { id: 'on-click', label: 'On click' },
  { id: 'on-focus', label: 'On focus' },
];

const PRESET_BY_ID = new Map();
const LEGACY_TO_ID = new Map();

for (const p of BUILTIN_ANIMATION_DEFINITIONS) {
  PRESET_BY_ID.set(p.id, p);
}

const LEGACY_MAP = {
  fade: 'fade-in',
  pop: 'fade-in',
  'slide-from-top': 'fade-down',
  'slide-from-bottom': 'fade-up',
  'slide-up': 'fade-up',
  'slide-down': 'fade-down',
  'slide-from-left': 'slide-left',
  'slide-from-right': 'slide-right',
  zoom: 'zoom-in',
  'bounce-in': 'bounce-soft',
  pulse: 'pulse-soft',
  float: 'pulse-soft',
  glow: 'reveal',
  shimmer: 'reveal',
};

for (const [legacy, id] of Object.entries(LEGACY_MAP)) {
  LEGACY_TO_ID.set(legacy, id);
}

for (const p of BUILTIN_ANIMATION_DEFINITIONS) {
  for (const legacy of p.legacyIds || []) {
    LEGACY_TO_ID.set(legacy, p.id);
  }
}

/** Flat list for inspector (includes None). */
export function animationPresetOptionsForInspector() {
  return [{ id: 'none', label: 'None', group: '' }, ...BUILTIN_ANIMATION_DEFINITIONS];
}

/** Map legacy preset ids to current canonical id. */
export function normalizeAnimationPreset(preset) {
  const raw = String(preset || 'none').trim() || 'none';
  if (raw === 'none') return 'none';
  if (PRESET_BY_ID.has(raw)) return raw;
  if (LEGACY_TO_ID.has(raw)) return LEGACY_TO_ID.get(raw);
  return 'fade-in';
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
