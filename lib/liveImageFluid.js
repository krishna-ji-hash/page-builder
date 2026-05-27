/**
 * Keep images inside the viewport on published/draft live pages.
 * Builder device preview uses getDeviceStyle(mobile); live uses these clamps + CSS @media.
 */

/** @param {unknown} value */
export function parseCssPx(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  if (!s.endsWith('px')) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Wide / full-bleed images → fluid; small logos/icons keep authored width.
 * @param {unknown} width
 */
export function isFluidImageWidth(width) {
  if (width == null || width === '') return true;
  const s = String(width).trim().toLowerCase();
  if (s === 'auto' || s === 'fit-content' || s === 'min-content' || s === 'max-content') return false;
  if (s.endsWith('%') || s.includes('clamp(') || s.includes('min(') || s.includes('vw')) return true;
  const px = parseCssPx(s);
  if (px != null) return px > 240;
  return true;
}

/**
 * @param {Record<string, unknown>|null|undefined} figureStyle
 */
export function clampFigureStyleForViewport(figureStyle) {
  const s = { ...(figureStyle && typeof figureStyle === 'object' ? figureStyle : {}), boxSizing: 'border-box' };
  const fluid = isFluidImageWidth(s.width);
  s.maxWidth = '100%';
  s.minWidth = 0;
  if (fluid) {
    s.width = '100%';
    if (s.alignSelf === 'stretch' || !s.alignSelf) {
      s.alignSelf = 'stretch';
    }
  }
  return { style: s, fluid };
}

/**
 * @param {Record<string, unknown>} imgStyle
 * @param {{ imageHeightPx?: number }} [opts]
 */
export function clampImgStyleForViewport(imgStyle, opts = {}) {
  const imageHeightPx = Number(opts.imageHeightPx) || 0;
  const s = {
    ...(imgStyle && typeof imgStyle === 'object' ? imgStyle : {}),
    display: 'block',
    maxWidth: '100%',
    width: '100%',
    boxSizing: 'border-box',
  };
  if (imageHeightPx > 0) {
    s.height = `${imageHeightPx}px`;
    s.objectFit = s.objectFit || 'cover';
  } else if (!s.height) {
    s.height = 'auto';
  }
  return s;
}
