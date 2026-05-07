/**
 * Site-wide design tokens (builder + live). Node `style_json` wins over these defaults.
 */

function isEmpty(val) {
  return val === undefined || val === null || val === '';
}

/** Deep-merge: `over` keys replace `base` only when non-empty. */
export function deepMergePreferDefined(over, base) {
  const out = { ...(base || {}) };
  for (const [k, v] of Object.entries(over || {})) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
      out[k] = deepMergePreferDefined(v, out[k] || {});
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Bump when the persisted `siteTheme` object shape changes (migrations). */
export const SITE_THEME_SCHEMA_VERSION = 1;

export const SITE_THEME_PRESETS = {
  light: {
    presetId: 'light',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      text: '#0f172a',
      muted: '#64748b',
      background: '#f8fafc',
      surface: '#ffffff',
      border: '#e2e8f0',
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontFamilyHeading: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSizeBase: '16px',
      lineHeight: '1.5',
      fontWeightNormal: '400',
      fontWeightBold: '700',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  },
  dark: {
    presetId: 'dark',
    colors: {
      primary: '#60a5fa',
      secondary: '#94a3b8',
      text: '#f1f5f9',
      muted: '#94a3b8',
      background: '#0f172a',
      surface: '#1e293b',
      border: '#334155',
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontFamilyHeading: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSizeBase: '16px',
      lineHeight: '1.5',
      fontWeightNormal: '400',
      fontWeightBold: '700',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  },
};

export const DEFAULT_SITE_THEME = {
  schemaVersion: SITE_THEME_SCHEMA_VERSION,
  revision: 0,
  ...SITE_THEME_PRESETS.light,
};

/**
 * @param {object} [input]
 * @param {{ defaultRevision?: number, defaultSchemaVersion?: number }} [options] — when `input` omits `revision` / `schemaVersion`, keep prior values (local edits).
 */
/** @param {'xs'|'sm'|'md'|'lg'|'xl'} slot */
export function themeSpacingPx(siteTheme, slot = 'md') {
  const t = normalizeSiteTheme(siteTheme);
  const raw = t.spacing?.[slot];
  const n = typeof raw === 'number' ? raw : Number.parseFloat(String(raw ?? '').trim());
  return Number.isFinite(n) && n >= 0 ? n : 16;
}

export function normalizeSiteTheme(input, options = {}) {
  const { defaultRevision = 0, defaultSchemaVersion = SITE_THEME_SCHEMA_VERSION } = options;
  const base = DEFAULT_SITE_THEME;
  const src = input && typeof input === 'object' ? input : {};
  const schemaOk =
    typeof src.schemaVersion === 'number' &&
    Number.isFinite(src.schemaVersion) &&
    src.schemaVersion >= 1;
  const revOk = typeof src.revision === 'number' && Number.isFinite(src.revision) && src.revision >= 0;
  return {
    schemaVersion: schemaOk ? Math.floor(src.schemaVersion) : defaultSchemaVersion,
    revision: revOk ? Math.floor(src.revision) : defaultRevision,
    presetId: typeof src.presetId === 'string' ? src.presetId : base.presetId,
    colors: { ...base.colors, ...(src.colors || {}) },
    typography: { ...base.typography, ...(src.typography || {}) },
    spacing: { ...base.spacing, ...(src.spacing || {}) },
    /** Per-page live CSS var overrides (stored on project theme). */
    pageVars: src.pageVars && typeof src.pageVars === 'object' && !Array.isArray(src.pageVars) ? src.pageVars : {},
  };
}

/**
 * Default device-style groups from site theme (before node overrides).
 * @param {object} siteTheme
 * @param {string} nodeType
 */
export function siteThemeDefaultsForNodeType(siteTheme, nodeType) {
  const t = normalizeSiteTheme(siteTheme);
  const { colors, typography, spacing } = t;
  const fam = typography.fontFamily;
  const headFam = typography.fontFamilyHeading || fam;

  switch (nodeType) {
    case 'heading':
      return {
        typography: {
          fontFamily: headFam,
          color: colors.text,
          fontWeight: typography.fontWeightBold,
          lineHeight: typography.lineHeight,
        },
        colors: { textColor: colors.text },
      };
    case 'text':
      return {
        typography: {
          fontFamily: fam,
          color: colors.text,
          fontWeight: typography.fontWeightNormal,
          fontSize: typography.fontSizeBase,
          lineHeight: typography.lineHeight,
        },
        colors: { textColor: colors.text },
      };
    case 'button':
      return {
        typography: {
          fontFamily: fam,
          color: '#ffffff',
          fontWeight: typography.fontWeightBold,
          fontSize: typography.fontSizeBase,
          lineHeight: typography.lineHeight,
        },
        colors: {
          textColor: '#ffffff',
          backgroundColor: 'var(--color-primary)',
        },
        background: { backgroundColor: 'var(--color-primary)' },
        border: { radius: '999px', width: '0px', color: 'transparent', style: 'solid' },
        spacing: {
          padding: `${spacing.sm}px ${spacing.md}px`,
        },
      };
    case 'menu':
      return {
        typography: {
          fontFamily: fam,
          color: colors.text,
          fontWeight: typography.fontWeightNormal,
          fontSize: typography.fontSizeBase,
        },
        colors: { textColor: colors.text },
        menu: {
          gap: spacing.md,
          itemPadding: `${spacing.sm}px ${spacing.md}px`,
        },
      };
    case 'row':
      return {
        background: { backgroundColor: colors.background },
      };
    case 'column':
    case 'stack':
      return {};
    case 'rich_text':
      return {
        typography: {
          fontFamily: fam,
          color: colors.text,
          fontSize: typography.fontSizeBase,
          lineHeight: typography.lineHeight,
        },
        colors: { textColor: colors.text },
      };
    default:
      return {};
  }
}

/**
 * Merge site theme defaults under node device style (node wins).
 * @param {object} deviceStyle — output of getDeviceStyle(...)
 * @param {object|null|undefined} siteTheme
 * @param {string} nodeType
 */
export function mergeNodeStyleWithSiteTheme(deviceStyle, siteTheme, nodeType) {
  if (!siteTheme || typeof siteTheme !== 'object') return deviceStyle || {};
  const defaults = siteThemeDefaultsForNodeType(siteTheme, nodeType);
  return deepMergePreferDefined(deviceStyle || {}, defaults);
}

/**
 * Inline style object for the builder root / live wrapper (CSS custom properties).
 */
export function siteThemeToCssVariableStyle(siteTheme) {
  const t = normalizeSiteTheme(siteTheme);
  const { colors, typography, spacing } = t;
  const px = (n) => `${Number(n) || 0}px`;
  return {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-text': colors.text,
    '--color-muted': colors.muted,
    '--color-background': colors.background,
    '--color-surface': colors.surface,
    '--color-border': colors.border,
    '--font-family-body': typography.fontFamily,
    '--font-family-heading': typography.fontFamilyHeading || typography.fontFamily,
    '--font-size-base': typography.fontSizeBase,
    '--line-height-base': typography.lineHeight,
    '--font-weight-normal': typography.fontWeightNormal,
    '--font-weight-bold': typography.fontWeightBold,
    '--space-xs': px(spacing.xs),
    '--space-sm': px(spacing.sm),
    '--space-md': px(spacing.md),
    '--space-lg': px(spacing.lg),
    '--space-xl': px(spacing.xl),
    '--bld-primary': colors.primary,
    '--bld-accent-warm': colors.primary,
    '--bld-site-text': colors.text,
    '--bld-theme-font-family': typography.fontFamily,
    '--bld-space-xs': px(spacing.xs),
    '--bld-space-sm': px(spacing.sm),
    '--bld-space-md': px(spacing.md),
    '--bld-space-lg': px(spacing.lg),
    '--bld-space-xl': px(spacing.xl),
  };
}
