/**
 * Pasted neutral dark body colors are remapped for dark page content.
 * Builder UI chrome theme must never affect neutralization by itself.
 */

import { alignThemeTokensWithSiteTheme, normalizeThemeTokens } from './themeTokens.js';
import { normalizeSiteTheme } from './siteDesignTheme.js';

/**
 * @param {object|null|undefined} siteTheme
 * @param {object|null|undefined} [themeTokens]
 * @returns {boolean}
 */
export function isSiteContentDarkMode(siteTheme, themeTokens) {
  const site = normalizeSiteTheme(siteTheme);
  if (site.presetId === 'dark') return true;
  if (themeTokens == null) return false;
  // Prefer aligned mode so a stale token.mode cannot force dark remaps on a light site preset.
  return alignThemeTokensWithSiteTheme(site, normalizeThemeTokens(themeTokens)).mode === 'dark';
}

/**
 * @param {object|null|undefined} siteTheme
 * @param {object|null|undefined} [themeTokens]
 * @returns {boolean}
 */
export function shouldNeutralizeBodyTextColors(siteTheme, themeTokens) {
  return isSiteContentDarkMode(siteTheme, themeTokens);
}

/**
 * Strip pasted neutral dark inline colors when content sits on a dark surface.
 * @param {{ darkContentMode?: boolean, sectionTone?: string|null }} [options]
 * @returns {boolean}
 */
export function shouldNeutralizeHardcodedBodyTextColors(options = {}) {
  const { darkContentMode = false, sectionTone = null } = options;
  if (sectionTone === 'light' && !darkContentMode) return false;
  return Boolean(darkContentMode) || sectionTone === 'dark';
}
