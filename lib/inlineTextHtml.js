import { sanitizeRichHtml } from './sanitizeRichHtml.js';

/**
 * Plain heading/text `props.text` is usually a string. When it contains inline markup
 * (bold, links, …), we render via sanitizeRichHtml + dangerouslySetInnerHTML.
 */
export function isProbablyInlineHtml(s) {
  if (typeof s !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(s.trim());
}

/** Sanitize inline HTML stored on `props.text`; empty input becomes `''`. */
export function sanitizeInlineLeafHtml(html) {
  if (typeof html !== 'string' || !html.trim()) return '';
  return sanitizeRichHtml(html, { emptyReturn: '' }).trim();
}
