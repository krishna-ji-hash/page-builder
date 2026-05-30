/**
 * Per-section typography contrast tokens for rows/sections.
 * Rows set `--live-section-fg` / `--live-section-muted` from resolved background luminance.
 * Descendants use `var(--live-section-fg, var(--color-text))` via site theme defaults (see siteDesignTheme).
 */

import { parseCssColorToRgb } from './sanitizeRichHtml.js';
import { isSiteContentDarkMode } from './bodyTextNeutralization.js';
import { neutralizeLightSurfaceDeviceStyle } from './sectionSurfaceNeutralization.js';
import { mergeNodeStyleWithSiteTheme, normalizeSiteTheme } from './siteDesignTheme.js';
import { getDeviceStyle, styleToCss } from './styleToCss.js';

/** Text on light section paint */
export const LIVE_SECTION_FG_ON_LIGHT = '#0f172a';
export const LIVE_SECTION_MUTED_ON_LIGHT = '#475569';

/** Text on dark section paint */
export const LIVE_SECTION_FG_ON_DARK = '#f8fafc';
export const LIVE_SECTION_MUTED_ON_DARK = '#cbd5e1';

/** Relative luminance threshold: above = light background */
const LIGHT_BG_LUMINANCE = 0.45;

function relLuminance255(r, g, b) {
  const lin = (u) => (u <= 0.03928 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4);
  const R = lin(r / 255);
  const G = lin(g / 255);
  const B = lin(b / 255);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function isTransparentColor(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s || s === 'transparent') return true;
  const rgba = /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/i.exec(s);
  if (rgba) return Number(rgba[1]) <= 0.04;
  return false;
}

const SITE_COLOR_VAR_MAP = {
  '--color-primary': 'primary',
  '--color-secondary': 'secondary',
  '--color-text': 'text',
  '--color-muted': 'muted',
  '--color-background': 'background',
  '--color-surface': 'surface',
  '--color-border': 'border',
};

/**
 * Resolve `var(--color-*)` against siteTheme; returns input when not a site var.
 * @param {string} raw
 * @param {object} [siteTheme]
 */
export function resolveSiteThemeColorRef(raw, siteTheme) {
  const s = String(raw || '').trim();
  const m = /^var\(\s*(--color-[a-z-]+)\s*(?:,\s*([^)]+))?\s*\)$/i.exec(s);
  if (!m) return s;
  const key = m[1];
  const fallback = m[2]?.trim();
  const theme = normalizeSiteTheme(siteTheme);
  const slot = SITE_COLOR_VAR_MAP[key];
  if (slot && theme.colors?.[slot]) return theme.colors[slot];
  return fallback || s;
}

function sampleGradientLightness(raw) {
  const s = String(raw || '');
  if (!/gradient/i.test(s)) return null;
  const samples = [];
  const hexes = s.match(/#[0-9a-f]{3,8}/gi) || [];
  for (const hex of hexes) samples.push(hex);
  const rgbs = s.match(/rgba?\([^)]+\)/gi) || [];
  for (const rgb of rgbs) samples.push(rgb);
  if (!samples.length) return null;
  let light = 0;
  let dark = 0;
  for (const sample of samples) {
    const verdict = isCssBackgroundLightSolid(sample);
    if (verdict === true) light += 1;
    else if (verdict === false) dark += 1;
  }
  if (light === 0 && dark === 0) return null;
  return light >= dark;
}

/** Solid colors only — use `isCssBackgroundLight` for gradients. */
function isCssBackgroundLightSolid(raw) {
  const resolved = resolveSiteThemeColorRef(raw);
  if (isTransparentColor(resolved)) return null;
  const rgb = parseCssColorToRgb(resolved);
  if (!rgb) return null;
  return relLuminance255(rgb[0], rgb[1], rgb[2]) >= LIGHT_BG_LUMINANCE;
}

/**
 * @param {string} raw
 * @returns {boolean|null} — null when color cannot be parsed (gradients, color-mix, etc.)
 */
