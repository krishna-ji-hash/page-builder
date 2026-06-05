import { isProbablyInlineHtml, sanitizeInlineLeafHtml } from './inlineTextHtml.js';

/** Bullet / paragraph stored value may be plain text or inline HTML from the toolbar. */
export function featureTabFieldHasInlineHtml(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return false;
  return isProbablyInlineHtml(raw) || /font-size\s*:/i.test(raw);
}

/**
 * @param {string} raw
 * @param {{ neutralizeHardcodedBodyTextColors?: boolean }} [options]
 */
export function sanitizeFeatureTabFieldHtml(raw, options = {}) {
  if (!featureTabFieldHasInlineHtml(raw)) return String(raw || '').trim();
  return sanitizeInlineLeafHtml(raw, options);
}

/**
 * @param {string} item
 * @param {{ neutralizeHardcodedBodyTextColors?: boolean }} [options]
 */
export function featureTabBulletInnerHtml(item, options = {}) {
  const raw = String(item ?? '').trim();
  if (!raw) return '';
  if (featureTabFieldHasInlineHtml(raw)) {
    return sanitizeFeatureTabFieldHtml(raw, options);
  }
  return raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
