import { sanitizeRichText } from './sanitizeRichText.js';

/** Collapse accidental `&amp;amp;…` chains from repeated HTML round-trips. */
export function collapseRepeatedAmpEntities(html) {
  if (typeof html !== 'string' || !html.includes('&amp;')) return html;
  let out = html;
  let prev;
  do {
    prev = out;
    out = out.replace(/&amp;amp;/gi, '&amp;');
  } while (out !== prev);
  return out;
}

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
  const normalized = collapseRepeatedAmpEntities(html);
  return sanitizeRichText(normalized, { emptyReturn: '', ...options }).trim();
}
