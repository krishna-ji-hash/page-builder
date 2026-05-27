/**
 * Inspector numeric input + style_json number safety (no NaN in controlled inputs or JSON).
 */

/** Value safe for React `<input type="number" value={…}>`. */
/** For optional positive-only dimensions (empty when unset or ≤ 0). */
export function positiveNumInputDisplayValue(value) {
  const d = numInputDisplayValue(value, '');
  return d === '' || d <= 0 ? '' : d;
}

export function numInputDisplayValue(value, fallback = '') {
  if (value === '' || value == null) {
    return fallback === undefined ? '' : fallback;
  }
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(n)) {
    return fallback === undefined ? '' : fallback;
  }
  return n;
}

/** Parse user input; null when empty/invalid. */
export function parseFiniteNumber(value) {
  if (value === '' || value == null) return null;
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

export function clampFiniteNumber(value, { min = -Infinity, max = Infinity, fallback = min } = {}) {
  const n = parseFiniteNumber(value);
  if (n == null) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Deep-remove NaN numbers from style_json-like objects before persistence.
 * Preserves structure; drops only non-finite numbers.
 */
export function stripNaNFromStyleJson(value) {
  if (value == null) return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (Array.isArray(value)) {
    const arr = value
      .map((item) => stripNaNFromStyleJson(item))
      .filter((item) => item !== undefined);
    return arr;
  }
  if (typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    const cleaned = stripNaNFromStyleJson(v);
    if (cleaned !== undefined) out[k] = cleaned;
  }
  return out;
}
