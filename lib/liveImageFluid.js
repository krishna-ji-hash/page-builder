import { imageFitMode } from './imageFigureStyle.js';

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
  if (width == null || width === '') return false;
  const s = String(width).trim().toLowerCase();
  if (s === 'auto' || s === 'fit-content' || s === 'min-content' || s === 'max-content') return false;
  if (s === '100%' || s === '100') return true;
  if (s.endsWith('%') || s.includes('clamp(') || s.includes('min(') || s.includes('vw')) return true;
  if (parseCssPx(s) != null) return false;
  return false;
}

/**
 * @param {Record<string, unknown>|null|undefined} figureStyle
 */
export function clampFigureStyleForViewport(figureStyle) {
  const s = { ...(figureStyle && typeof figureStyle === 'object' ? figureStyle : {}), boxSizing: 'border-box' };
  const stretchIntent = s.alignSelf === 'stretch';
  const fluid = isFluidImageWidth(s.width) || (stretchIntent && !s.width);
  s.maxWidth = '100%';
  s.minWidth = 0;
  if (fluid) {
    s.width = '100%';
    if (stretchIntent || !s.alignSelf) {
      s.alignSelf = 'stretch';
    }
  } else if (!s.width || s.width === 'auto') {
    s.width = 'fit-content';
  }
  return { style: s, fluid };
}

/** @param {unknown} device */
function isNarrowViewport(device) {
  return device === 'mobile' || device === 'tablet';
}

/**
 * @param {Record<string, unknown>} imgStyle
 * @param {{ imageHeightPx?: number, device?: 'desktop'|'tablet'|'mobile' }} [opts]
 */
export function clampImgStyleForViewport(imgStyle, opts = {}) {
  const imageHeightPx = Number(opts.imageHeightPx) || 0;
  const device = opts.device || 'desktop';
  const narrow = isNarrowViewport(device);
  const fluid = opts.fluid !== false && Boolean(opts.fluid);
  const fit = imageFitMode(imgStyle?.objectFit);
  const s = {
    ...(imgStyle && typeof imgStyle === 'object' ? imgStyle : {}),
    display: 'block',
    maxWidth: '100%',
    boxSizing: 'border-box',
  };
  if (narrow) {
    s.width = '100%';
    s.height = 'auto';
    s.objectFit = fit === 'fill' ? 'fill' : 'contain';
    s.objectPosition = s.objectPosition || 'center';
    if (imageHeightPx > 0) {
      s.maxHeight = `${imageHeightPx}px`;
    }
  } else if (fluid) {
    s.width = '100%';
    if (imageHeightPx > 0) {
      s.height = `${imageHeightPx}px`;
      s.objectFit = s.objectFit || 'cover';
    } else if (!s.height) {
      s.height = 'auto';
    }
  } else {
    s.width = 'auto';
    if (imageHeightPx > 0) {
      s.height = `${imageHeightPx}px`;
      s.objectFit = s.objectFit || 'cover';
    } else if (!s.height) {
      s.height = 'auto';
    }
  }
  return s;
}
