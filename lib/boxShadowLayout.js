/**
 * Box shadows paint outside the element box and do not expand flex row height.
 * Reserve bottom margin so live sections contain hero images + shadows (builder parity).
 */

/** @param {unknown} boxShadow */
export function boxShadowBottomReservePx(boxShadow) {
  if (boxShadow == null || boxShadow === '' || boxShadow === 'none') return 0;
  const raw = String(boxShadow).trim();
  if (!raw) return 0;
  const nums = raw.match(/(-?\d+(?:\.\d+)?)px/g);
  if (!nums || nums.length < 2) return 24;
  const offsetY = Math.abs(parseFloat(nums[1]) || 0);
  const blur = nums.length >= 3 ? Math.abs(parseFloat(nums[2]) || 0) : 0;
  return Math.min(160, Math.max(16, Math.ceil(offsetY + blur * 0.65)));
}

/**
 * @param {Record<string, unknown>} css
 * @param {unknown} boxShadow
 */
export function mergeImageFigureStyleForShadow(css, boxShadow) {
  const s = { ...(css && typeof css === 'object' ? css : {}) };
  const reserve = boxShadowBottomReservePx(boxShadow);
  if (reserve <= 0) return s;
  if (s.marginBottom != null && s.marginBottom !== '') return s;
  if (s.margin != null && s.margin !== '') return s;
  s.marginBottom = `${reserve}px`;
  return s;
}
