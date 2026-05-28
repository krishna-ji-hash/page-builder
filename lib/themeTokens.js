/**
 * Project-level design tokens stored on `projects.config_json.themeTokens`.
 *
 * - Exposed as CSS variables: `--token-*`
 * - Style values may reference them via:
 *   - `var(--token-...)` (native CSS)
 *   - `token-...` (inspector convenience; resolved to `var(--token-...)` by helpers)
 *
 * This module does NOT change renderTree; it only provides normalization + CSS var maps.
 */

export const THEME_TOKENS_SCHEMA_VERSION = 1;

export const DEFAULT_THEME_TOKENS = {
  schemaVersion: THEME_TOKENS_SCHEMA_VERSION,
  revision: 0,
  mode: 'light', // foundation for light/dark layers later
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#22c55e',
    background: '#ffffff',
    surface: '#ffffff',
    muted: '#94a3b8',
    text: '#0f172a',
    border: '#e2e8f0',
    success: '#16a34a',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  typography: {
    fontFamilyBody: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    fontFamilyHeading: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    // scale can be used by future auto-typography presets (kept as strings so CSS var is valid)
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

function isPlainObject(v) {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v));
}

export function normalizeThemeTokens(input, options = {}) {
  const { defaultRevision = 0, defaultSchemaVersion = THEME_TOKENS_SCHEMA_VERSION } = options;
  const src = isPlainObject(input) ? input : {};
  const schemaOk =
    typeof src.schemaVersion === 'number' && Number.isFinite(src.schemaVersion) && src.schemaVersion >= 1;
  const revOk = typeof src.revision === 'number' && Number.isFinite(src.revision) && src.revision >= 0;
  return {
    ...DEFAULT_THEME_TOKENS,
    schemaVersion: schemaOk ? Math.floor(src.schemaVersion) : defaultSchemaVersion,
    revision: revOk ? Math.floor(src.revision) : defaultRevision,
    mode: src.mode === 'dark' ? 'dark' : 'light',
    colors: { ...DEFAULT_THEME_TOKENS.colors, ...(isPlainObject(src.colors) ? src.colors : {}) },
    typography: { ...DEFAULT_THEME_TOKENS.typography, ...(isPlainObject(src.typography) ? src.typography : {}) },
    spacing: { ...DEFAULT_THEME_TOKENS.spacing, ...(isPlainObject(src.spacing) ? src.spacing : {}) },
    radius: { ...DEFAULT_THEME_TOKENS.radius, ...(isPlainObject(src.radius) ? src.radius : {}) },
    shadows: { ...DEFAULT_THEME_TOKENS.shadows, ...(isPlainObject(src.shadows) ? src.shadows : {}) },
    containers: { ...DEFAULT_THEME_TOKENS.containers, ...(isPlainObject(src.containers) ? src.containers : {}) },
    zIndex: { ...DEFAULT_THEME_TOKENS.zIndex, ...(isPlainObject(src.zIndex) ? src.zIndex : {}) },
    motion: { ...DEFAULT_THEME_TOKENS.motion, ...(isPlainObject(src.motion) ? src.motion : {}) },
  };
}

function addGroupVars(out, prefix, group) {
  if (!isPlainObject(group)) return;
  for (const [k, v] of Object.entries(group)) {
    if (v === undefined || v === null || v === '') continue;
    out[`--token-${prefix}-${String(k).replace(/[^a-z0-9-]/gi, '-')}`] = String(v);
  }
}

/** Inline style object for builder root + live wrapper. */
export function themeTokensToCssVariableStyle(themeTokens) {
  const t = normalizeThemeTokens(themeTokens);
  const out = {
    '--token-mode': t.mode,
  };
  addGroupVars(out, 'color', t.colors);
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

