/**
 * Strip scripts and event handlers from custom head tag snippets before storage.
 * Only allows meta, link, and style tags without javascript: URLs.
 */

const ALLOWED_TAGS = new Set(['meta', 'link', 'style']);

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function isSafeUrl(value) {
  const v = str(value).trim().toLowerCase();
  if (!v) return true;
  if (v.startsWith('/') || v.startsWith('#')) return true;
  if (v.startsWith('https://') || v.startsWith('http://')) return !v.includes('javascript:');
  return false;
}

/** @param {string} raw */
export function sanitizeCustomHeadTags(raw) {
  const input = str(raw).trim();
  if (!input) return '';

  const tagPattern = /<\s*(\/?)\s*([a-z0-9-]+)([^>]*)>/gi;
  let out = '';
  let lastIndex = 0;
  let match;

  while ((match = tagPattern.exec(input)) !== null) {
    out += input.slice(lastIndex, match.index);
    lastIndex = tagPattern.lastIndex;

    const closing = match[1] === '/';
    const tag = match[2].toLowerCase();
    const attrs = match[3] || '';

    if (!ALLOWED_TAGS.has(tag)) continue;
    if (/\bon\w+\s*=/i.test(attrs)) continue;
    if (/javascript:/i.test(attrs)) continue;

    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    const contentMatch = attrs.match(/\bcontent\s*=\s*["']([^"']+)["']/i);
    if (hrefMatch && !isSafeUrl(hrefMatch[1])) continue;
    if (contentMatch && /javascript:/i.test(contentMatch[1])) continue;

    if (tag === 'style' && closing) {
      out += `</${tag}>`;
      continue;
    }
    if (tag === 'style' && !closing) {
      const closeIdx = input.toLowerCase().indexOf('</style>', tagPattern.lastIndex);
      if (closeIdx === -1) continue;
      const block = input.slice(match.index, closeIdx + 8);
      if (/<script/i.test(block) || /javascript:/i.test(block)) continue;
      out += block;
      lastIndex = closeIdx + 8;
      tagPattern.lastIndex = lastIndex;
      continue;
    }

    out += match[0];
  }

  out += input.slice(lastIndex);
  return out.replace(/<script[\s\S]*?<\/script>/gi, '').trim();
}