export function isCssBackgroundLight(raw) {
  const s = String(raw || '').trim();
  if (/gradient/i.test(s)) return sampleGradientLightness(s);
  return isCssBackgroundLightSolid(s);
}

/**
 * @param {boolean} isLight
 */
export function liveSectionContrastPair(isLight) {
  if (isLight) {
    return {
      '--live-section-fg': LIVE_SECTION_FG_ON_LIGHT,
      '--live-section-muted': LIVE_SECTION_MUTED_ON_LIGHT,
    };
  }
  return {
    '--live-section-fg': LIVE_SECTION_FG_ON_DARK,
    '--live-section-muted': LIVE_SECTION_MUTED_ON_DARK,
  };
}

/**
 * Pick the best background candidate for a row (inline CSS + style_json + site row default).
 * @param {object} params
 * @param {Record<string, unknown>|null|undefined} params.css — output of styleToCss
 * @param {object|null|undefined} params.deviceStyle — merged device style for the row
 * @param {object|null|undefined} params.siteTheme
 */
function sectionBackgroundCandidates(css, deviceStyle, siteTheme) {
  const theme = normalizeSiteTheme(siteTheme);
  const cssHasPaint = Boolean(
    (css?.backgroundImage != null && String(css.backgroundImage).trim() !== '') ||
      (css?.backgroundColor != null && String(css.backgroundColor).trim() !== '') ||
      (css?.background != null && String(css.background).trim() !== '')
  );
  if (cssHasPaint) {
    return {
      theme,
      list: [css?.backgroundImage, css?.background, css?.backgroundColor],
    };
  }
  return {
    theme,
    list: [
      deviceStyle?.background?.backgroundImage,
      deviceStyle?.background?.background,
      deviceStyle?.colors?.backgroundColor,
      deviceStyle?.background?.backgroundColor,
      deviceStyle?.colors?.background,
      theme.colors?.background,
    ],
  };
}

export function resolveRowSectionBackground({ css, deviceStyle, siteTheme }) {
  const { theme, list } = sectionBackgroundCandidates(css, deviceStyle, siteTheme);
  for (const c of list) {
    if (c == null || c === '') continue;
    const resolved = resolveSiteThemeColorRef(String(c), theme);
    if (!isTransparentColor(resolved)) return resolved;
  }
  return theme.colors?.background || '#f8fafc';
}

