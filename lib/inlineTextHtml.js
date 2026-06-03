import { sanitizeRichText } from './sanitizeRichText.js';

/**
 * Plain heading/text `props.text` is usually a string. When it contains inline markup
 * (bold, links, …), we render via sanitizeRichText + dangerouslySetInnerHTML.
 */
export function isProbablyInlineHtml(s) {
  if (typeof s !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(s.trim());
}

/**
 * Sanitize inline HTML stored on `props.text` / `props.richText.html`; empty input becomes `''`.
 * @param {{ neutralizeHardcodedBodyTextColors?: boolean }} [options]
 */
export function sanitizeInlineLeafHtml(html, options = {}) {
  if (typeof html !== 'string' || !html.trim()) return '';
  return sanitizeRichText(html, { emptyReturn: '', ...options }).trim();
}
