/** Validation helpers for inspector → style_json (no DOM mutation). */

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_COLOR = /^rgba?\(/i;
const HSL_COLOR = /^hsla?\(/i;

export function isValidCssColor(value) {
  if (value == null || value === '' || value === 'transparent' || value === 'currentColor') return true;
  const s = String(value).trim();
  if (HEX_COLOR.test(s) || RGB_COLOR.test(s) || HSL_COLOR.test(s)) return true;
  if (/^var\(--/.test(s)) return true;
  return false;
}

export function sanitizeCssColor(value, fallback = 'transparent') {
  if (value == null || value === '') return fallback;
  const s = String(value).trim();
  return isValidCssColor(s) ? s : fallback;
}

export function clampPx(value, { min = 0, max = 9999, allowNegative = false } = {}) {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').replace(/px/gi, '').trim());
  if (!Number.isFinite(n)) return min;
  const lo = allowNegative ? -Math.abs(max) : min;
  return Math.max(lo, Math.min(max, Math.round(n)));
}

export function clampOpacity(value) {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, n));
}

export function sanitizeCssUrl(url) {
  const s = String(url ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || s.startsWith('/') || s.startsWith('data:image/')) return s;
  if (s.startsWith('url(')) return s;
  return '';
}

export function coerceCssSize(value, fallback = '') {
  if (value == null || value === '' || value === 'auto') return value === 'auto' ? 'auto' : fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  const s = String(value).trim();
  if (/px|%|em|rem|vh|vw|ch|fr/i.test(s) || s === 'auto' || s === 'none') return s;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? `${n}px` : fallback;
}
