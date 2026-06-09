import DOMPurify from 'isomorphic-dompurify';
import {
  ensureHtmlHooks,
  shouldStripPastedBackgroundCssColor,
  stripNeutralBodyColorsFromStyleAttr,
  stripPastedBackgroundFromStyleAttr,
} from './sanitizeRichHtml.js';

let inlineHooksAdded = false;
let neutralizeHardcodedBodyTextColorsActive = false;
let remapLightNeutralTextColorsActive = false;

const ALLOWED_STYLE_PROPS = new Set([
  'color',
  'background-color',
  'font-weight',
  'font-style',
  'text-decoration',
  'font-size',
]);

const SAFE_FONT_SIZE_VALUE = /^[\d.]+(px|em|rem|%)$/i;

function filterInlineStyleAttr(raw, options) {
  const old = String(raw || '').trim();
  if (!old) return '';
  const parts = old.split(';');
  const kept = [];
  for (const part of parts) {
    const idx = part.indexOf(':');
    if (idx < 1) continue;
    const prop = part.slice(0, idx).trim().toLowerCase();
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue;
    const val = part.slice(idx + 1).trim();
    if (prop === 'font-size' && !SAFE_FONT_SIZE_VALUE.test(val)) continue;
    if (prop === 'background-color' && shouldStripPastedBackgroundCssColor(val)) continue;
    kept.push(part.trim());
  }
  const joined = kept.join('; ').trim();
  if (!joined) return '';
  const bgStripped = stripPastedBackgroundFromStyleAttr(joined);
  return stripNeutralBodyColorsFromStyleAttr(bgStripped, options) || bgStripped;
}

function ensureInlineRichTextHooks() {
  ensureHtmlHooks();
  if (inlineHooksAdded) return;
  inlineHooksAdded = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!node?.getAttribute) return;
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      const lower = href.trim().toLowerCase();
      if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
        node.setAttribute('href', '#');
      } else if (/^https?:\/\//i.test(href) || lower.startsWith('//')) {
        node.setAttribute('rel', 'noopener noreferrer');
        if (!node.getAttribute('target')) node.setAttribute('target', '_blank');
      }
      const cls = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean);
      if (!cls.includes('bld-rich-link')) cls.push('bld-rich-link');
      node.setAttribute('class', cls.join(' '));
    }
    if (node.hasAttribute('style')) {
      const next = filterInlineStyleAttr(node.getAttribute('style'), {
        neutralizeHardcodedBodyTextColors: neutralizeHardcodedBodyTextColorsActive,
        remapLightNeutralTextColors: remapLightNeutralTextColorsActive,
      });
      if (next) {
        node.setAttribute('style', next);
        if (node.tagName === 'SPAN' && /background-color\s*:/i.test(next)) {
          const cls = (node.getAttribute('class') || '').split(/\s+/).filter(Boolean);
          if (!cls.includes('bld-text-highlight')) cls.push('bld-text-highlight');
          node.setAttribute('class', cls.join(' '));
        } else if (node.tagName === 'SPAN') {
          const cls = (node.getAttribute('class') || '')
            .split(/\s+/)
            .filter((c) => c && c !== 'bld-text-highlight');
          if (cls.length) node.setAttribute('class', cls.join(' '));
          else node.removeAttribute('class');
        }
      } else {
        node.removeAttribute('style');
      }
    }
    for (const attr of Array.from(node.attributes || [])) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) node.removeAttribute(attr.name);
    }
  });
}

/**
 * Inline rich text for text/paragraph/heading leaves — strict tag allowlist.
 *
 * @param {string} html
 * @param {{ emptyReturn?: string, neutralizeHardcodedBodyTextColors?: boolean, remapLightNeutralTextColors?: boolean }} [options]
 */
export function sanitizeRichText(html, options = {}) {
  ensureInlineRichTextHooks();
  const emptyReturn = typeof options.emptyReturn === 'string' ? options.emptyReturn : '';
  if (typeof html !== 'string' || !html.trim()) return emptyReturn;

  neutralizeHardcodedBodyTextColorsActive = Boolean(options.neutralizeHardcodedBodyTextColors);
  remapLightNeutralTextColorsActive = options.remapLightNeutralTextColors !== false;
  let clean;
  try {
    clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'u', 'span', 'a', 'br'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: [
        'script',
        'iframe',
        'object',
        'embed',
        'form',
        'input',
        'button',
        'style',
        'img',
        'svg',
      ],
    });
  } finally {
    neutralizeHardcodedBodyTextColorsActive = false;
    remapLightNeutralTextColorsActive = false;
  }
  const out = String(clean || '').trim();
  return out || emptyReturn;
}
