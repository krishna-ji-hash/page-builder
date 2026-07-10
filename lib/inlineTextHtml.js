import { sanitizeRichText } from './sanitizeRichText.js';
import { normalizeParagraphBlockHtml } from './inlineParagraphHtml.js';
import { repairMojibakeText } from './textEncodingRepair.js';

/** Decode common HTML entities in plain `props.text` (e.g. `Pickup &amp; dispatch` → `Pickup & dispatch`). */
export function decodePlainTextEntities(text) {
  if (typeof text !== 'string') return text;
  const repaired = repairMojibakeText(text);
  if (!repaired.includes('&')) return repaired;
  text = repaired;
  return text
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

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
 * @param {{ neutralizeHardcodedBodyTextColors?: boolean, paragraphBlocks?: boolean }} [options]
 */
export function sanitizeInlineLeafHtml(html, options = {}) {
  if (typeof html !== 'string' || !html.trim()) return '';
  let normalized = collapseRepeatedAmpEntities(html);
  if (options.paragraphBlocks) {
    normalized = normalizeParagraphBlockHtml(normalized);
  }
  return sanitizeRichText(normalized, { emptyReturn: '', ...options }).trim();
}

/**
 * Strip a single outer block wrapper so we never render `<p><p>…</p></p>` (invalid HTML → hydration drift).
 * @param {string} html
 * @param {string} [tagName]
 */
export function unwrapSingleOuterBlockTag(html, tagName = 'p') {
  if (typeof html !== 'string' || !html.trim()) return html;
  const tag = String(tagName || 'p').toLowerCase();
  const re = new RegExp(`^<${tag}(\\s[^>]*)?>([\\s\\S]*)</${tag}>$`, 'i');
  const match = html.trim().match(re);
  return match ? match[2].trim() : html.trim();
}

/**
 * Sanitize inline HTML for a specific leaf wrapper tag (unwraps redundant outer block).
 * @param {string} html
 * @param {string} wrapperTag
 * @param {object} [options]
 */
export function sanitizeInlineLeafHtmlForTag(html, wrapperTag, options = {}) {
  const safe = sanitizeInlineLeafHtml(html, options);
  if (!safe) return '';
  const tag = String(wrapperTag || 'p').toLowerCase();
  if (tag === 'p' || tag === 'div') {
    return unwrapSingleOuterBlockTag(safe, tag);
  }
  return safe;
}
