/**
 * Normalize text alignment for toolbar + marquee (left | center | right | justify).
 * @param {unknown} raw
 * @returns {'left'|'center'|'right'|'justify'}
 */
export function normalizeToolbarTextAlign(raw) {
  const v = String(raw ?? 'left').trim().toLowerCase();
  if (v === 'center' || v === 'centre') return 'center';
  if (v === 'right' || v === 'end') return 'right';
  if (v === 'justify') return 'justify';
  return 'left';
}

/** @param {Record<string, unknown>|null|undefined} deviceStyle */
export function readDeviceTextAlign(deviceStyle) {
  const typo = deviceStyle?.typography;
  const fromTypo =
    typo && typeof typo === 'object' && 'textAlign' in typo ? typo.textAlign : undefined;
  const layout = deviceStyle?.layout;
  const fromLayout =
    layout && typeof layout === 'object' && 'textAlign' in layout ? layout.textAlign : undefined;
  return normalizeToolbarTextAlign(fromTypo ?? fromLayout ?? 'left');
}
