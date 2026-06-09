/**
 * Tab hero background image — inline contract beats global `.live-doc img` resets.
 */

/**
 * @param {unknown} minHeightPx
 * @returns {import('react').CSSProperties}
 */
export function tabHeroPanelImageInlineStyle(minHeightPx = 480) {
  const h = Math.max(320, Math.min(720, Math.floor(Number(minHeightPx) || 480)));
  return {
    width: '100%',
    height: '100%',
    minHeight: `${h}px`,
    display: 'block',
    objectFit: 'cover',
    objectPosition: 'center',
    boxSizing: 'border-box',
  };
}

/**
 * @param {unknown} minHeightPx
 */
export function tabHeroStageMinHeightPx(minHeightPx = 480) {
  const h = Math.max(320, Math.min(720, Math.floor(Number(minHeightPx) || 480)));
  return h;
}
