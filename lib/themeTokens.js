import { normalizeSiteTheme } from './siteDesignTheme.js';

/**
 * Project-level design tokens stored on `projects.config_json.themeTokens`.
 *
 * - `mode`: `light` | `dark` — selects active palette
 * - `light` / `dark`: per-mode token layers (colors, typography, spacing, …)
 * - Legacy: flat `colors`, `typography`, … on the root when `light`/`dark` are absent
 *
 * Exposed as CSS variables: `--token-*` via `themeTokensToCssVariableStyle` (uses active palette).
 */

export const THEME_TOKENS_SCHEMA_VERSION = 1;

export const TOKEN_LAYER_KEYS = [
  'colors',
  'gradients',
  'typography',
  'spacing',
  'radius',
  'shadows',
  'containers',
  'zIndex',
  'motion',
];

function tokenKeyToKebab(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-z0-9-]/gi, '-')
    .toLowerCase();
}

export const DEFAULT_THEME_TOKENS = {
  schemaVersion: THEME_TOKENS_SCHEMA_VERSION,
  revision: 0,
  mode: 'light',
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#22c55e',
    background: '#ffffff',
    surface: '#ffffff',
    muted: '#94a3b8',
    text: '#0f172a',
    border: '#e2e8f0',
    onPrimary: '#ffffff',
    success: '#16a34a',
    successBg: '#ecfdf5',
    warning: '#f59e0b',
    warningBg: '#fffbeb',
    error: '#ef4444',
    errorBg: '#fef2f2',
    info: '#2563eb',
    infoBg: '#eff6ff',
  },
  gradients: {
    hero: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    surface: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
    section:
      'linear-gradient(145deg, #f8fafc 0%, #ffffff 45%, #f1f5f9 100%)',
  },
  typography: {
    fontFamilyBody: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    fontFamilyHeading: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSizeBase: '16px',
    lineHeightBase: '1.5',
    weightNormal: '400',
    weightMedium: '500',
    weightBold: '700',
  },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '40px' },
  radius: { sm: '8px', md: '12px', lg: '16px', xl: '24px', pill: '999px' },
  shadows: {
    sm: '0 2px 8px rgba(15, 23, 42, 0.10)',
    md: '0 10px 24px rgba(15, 23, 42, 0.14)',
    lg: '0 18px 42px rgba(15, 23, 42, 0.16)',
  },
  containers: { contentMaxWidth: '1200px' },
  zIndex: { base: 1, dropdown: 9000, modal: 12000, toast: 13000 },
  motion: {
    fast: '140ms',
    base: '200ms',
    slow: '320ms',
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
};

/** Default dark palette color overrides when bootstrapping `themeTokens.dark`. */
export const DEFAULT_DARK_TOKEN_COLORS = {
  primary: '#60a5fa',
  secondary: '#94a3b8',
  accent: '#4ade80',
  background: '#0f172a',
  surface: '#1e293b',
  muted: '#94a3b8',
  text: '#f1f5f9',
  border: '#334155',
  onPrimary: '#0f172a',
  success: '#4ade80',
  successBg: '#052e16',
  warning: '#fbbf24',
  warningBg: '#422006',
  error: '#f87171',
  errorBg: '#450a0a',
  info: '#60a5fa',
  infoBg: '#172554',
};

export const DEFAULT_DARK_TOKEN_GRADIENTS = {
  hero: 'linear-gradient(135deg, #0b1220 0%, #0f172a 55%, #1a293b 100%)',
  surface: 'linear-gradient(145deg, #05080f 0%, #0f172a 45%, #1e293b 100%)',
  section: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
};

const DEFAULT_LAYER_GROUPS = TOKEN_LAYER_KEYS.reduce((acc, key) => {
  if (DEFAULT_THEME_TOKENS[key]) acc[key] = DEFAULT_THEME_TOKENS[key];
  return acc;
}, {});

function isPlainObject(v) {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v));
}

/** @param {object|null|undefined} src */
export function hasModePalettes(src) {
  return isPlainObject(src?.light) || isPlainObject(src?.dark);
}

/** Legacy flat layers on the root (not under `light` / `dark`). */
export function extractFlatTokenLayers(src) {
  if (!isPlainObject(src)) return {};
  const out = {};
  for (const key of TOKEN_LAYER_KEYS) {
    if (isPlainObject(src[key])) out[key] = src[key];
  }
  return out;
}

/** Deep-merge token layer groups; later sources win per key. */
export function mergeTokenLayerGroups(...sources) {
  const out = {};
  for (const key of TOKEN_LAYER_KEYS) {
    let merged = { ...(DEFAULT_LAYER_GROUPS[key] || {}) };
    for (const src of sources) {
      if (!isPlainObject(src)) continue;
      if (isPlainObject(src[key])) merged = { ...merged, ...src[key] };
    }
    out[key] = merged;
  }
  return out;
}

/** Normalize one mode palette object (`light` or `dark` child). */
export function normalizeTokenPalette(input) {
  const src = isPlainObject(input) ? input : {};
  return mergeTokenLayerGroups(src);
}

/**
 * Resolved layers for the active `mode` (builder, preview, live).
 * @param {object|null|undefined} input — raw `themeTokens` from config
 * @returns {{ mode: 'light'|'dark' } & Record<string, object>}
 */
