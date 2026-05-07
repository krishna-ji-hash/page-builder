import DOMPurify from 'isomorphic-dompurify';

let hooksAdded = false;

function ensureLinkHooks() {
  if (hooksAdded) return;
  hooksAdded = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A' || !node.hasAttribute('href')) return;
    const href = node.getAttribute('href') || '';
    const lower = href.trim().toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
      node.setAttribute('href', '#');
      return;
    }
    if (/^https?:\/\//i.test(href) || lower.startsWith('//')) {
      node.setAttribute('rel', 'noopener noreferrer');
      if (!node.getAttribute('target')) node.setAttribute('target', '_blank');
    }
  });
}

/**
 * Strip scripts/event handlers; keep headings, paragraphs, lists, inline styles, links.
 * Used on save (API) and before rendering (live / builder).
 */
export function sanitizeRichHtml(html) {
  ensureLinkHooks();

  if (typeof html !== 'string' || !html.trim()) {
    return '<p></p>';
  }

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'div',
      'span',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'h1',
      'h2',
      'h3',
      'a',
      'ul',
      'ol',
      'li',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'title'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'style'],
  });

  return clean.trim() ? clean : '<p></p>';
}
