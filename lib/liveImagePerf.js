/**
 * Live/published image performance helpers (CLS reservation + LCP priority).
 * Shared by liveRenderer and runtime widgets — keeps builder/live parity on attributes.
 */

import { parseCssPx } from './liveImageFluid.js';

const PLACEHOLDER_RE = /placeholder\.(svg|png)/i;

/** @param {unknown} src */
export function isMeaningfulImageSrc(src) {
  const s = String(src || '').trim();
  return Boolean(s) && !PLACEHOLDER_RE.test(s);
}

/**
 * @param {number} ordinal — 0-based document order among images on the page
 */
export function pickImageLoadingPolicy(ordinal) {
  if (ordinal <= 0) {
    return { loading: 'eager', fetchPriority: 'high', decoding: 'async' };
  }
  return { loading: 'lazy', fetchPriority: 'low', decoding: 'async' };
}

/**
 * @param {string|undefined} aspectRatio — e.g. "16 / 9"
 */
function parseAspectRatioPair(aspectRatio) {
  const raw = String(aspectRatio || '').trim();
  if (!raw) return null;
  const parts = raw.split('/').map((p) => parseFloat(p.trim()));
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1]) || parts[0] <= 0) {
    return null;
  }
  return { w: parts[0], h: parts[1] };
}

/**
 * Intrinsic width/height hints for <img> (reduces CLS; not layout overrides).
 * @param {{ imageHeightPx?: number, aspectRatio?: string, widthPx?: number|null }} dims
 */
export function liveImageIntrinsicAttrs(dims = {}) {
  const imageHeightPx = Number(dims.imageHeightPx) || 0;
  const widthPx = Number(dims.widthPx) || 0;
  const ar = parseAspectRatioPair(dims.aspectRatio);

  if (ar && imageHeightPx > 0) {
    const w = Math.max(1, Math.round((imageHeightPx * ar.w) / ar.h));
    return { width: w, height: imageHeightPx };
  }
  if (ar) {
    const baseW = 1200;
    return { width: baseW, height: Math.max(1, Math.round((baseW * ar.h) / ar.w)) };
  }
  if (imageHeightPx > 0 && widthPx > 0) {
    return { width: widthPx, height: imageHeightPx };
  }
  if (imageHeightPx > 0) {
    return { height: imageHeightPx };
  }
  return {};
}

/**
 * Stabilize figure box before image decode (aspect-ratio + min-height from style_json / props).
 * @param {Record<string, unknown>} figureStyle
 * @param {{ imageHeightPx?: number, aspectRatio?: string }} dims
 */
export function applyFigureLayoutStability(figureStyle, dims = {}) {
  const s = { ...(figureStyle && typeof figureStyle === 'object' ? figureStyle : {}) };
  const imageHeightPx = Number(dims.imageHeightPx) || 0;
  const aspectRatio = String(dims.aspectRatio || '').trim();

  if (aspectRatio && !s.aspectRatio) {
    s.aspectRatio = aspectRatio;
  }
  if (imageHeightPx > 0) {
    const minH = `${imageHeightPx}px`;
    if (!s.minHeight || parseCssPx(s.minHeight) == null) {
      s.minHeight = minH;
    }
  }
  return s;
}

/**
 * @param {object} node
 * @param {object} [deviceStyle]
 */
export function resolveLiveImageDims(node, deviceStyle = {}) {
  const imageHeightPx = Number(node?.props?.imageHeightPx || 0);
  const aspectRatio =
    String(deviceStyle?.size?.aspectRatio || '').trim() ||
    String(node?.props?.aspectRatio || '').trim() ||
    '';
  const widthPx = parseCssPx(deviceStyle?.size?.width);
  return { imageHeightPx, aspectRatio, widthPx };
}
