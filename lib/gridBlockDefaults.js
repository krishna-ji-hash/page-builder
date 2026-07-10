/**
 * @param {unknown[]} items
 * @param {number} index
 * @param {Record<string, unknown>} patch
 */
export function patchGridBlockItemFields(items, index, patch) {
  if (!patch || typeof patch !== 'object' || !Array.isArray(items)) return items;
  if (!Number.isInteger(index) || index < 0 || index >= items.length) return items;
  return items.map((item, i) => (i === index ? { ...(item || {}), ...patch } : item));
}
