/** Normalize image fit prop to a lowercase token. */
export function imageFitMode(imageFit) {
  return String(imageFit || 'cover').toLowerCase();
}

/**
 * With `object-fit: contain`, a full-width figure creates empty side bands that show the parent
 * background (often white). Shrink-wrap the wrapper so the box matches the bitmap footprint.
 * @param {Record<string, unknown>} css — output of styleToCss for the image node
 */
export function mergeImageFigureStyleForContain(css) {
  const s = { ...(css && typeof css === 'object' ? css : {}) };
  const w = s.width != null ? String(s.width).trim() : '';
  if (w === '100%' || w === '100' || w === '') {
    s.width = 'fit-content';
  }
  if (s.maxWidth == null || s.maxWidth === '') {
    s.maxWidth = '100%';
  }
  if (s.alignSelf === 'stretch') {
    s.alignSelf = 'center';
  }
  return s;
}
