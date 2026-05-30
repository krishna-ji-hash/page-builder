/**
 * Remap pasted light section surfaces (white / slate-50) to theme tokens in dark content mode.
 * Fixes template rows/stacks that keep `#ffffff` in style_json after switching to dark site theme.
 */

import { isSiteContentDarkMode } from './bodyTextNeutralization.js';
import { isCssBackgroundLight } from './liveSectionContrastVars.js';
import { parseCssColorToRgb } from './sanitizeRichHtml.js';

/** Theme-aware hero / section fill when remapping pasted light gradients in dark content mode. */
export const DARK_CONTENT_HERO_GRADIENT =
  'linear-gradient(180deg, color-mix(in srgb, var(--color-background) 94%, var(--color-primary) 6%) 0%, color-mix(in srgb, var(--color-surface) 90%, var(--color-background) 10%) 100%)';

/** Platform hero pitch feature cards — dark surfaces on the black pitch column. */
export const PLATFORM_HERO_FEATURE_CARD_BG = {
  international: '#241f1c',
  bulk: '#152420',
};

/** Legacy template pastels → dark card fills (existing pages). */
export const PLATFORM_HERO_FEATURE_CARD_LEGACY_BG = {
  '#f3e8de': PLATFORM_HERO_FEATURE_CARD_BG.international,
  '#d8efe6': PLATFORM_HERO_FEATURE_CARD_BG.bulk,
};

function normalizeSurfaceHex(raw) {
  return String(raw || '').trim().toLowerCase();
}

/**
 * @param {string} raw
 * @returns {string|null}
 */
export function remapLegacyPlatformHeroFeatureCardBg(raw) {
  return PLATFORM_HERO_FEATURE_CARD_LEGACY_BG[normalizeSurfaceHex(raw)] || null;
}

/**
 * @param {object} deviceStyle
 * @param {object|null|undefined} [node]
 */
export function remapPlatformHeroFeatureCardSurface(deviceStyle, node) {
  if (!deviceStyle) return deviceStyle;
  const bg = deviceStyle.background && typeof deviceStyle.background === 'object' ? deviceStyle.background : null;
  if (!bg?.backgroundColor) return deviceStyle;
  const remapped =
    remapLegacyPlatformHeroFeatureCardBg(bg.backgroundColor) ||
    (node?.props?.meta?.tplRole === 'platform-feature-card' &&
    isHardcodedLightSurfaceColor(String(bg.backgroundColor))
      ? PLATFORM_HERO_FEATURE_CARD_BG.international
      : null);
  if (!remapped) return deviceStyle;
  return { ...deviceStyle, background: { ...bg, backgroundColor: remapped } };
}

const SURFACE_NODE_TYPES = new Set(['row', 'column', 'stack']);

function relLuminance255(r, g, b) {
  const lin = (u) => (u <= 0.03928 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4);
  const R = lin(r / 255);
  const G = lin(g / 255);
  const B = lin(b / 255);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function isTransparentSurface(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s || s === 'transparent' || s === 'none') return true;
  const rgba = /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/i.exec(s);
  if (rgba) return Number(rgba[1]) <= 0.12;
  return false;
}

/**
 * @param {string} raw
 * @returns {boolean}
 */
export function isHardcodedLightSurfaceColor(raw) {
  const s = String(raw || '').trim();
  if (!s || s.startsWith('var(') || isTransparentSurface(s)) return false;
  if (/gradient|url\(/i.test(s)) return false;
  const rgb = parseCssColorToRgb(s);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  const L = relLuminance255(r, g, b);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const chroma = Math.max(rn, gn, bn) - Math.min(rn, gn, bn);
  if (L >= 0.9 && chroma < 0.12) return true;
  if (L >= 0.82 && chroma < 0.08) return true;
  return false;
}

/**
 * @param {object|null|undefined} siteTheme
 * @param {object|null|undefined} [themeTokens]
 */
export function shouldNeutralizeLightSurfaces(siteTheme, themeTokens) {
  return isSiteContentDarkMode(siteTheme, themeTokens);
}

function isLightGradientPaint(raw) {
  const s = String(raw || '').trim();
  if (!s || !/gradient/i.test(s)) return false;
  return isCssBackgroundLight(s) === true;
}

/**
 * Remap pasted light hero/section backgrounds in `style_json` before theme merge.
 * @param {object} deviceStyle
 * @param {object|null|undefined} siteTheme
 * @param {object|null|undefined} [themeTokens]
 * @param {object|null|undefined} [node]
 */
export function neutralizeLightSurfaceDeviceStyle(deviceStyle, siteTheme, themeTokens, node) {
  if (!deviceStyle) return deviceStyle;
  let working = remapPlatformHeroFeatureCardSurface(deviceStyle, node);
  if (!shouldNeutralizeLightSurfaces(siteTheme, themeTokens)) return working;
  const bg = working.background && typeof working.background === 'object' ? working.background : {};
  let nextBg = { ...bg };
  let changed = working !== deviceStyle;

  if (nextBg.backgroundColor && isHardcodedLightSurfaceColor(String(nextBg.backgroundColor))) {
    nextBg.backgroundColor = 'var(--color-background)';
    changed = true;
  }
  if (nextBg.backgroundImage && isLightGradientPaint(nextBg.backgroundImage)) {
    nextBg.backgroundImage = DARK_CONTENT_HERO_GRADIENT;
    if (!nextBg.backgroundColor || isHardcodedLightSurfaceColor(String(nextBg.backgroundColor))) {
      nextBg.backgroundColor = 'var(--color-background)';
    }
    changed = true;
  }

  if (!changed) return working;
  return { ...working, background: nextBg };
}

/**
 * @param {Record<string, unknown>|null|undefined} css
 * @returns {Record<string, unknown>|null|undefined}
 */
export function neutralizeLightSurfaceCssObject(css) {
  if (!css || typeof css !== 'object') return css;
  let changed = false;
  const next = { ...css };

  const remapPlatformCardBg = (key) => {
    const val = next[key];
    if (val == null || val === '') return;
    const remapped = remapLegacyPlatformHeroFeatureCardBg(String(val));
    if (remapped) {
      next[key] = remapped;
      changed = true;
    }
  };
  remapPlatformCardBg('backgroundColor');
  remapPlatformCardBg('background');
  remapPlatformCardBg('--node-bg');

  const remapBg = (key, token) => {
    const val = next[key];
    if (val == null || val === '') return;
    if (isHardcodedLightSurfaceColor(String(val))) {
      next[key] = token;
      changed = true;
    }
  };

  remapBg('backgroundColor', 'var(--token-bg-surface)');
  remapBg('background', 'var(--token-bg-surface)');
  remapBg('--node-bg', 'var(--token-bg-surface)');

  if (next.backgroundImage && isLightGradientPaint(next.backgroundImage)) {
    next.backgroundImage = DARK_CONTENT_HERO_GRADIENT;
    if (!next.backgroundColor || isHardcodedLightSurfaceColor(String(next.backgroundColor))) {
      next.backgroundColor = 'var(--color-background)';
    }
    changed = true;
  }

  return changed ? next : css;
}

export function surfaceNodeTypesForNeutralization() {
  return SURFACE_NODE_TYPES;
}
