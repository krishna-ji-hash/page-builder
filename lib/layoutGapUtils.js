import { DEFAULT_SITE_THEME, themeSpacingPx } from './siteDesignTheme.js';

export const GAP_SCALE_IDS = ['xs', 'sm', 'md', 'lg', 'xl'];

/**
 * Numeric gap for flex math / CSS when `layout.gapScale` is set.
 */
export function resolvedLayoutGapPx(layout = {}, siteTheme = DEFAULT_SITE_THEME) {
  const token = layout.gapScale;
  if (typeof token === 'string' && GAP_SCALE_IDS.includes(token)) {
    return themeSpacingPx(siteTheme, token);
  }
  const g = layout.gap;
  if (typeof g === 'number' && Number.isFinite(g)) return g;
  const n = parseFloat(String(g ?? '').replace(/px/gi, '').trim());
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Clone device style with `layout.gap` filled from `gapScale` when needed (before type-default merges).
 */
export function withResolvedLayoutGap(deviceStyle, siteTheme = DEFAULT_SITE_THEME) {
  if (!deviceStyle || typeof deviceStyle !== 'object') return deviceStyle;
  const L = deviceStyle.layout || {};
  const px = resolvedLayoutGapPx(L, siteTheme);
  if (px === undefined) return deviceStyle;
  return {
    ...deviceStyle,
    layout: {
      ...L,
      gap: px,
    },
  };
}

/**
 * Best token for inspector when only numeric gap is stored.
 */
export function inferGapScaleFromPx(px, siteTheme = DEFAULT_SITE_THEME) {
  const n = typeof px === 'number' ? px : parseFloat(String(px ?? '').replace(/px/gi, '').trim());
  if (!Number.isFinite(n)) return '';
  let best = '';
  let bestDist = Infinity;
  for (const id of GAP_SCALE_IDS) {
    const v = themeSpacingPx(siteTheme, id);
    const d = Math.abs(v - n);
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  if (bestDist > 2) return '';
  return best;
}
