/**
 * Per HTML-block custom CSS with automatic selector scoping.
 *
 * Simple tokenizer (not a full CSS parser). Documented limitations:
 * - @keyframes, @font-face, @charset, @import, @layer … pass through unchanged.
 * - @media / @supports / @container: selectors inside the block are scoped.
 * - Braces or quotes inside malformed CSS may mis-parse; keep rules well-formed.
 * - Does not rewrite :global() or existing [data-html-block-id] prefixes (may double-scope).
 *
 * Paste raw CSS in the inspector CSS field (no <style> tags). Embedded <style> in HTML is
 * extracted on save/render because rich HTML sanitization strips <style> tags.
 */

const HTML_BLOCK_CLASS = 'builder-html-block';
const STYLE_TAG_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;

/** @param {string|number|null|undefined} blockId */
export function htmlBlockScopeSelector(blockId) {
  const id = blockId == null ? '' : String(blockId).trim();
  if (!id) return '';
  const escaped = id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `[data-html-block-id="${escaped}"]`;
}

/** Strip obvious HTML/script injection from a CSS text field (HTML is sanitized separately). */
export function sanitizeHtmlBlockCssInput(css) {
  if (typeof css !== 'string' || !css) return '';
  return css
    .replace(/<\/style\s*>/gi, '')
    .replace(/<style\b[^>]*>/gi, '')
    .replace(/<script/gi, '')
    .replace(/javascript:/gi, '');
}

/** Remove accidental <style> wrappers from the CSS field. */
export function normalizeHtmlBlockCssInput(css) {
  const raw = typeof css === 'string' ? css.trim() : '';
  if (!raw) return '';
  const wrapped = raw.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
  const unwrapped = wrapped ? wrapped[1] : raw;
  return sanitizeHtmlBlockCssInput(unwrapped).trim();
}

/**
 * Pull embedded <style> blocks out of HTML (sanitizer forbids them in rich HTML).
 * @returns {{ html: string, extractedCss: string }}
 */
export function splitHtmlBlockStyleFromHtml(html) {
  if (typeof html !== 'string' || !html.trim()) {
    return { html: '', extractedCss: '' };
  }
  const extracted = [];
  const withoutStyles = html.replace(STYLE_TAG_RE, (_, cssChunk) => {
    const chunk = String(cssChunk || '').trim();
    if (chunk) extracted.push(chunk);
    return '';
  });
  return {
    html: withoutStyles.trim(),
    extractedCss: extracted.join('\n\n').trim(),
  };
}

/** Merge CSS field + extracted inline styles for one block. */
export function mergeHtmlBlockCssSources(cssField = '', extractedCss = '') {
  const parts = [normalizeHtmlBlockCssInput(cssField), normalizeHtmlBlockCssInput(extractedCss)].filter(Boolean);
  return parts.join('\n\n').trim();
}

/**
 * Normalize html_block props for storage/render.
 * @param {{ html?: string, css?: string }} props
 * @returns {{ html: string, css: string }}
 */
export function normalizeHtmlBlockProps(props = {}) {
  const rawHtml = String(props.html ?? '');
  const { html, extractedCss } = splitHtmlBlockStyleFromHtml(rawHtml);
  const css = mergeHtmlBlockCssSources(props.css, extractedCss);
  return { html, css };
}

function skipWhitespaceAndComments(css, start) {
  let i = start;
  while (i < css.length) {
    if (/\s/.test(css[i])) {
      i += 1;
      continue;
    }
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    break;
  }
  return i;
}

function findMatchingBrace(css, openBraceIdx) {
  let depth = 0;
  let inString = null;
  let escaped = false;
  for (let i = openBraceIdx; i < css.length; i += 1) {
    const ch = css[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inString) {
      if (ch === '\\') escaped = true;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const NESTED_SCOPE_AT_RULES = new Set(['media', 'supports', 'container']);

function atRuleName(prelude) {
  const m = String(prelude || '').trim().match(/^@([-\w]+)/);
  return m ? m[1].toLowerCase() : '';
}

function prefixSelectorList(selectors, scope) {
  if (!selectors.trim()) return selectors;
  return selectors
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((sel) => {
      if (sel.includes('data-html-block-id=')) return sel;
      if (sel === ':root' || sel === 'html' || sel === 'body') return scope;
      if (sel === '*') return `${scope}, ${scope} *`;
      return `${scope} ${sel}`;
    })
    .join(', ');
}

function scopeCssChunk(css, scope) {
  let out = '';
  let i = 0;

  while (i < css.length) {
    i = skipWhitespaceAndComments(css, i);
    if (i >= css.length) break;

    if (css[i] === '@') {
      const braceIdx = css.indexOf('{', i);
      const semiIdx = css.indexOf(';', i);
      if (braceIdx === -1 || (semiIdx !== -1 && semiIdx < braceIdx)) {
        const end = semiIdx === -1 ? css.length : semiIdx + 1;
        out += css.slice(i, end);
        i = end;
        continue;
      }

      const closeIdx = findMatchingBrace(css, braceIdx);
      if (closeIdx === -1) {
        out += css.slice(i);
        break;
      }

      const prelude = css.slice(i, braceIdx).trim();
      const inner = css.slice(braceIdx + 1, closeIdx);
      const name = atRuleName(prelude);

      if (NESTED_SCOPE_AT_RULES.has(name)) {
        out += `${prelude}{${scopeCssChunk(inner, scope)}}`;
      } else {
        out += css.slice(i, closeIdx + 1);
      }
      i = closeIdx + 1;
      continue;
    }

    const braceIdx = css.indexOf('{', i);
    if (braceIdx === -1) {
      out += css.slice(i);
      break;
    }

    const closeIdx = findMatchingBrace(css, braceIdx);
    if (closeIdx === -1) {
      out += css.slice(i);
      break;
    }

    const selectors = css.slice(i, braceIdx).trim();
    const body = css.slice(braceIdx, closeIdx + 1);
    out += selectors ? `${prefixSelectorList(selectors, scope)}${body}` : body;
    i = closeIdx + 1;
  }

  return out;
}

/**
 * Scope user CSS to one HTML block wrapper.
 * @param {string} css
 * @param {string|number|null|undefined} blockId
 * @returns {string}
 */
export function scopeHtmlBlockCss(css, blockId) {
  const cleaned = normalizeHtmlBlockCssInput(css);
  const scope = htmlBlockScopeSelector(blockId);
  if (!cleaned || !scope) return '';
  return scopeCssChunk(cleaned, scope);
}

export { HTML_BLOCK_CLASS };
