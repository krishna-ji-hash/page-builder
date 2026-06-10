/** Dual-row logo ticker — separate slide lists for top / bottom tracks. */

import { normalizeTickerSlide } from './carouselTickerShared.js';

export const TICKER_ROW_TOP = 'top';
export const TICKER_ROW_BOTTOM = 'bottom';

/** @param {'top' | 'bottom'} row */
export function tickerRowSlidesKey(row) {
  return row === TICKER_ROW_BOTTOM ? 'tickerSlidesBottom' : 'tickerSlidesTop';
}

/** @param {object | null | undefined} props */
export function resolveDualTickerSlides(props) {
  const p = props && typeof props === 'object' ? props : {};
  const legacy = (Array.isArray(p.slides) ? p.slides : []).filter((s) => s && typeof s === 'object');
  const topRaw = Array.isArray(p.tickerSlidesTop) ? p.tickerSlidesTop : null;
  const bottomRaw = Array.isArray(p.tickerSlidesBottom) ? p.tickerSlidesBottom : null;
  const topSlides = topRaw ?? legacy;
  const bottomSlides = bottomRaw ?? legacy;
  return {
    topSlides,
    bottomSlides,
    hasSplitRows: topRaw !== null || bottomRaw !== null,
  };
}

/** Ensure both row arrays exist (copy legacy slides when missing). */
export function ensureTickerRowSlideArrays(props) {
  const { topSlides, bottomSlides } = resolveDualTickerSlides(props);
  return {
    tickerSlidesTop: topSlides.map(normalizeTickerSlide),
    tickerSlidesBottom: bottomSlides.map(normalizeTickerSlide),
  };
}

/** @param {object | null | undefined} props @param {'top' | 'bottom'} row */
export function getTickerSlidesForRow(props, row) {
  const { topSlides, bottomSlides } = resolveDualTickerSlides(props);
  return row === TICKER_ROW_BOTTOM ? bottomSlides : topSlides;
}

/** Initialize split row arrays from a single slides list (variant → ticker). */
export function splitLegacySlidesForTicker(slides) {
  const list = (Array.isArray(slides) ? slides : []).map((s, i) => normalizeTickerSlide(s, i));
  return {
    tickerSlidesTop: list.map((s) => ({ ...s })),
    tickerSlidesBottom: list.map((s) => ({ ...s })),
  };
}