function resolveContrastPaintSample(raw, siteTheme) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const theme = normalizeSiteTheme(siteTheme);
  if (/var\(\s*--token-bg-surface\b/i.test(s) || /var\(\s*--color-surface\b/i.test(s)) {
    return theme.colors?.surface || null;
  }
  if (/var\(\s*--token-bg-primary\b/i.test(s) || /var\(\s*--color-background\b/i.test(s)) {
    return theme.colors?.background || null;
  }
  return resolveSiteThemeColorRef(s, theme);
}

/**
 * Walk all painted layers (solid + gradient). Skips unparseable token vars so a
 * light `backgroundImage` still wins after dark-mode surface remap on `backgroundColor`.
 * @returns {boolean|null}
 */
export function resolveSectionBackgroundIsLight({ css, deviceStyle, siteTheme }) {
  const { theme, list } = sectionBackgroundCandidates(css, deviceStyle, siteTheme);
  for (const c of list) {
    if (c == null || c === '') continue;
    const raw = String(c).trim();
    if (isTransparentColor(raw)) continue;
    const resolved = resolveContrastPaintSample(raw, theme);
    const probe = resolved && !isTransparentColor(resolved) ? resolved : raw;
    const light = isCssBackgroundLight(probe);
    if (light !== null) return light;
  }
  const siteBg = resolveSiteThemeColorRef(theme.colors?.background, theme);
  const siteLight = isCssBackgroundLight(siteBg);
  if (siteLight !== null) return siteLight;
  if (normalizeSiteTheme(siteTheme).presetId === 'dark') return false;
  return true;
}

/**
 * @param {object} params
 * @param {Record<string, unknown>|null|undefined} params.css
 * @param {object|null|undefined} params.deviceStyle
 * @param {object|null|undefined} params.siteTheme
 * @returns {{ '--live-section-fg': string, '--live-section-muted': string }}
 */
export function liveSectionContrastCssVarsForRow({ css, deviceStyle, siteTheme }) {
  const light = resolveSectionBackgroundIsLight({ css, deviceStyle, siteTheme });
  return liveSectionContrastPair(light);
}

/**
 * Merge section contrast CSS variables onto a row's inline style object.
 * @param {Record<string, unknown>|null|undefined} css
 * @param {object|null|undefined} deviceStyle
 * @param {object|null|undefined} siteTheme
 */
export function mergeLiveSectionContrastVars(css, deviceStyle, siteTheme) {
  if (!css || typeof css !== 'object') return css;
  const vars = liveSectionContrastCssVarsForRow({ css, deviceStyle, siteTheme });
  return { ...css, ...vars };
}

/**
 * True when style_json paints an opaque dark background on this container.
 * @param {object} node
 * @param {string} device
 * @param {object} siteTheme
 * @param {object|null|undefined} [themeTokens]
 */
export function containerPaintsDark(node, device, siteTheme, themeTokens = null) {
  if (!node?.nodeType) return false;
  const raw = getDeviceStyle(node.style_json, device);
  const surfaceReady = neutralizeLightSurfaceDeviceStyle(raw, siteTheme, themeTokens, node);
  const themed = mergeNodeStyleWithSiteTheme(surfaceReady, siteTheme, node.nodeType, { treeNode: node });
  const darkContentMode = isSiteContentDarkMode(siteTheme, themeTokens);
  const css = styleToCss(themed, siteTheme, { nodeType: node.nodeType, darkContentMode });
  return resolveSectionBackgroundIsLight({ css, deviceStyle: themed, siteTheme }) === false;
}

/** `data-section-tone` for CSS that overrides stale inline white on light strips. */
export function sectionToneDataAttrFromContrastVars(contrastVars) {
  const fg = contrastVars?.['--live-section-fg'];
  if (fg === LIVE_SECTION_FG_ON_LIGHT) return { 'data-section-tone': 'light' };
  if (fg === LIVE_SECTION_FG_ON_DARK) return { 'data-section-tone': 'dark' };
  return {};
}

export function sectionToneDataAttrForCss(css) {
  return sectionToneDataAttrFromContrastVars(css);
}

/** Rows, columns, and stacks each publish contrast tokens for descendants. */
export const SECTION_CONTRAST_NODE_TYPES = new Set(['row', 'column', 'stack']);

/**
 * True when this node paints its own background (not fully transparent).
 * Transparent columns must not override a parent row's `--live-section-fg`.
 */
export function nodeHasOwnOpaqueBackground(css, deviceStyle) {
  const candidates = [
    css?.backgroundColor,
    css?.background,
    css?.backgroundImage,
    deviceStyle?.colors?.backgroundColor,
    deviceStyle?.colors?.background,
    deviceStyle?.background?.backgroundColor,
    deviceStyle?.background?.backgroundImage,
  ];
  for (const c of candidates) {
    if (c == null || c === '') continue;
    const s = String(c).trim();
    if (isTransparentColor(s)) continue;
    if (/^rgba?\([^)]*,\s*0(?:\.0+)?\s*\)/i.test(s)) continue;
    return true;
  }
  return false;
}

/**
 * @param {string} nodeType
 * @param {Record<string, unknown>|null|undefined} [css]
 * @param {object|null|undefined} [deviceStyle]
 */
export function shouldApplySectionContrast(nodeType, css, deviceStyle) {
  const t = String(nodeType || '');
  if (!SECTION_CONTRAST_NODE_TYPES.has(t)) return false;
  if (t === 'row') return true;
  return nodeHasOwnOpaqueBackground(css, deviceStyle);
}