export function resolveActiveThemeTokens(input) {
  const src = isPlainObject(input) ? input : {};
  const mode = src.mode === 'dark' ? 'dark' : 'light';
  const flat = extractFlatTokenLayers(src);

  if (!hasModePalettes(src)) {
    return { mode, ...mergeTokenLayerGroups(flat) };
  }

  const inactiveKey = mode === 'dark' ? 'light' : 'dark';
  const inactivePalette = isPlainObject(src[inactiveKey]) ? src[inactiveKey] : {};
  const activePalette = isPlainObject(src[mode]) ? src[mode] : {};
  return {
    mode,
    ...mergeTokenLayerGroups(inactivePalette, flat, activePalette),
  };
}

/**
 * Bootstrap `light` / `dark` palettes from legacy flat tokens (first mode switch in UI).
 * @param {object|null|undefined} src
 */
function darkPaletteColorsFromFlat(flatColors = {}) {
  const brand = {};
  if (flatColors.primary) brand.primary = flatColors.primary;
  if (flatColors.secondary) brand.secondary = flatColors.secondary;
  if (flatColors.accent) brand.accent = flatColors.accent;
  if (flatColors.onPrimary) brand.onPrimary = flatColors.onPrimary;
  return {
    ...DEFAULT_DARK_TOKEN_COLORS,
    ...brand,
    background: DEFAULT_DARK_TOKEN_COLORS.background,
    surface: DEFAULT_DARK_TOKEN_COLORS.surface,
    text: DEFAULT_DARK_TOKEN_COLORS.text,
    muted: DEFAULT_DARK_TOKEN_COLORS.muted,
    border: DEFAULT_DARK_TOKEN_COLORS.border,
  };
}

export function createModePalettesFromFlat(src) {
  const flatOnly = extractFlatTokenLayers(src);
  return {
    light: normalizeTokenPalette(flatOnly),
    dark: normalizeTokenPalette({
      ...flatOnly,
      colors: darkPaletteColorsFromFlat(flatOnly.colors || {}),
      gradients: { ...DEFAULT_DARK_TOKEN_GRADIENTS },
    }),
  };
}

export function normalizeThemeTokens(input, options = {}) {
  const { defaultRevision = 0, defaultSchemaVersion = THEME_TOKENS_SCHEMA_VERSION } = options;
  const src = isPlainObject(input) ? input : {};
  const schemaOk =
    typeof src.schemaVersion === 'number' && Number.isFinite(src.schemaVersion) && src.schemaVersion >= 1;
  const revOk = typeof src.revision === 'number' && Number.isFinite(src.revision) && src.revision >= 0;
  const mode = src.mode === 'dark' ? 'dark' : 'light';

  const out = {
    schemaVersion: schemaOk ? Math.floor(src.schemaVersion) : defaultSchemaVersion,
    revision: revOk ? Math.floor(src.revision) : defaultRevision,
    mode,
  };

  if (hasModePalettes(src)) {
    if (isPlainObject(src.light)) out.light = normalizeTokenPalette(src.light);
    if (isPlainObject(src.dark)) out.dark = normalizeTokenPalette(src.dark);
    return out;
  }

  const flat = mergeTokenLayerGroups(extractFlatTokenLayers(src));
  for (const key of TOKEN_LAYER_KEYS) {
    out[key] = flat[key];
  }
  return out;
}

function addGroupVars(out, prefix, group) {
  if (!isPlainObject(group)) return;
  for (const [k, v] of Object.entries(group)) {
    if (v === undefined || v === null || v === '') continue;
    out[`--token-${prefix}-${tokenKeyToKebab(k)}`] = String(v);
  }
}

/**
 * When `siteTheme.presetId` and `themeTokens.mode` disagree, prefer the site preset so
 * preview/live page background matches the builder canvas (avoids light token bg + dark site text).
 * @param {object|null|undefined} siteTheme
 * @param {object|null|undefined} themeTokens
 */
export function alignThemeTokensWithSiteTheme(siteTheme, themeTokens) {
  const siteMode = normalizeSiteTheme(siteTheme).presetId === 'dark' ? 'dark' : 'light';
  const tokens = normalizeThemeTokens(themeTokens);
  if (tokens.mode === siteMode) return tokens;
  const withPalettes = hasModePalettes(tokens)
    ? tokens
    : { ...tokens, ...createModePalettesFromFlat(tokens) };
  return normalizeThemeTokens({ ...withPalettes, mode: siteMode });
}

/** Inline style object for builder root + live wrapper (active palette only). */
export function themeTokensToCssVariableStyle(themeTokens) {
  const t = resolveActiveThemeTokens(themeTokens);
  const out = {
    '--token-mode': t.mode,
  };
  addGroupVars(out, 'color', t.colors);
  addGroupVars(out, 'gradient', t.gradients);
  addGroupVars(out, 'font', t.typography);
  addGroupVars(out, 'space', t.spacing);
  addGroupVars(out, 'radius', t.radius);
  addGroupVars(out, 'shadow', t.shadows);
  addGroupVars(out, 'container', t.containers);
  addGroupVars(out, 'z', t.zIndex);
  addGroupVars(out, 'motion', t.motion);
  return out;
}

/** Convenience resolver: `token-foo` -> `var(--token-foo)` */
export function coerceTokenRef(value) {
  if (value == null || value === '') return value;
  const s = String(value).trim();
  if (!s) return value;
  if (s.startsWith('var(--token-')) return s;
  if (/^token-[a-z0-9-]+$/i.test(s)) return `var(--${s})`;
  return value;
}
