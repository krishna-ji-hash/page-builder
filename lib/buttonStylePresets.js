/**
 * Button style presets — replace visual groups (not shallow merge) so gradient/glass/etc. do not stack.
 */
import { getDeviceStyle } from './styleToCss.js';
import { normalizeResponsiveStyle } from './styleNormalizer.js';
import { stripNaNFromStyleJson } from './inspectorNumeric.js';
import { BUTTON_STYLE_PRESETS } from './stylePresets.js';

export { BUTTON_STYLE_PRESETS };

/** Display order in inspector chip grid. */
export const BUTTON_PRESET_ORDER = [
  'primary',
  'secondary',
  'outline',
  'ghost',
  'gradient',
  'glass',
  'pill',
  'soft',
  'dark',
  'success',
  'danger',
  'warning',
  'link',
  'neon',
];

export const BUTTON_PRESET_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  outline: 'Outline',
  ghost: 'Ghost',
  gradient: 'Gradient',
  glass: 'Glass',
  pill: 'Pill',
  soft: 'Soft',
  dark: 'Dark',
  success: 'Success',
  danger: 'Danger',
  warning: 'Warning',
  link: 'Link',
  neon: 'Neon',
};

const VISUAL_GROUPS = ['colors', 'background', 'border', 'effects', 'spacing'];

const VISUAL_KEYS = {
  colors: ['text', 'textColor', 'background', 'backgroundColor'],
  background: [
    'backgroundColor',
    'backgroundImage',
    'backgroundSize',
    'backgroundPosition',
    'backgroundRepeat',
    'blendMode',
  ],
  border: ['radius', 'width', 'color', 'style'],
  effects: ['boxShadow', 'backdropFilter', 'opacity', 'blur'],
  spacing: ['padding'],
  typography: ['fontWeight', 'fontFamily', 'textDecoration'],
};

function omitEmptyGroup(obj) {
  if (!obj || typeof obj !== 'object') return undefined;
  const next = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v != null && v !== '') next[k] = v;
  }
  return Object.keys(next).length ? next : undefined;
}

/** Remove preset-controlled visual keys so theme defaults apply again. */
export function stripButtonVisualStyle(deviceStyle = {}) {
  const next = { ...deviceStyle };
  for (const [group, keys] of Object.entries(VISUAL_KEYS)) {
    if (!next[group]) continue;
    const g = { ...next[group] };
    keys.forEach((k) => delete g[k]);
    const cleaned = omitEmptyGroup(g);
    if (cleaned) next[group] = cleaned;
    else delete next[group];
  }
  return next;
}

/** Replace button visual groups with a preset patch (clears conflicting keys first). */
export function replaceButtonVisualStyle(deviceStyle = {}, presetPatch = {}) {
  const next = stripButtonVisualStyle(deviceStyle);
  for (const group of VISUAL_GROUPS) {
    const patchGroup = presetPatch[group];
    if (!patchGroup || typeof patchGroup !== 'object') continue;
    next[group] = { ...(next[group] || {}), ...omitEmptyGroup(patchGroup) };
  }
  if (presetPatch.typography && typeof presetPatch.typography === 'object') {
    const typoPatch = {};
    for (const key of VISUAL_KEYS.typography) {
      if (presetPatch.typography[key] != null && presetPatch.typography[key] !== '') {
        typoPatch[key] = presetPatch.typography[key];
      }
    }
    if (Object.keys(typoPatch).length) {
      next.typography = { ...(next.typography || {}), ...typoPatch };
    }
  }
  return next;
}

function buildGroupOverride(baseGroup = {}, nextGroup = {}) {
  const base = baseGroup && typeof baseGroup === 'object' ? baseGroup : {};
  const next = nextGroup && typeof nextGroup === 'object' ? nextGroup : {};
  const keys = new Set([...Object.keys(base), ...Object.keys(next)]);
  const out = {};
  for (const key of keys) {
    const nextVal = next[key];
    const baseVal = base[key];
    if (nextVal !== baseVal) {
      out[key] = nextVal === undefined ? null : nextVal;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Apply or reset a button preset on the active device layer (desktop / tablet / mobile).
 * @param {object|null|undefined} styleJson
 * @param {'desktop'|'tablet'|'mobile'} device
 * @param {object|null|undefined} presetPatch
 * @param {object|null|undefined} siteTheme
 * @param {{ reset?: boolean }} [options]
 */
export function applyButtonStylePresetToStyleJson(styleJson, device, presetPatch, siteTheme, options = {}) {
  const normalized = normalizeResponsiveStyle(styleJson || {}, { nodeType: 'button', siteTheme });
  const desktopBase = normalized.desktop || {};
  const currentDevice = getDeviceStyle(normalized, device) || {};

  const merged = options.reset
    ? stripButtonVisualStyle({ ...currentDevice })
    : replaceButtonVisualStyle({ ...currentDevice }, presetPatch || {});

  const next = { ...normalized, desktop: desktopBase };

  if (device === 'desktop') {
    next.desktop = merged;
    return stripNaNFromStyleJson(next);
  }

  const override = {};
  for (const group of [...VISUAL_GROUPS, 'typography']) {
    const ov = buildGroupOverride(desktopBase[group], merged[group]);
    if (ov) override[group] = ov;
  }

  next[device] = override;
  Object.keys(next[device]).forEach((group) => {
    if (!next[device][group]) delete next[device][group];
  });

  return stripNaNFromStyleJson(next);
}

export function buttonPresetLabel(presetId) {
  return BUTTON_PRESET_LABELS[presetId] || String(presetId || '').replace(/([A-Z])/g, ' $1').trim();
}

export function listButtonPresetIds() {
  const known = new Set(BUTTON_PRESET_ORDER);
  const extras = Object.keys(BUTTON_STYLE_PRESETS).filter((id) => !known.has(id));
  return [...BUTTON_PRESET_ORDER.filter((id) => BUTTON_STYLE_PRESETS[id]), ...extras];
}
