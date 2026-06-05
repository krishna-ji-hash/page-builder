/**
 * Builder inline font-size — one pipeline for feature tabs, paragraph/text/heading, rich text.
 * Host data-attrs + CSS vars beat template 15px; inner span carries size in saved HTML.
 */

export const BLD_INLINE_FONT_SIZE_ATTR = 'data-bld-inline-font-size';
export const BLD_INLINE_LINE_HEIGHT_ATTR = 'data-bld-inline-line-height';
export const BLD_FS_MARK = 'data-bld-fs';

export function parsePxFromFontSize(value) {
  const s = String(value || '').trim();
  const m = s.match(/^([\d.]+)\s*px$/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Unitless line-height so box does not balloon (template uses 1.72). */
export function lineHeightForFontSizePx(px) {
  const n = Math.round(Number(px)) || 16;
  if (n >= 28) return '1.3';
  if (n >= 22) return '1.35';
  if (n >= 18) return '1.4';
  return '1.5';
}

export function clearInlineFontSizeOnHost(root) {
  if (!root?.removeAttribute) return;
  root.removeAttribute(BLD_INLINE_FONT_SIZE_ATTR);
  root.removeAttribute(BLD_INLINE_LINE_HEIGHT_ATTR);
  root.style.removeProperty('--bld-inline-font-size');
  root.style.removeProperty('--bld-inline-line-height');
  root.style.fontSize = '';
  root.style.lineHeight = '';
  root.style.removeProperty('font-size');
  root.style.removeProperty('line-height');
}

export function applyInlineFontSizeOnHost(root, px) {
  if (!root) return null;
  const n = Math.round(Number(px));
  if (!Number.isFinite(n) || n <= 0) return null;
  const sizeStr = `${n}px`;
  const lh = lineHeightForFontSizePx(n);

  root.setAttribute(BLD_INLINE_FONT_SIZE_ATTR, String(n));
  root.setAttribute(BLD_INLINE_LINE_HEIGHT_ATTR, lh);
  root.style.setProperty('--bld-inline-font-size', sizeStr);
  root.style.setProperty('--bld-inline-line-height', lh);
  root.style.fontSize = sizeStr;
  root.style.lineHeight = lh;

  return { px: n, sizeStr, lineHeight: lh };
}

function stampFontSizeOnSpan(span, sizeStr, lh) {
  span.setAttribute(BLD_FS_MARK, '1');
  span.style.fontSize = sizeStr;
  span.style.lineHeight = lh;
  span.style.setProperty('font-size', sizeStr, 'important');
  span.style.setProperty('line-height', lh, 'important');
}

/**
 * Apply host + inner span so glyphs and saved HTML both carry the size.
 * @param {HTMLElement} root
 * @param {number} px
 */
export function applyInlineFontSizeWithMarkup(root, px) {
  if (!root || typeof document === 'undefined') return null;
  const applied = applyInlineFontSizeOnHost(root, px);
  if (!applied) return null;

  const { sizeStr, lineHeight: lh } = applied;
  const direct = root.querySelector(`:scope > span[${BLD_FS_MARK}="1"]`);
  if (direct && direct.parentElement === root && root.childElementCount === 1) {
    stampFontSizeOnSpan(direct, sizeStr, lh);
    return applied;
  }
  const sized = root.querySelector(':scope > span[style*="font-size"]');
  if (sized && sized.parentElement === root && root.childElementCount === 1) {
    stampFontSizeOnSpan(sized, sizeStr, lh);
    return applied;
  }
  const span = document.createElement('span');
  stampFontSizeOnSpan(span, sizeStr, lh);
  while (root.firstChild) span.appendChild(root.firstChild);
  root.appendChild(span);
  return applied;
}

export function readInlineFontSizePxFromRoot(root, fallback = 16) {
  if (!root || typeof window === 'undefined') return fallback;
  const attrPx = parseInt(root.getAttribute(BLD_INLINE_FONT_SIZE_ATTR) || '', 10);
  if (Number.isFinite(attrPx) && attrPx > 0) return attrPx;
  const hostPx = parsePxFromFontSize(root.style?.fontSize);
  if (hostPx) return hostPx;
  const varPx = parsePxFromFontSize(
    root.style?.getPropertyValue('--bld-inline-font-size') || ''
  );
  if (varPx) return varPx;
  const sizedSpan = root.querySelector?.(`span[${BLD_FS_MARK}="1"], span[style*="font-size"]`);
  if (sizedSpan) {
    const fromSpan = parsePxFromFontSize(sizedSpan.style?.fontSize);
    if (fromSpan) return fromSpan;
  }
  const computed = parseFloat(window.getComputedStyle(root).fontSize);
  if (Number.isFinite(computed) && computed > 0) return Math.round(computed);
  return fallback;
}

/** Parse saved HTML and sync host attrs for live preview. */
export function syncInlineFontSizeHostFromHtml(root, html) {
  if (!root) return;
  const s = String(html || '');
  const m = s.match(/font-size\s*:\s*([\d.]+)\s*px/i);
  if (m) {
    applyInlineFontSizeOnHost(root, Number(m[1]));
    return;
  }
  if (!s.includes(BLD_FS_MARK) && !/font-size\s*:/i.test(s)) {
    clearInlineFontSizeOnHost(root);
  }
}

export function ensureFontSizeMarkupInRoot(root) {
  if (!root) return '';
  const px = readInlineFontSizePxFromRoot(root, 0);
  if (px > 0 && !root.querySelector('span[style*="font-size"]')) {
    applyInlineFontSizeWithMarkup(root, px);
  }
  return root.innerHTML;
}

/** Saved HTML carries toolbar font-size (not template preset). */
export function parseToolbarFontSizeFromHtml(html) {
  const m = String(html || '').match(/font-size\s*:\s*([\d.]+)\s*px/i);
  if (!m) return 0;
  const px = Math.round(Number(m[1]));
  return Number.isFinite(px) && px > 0 ? px : 0;
}

export function hasToolbarFontSizeOverride(html) {
  return parseToolbarFontSizeFromHtml(html) > 0;
}

/**
 * React/DOM props: when set, `inline-font-size.css` disables template font-size rules.
 * @param {string} html
 * @returns {Record<string, string | object>}
 */
export function inlineFontSizeOverridePropsFromHtml(html) {
  const px = parseToolbarFontSizeFromHtml(html);
  if (!px) return {};
  const lh = lineHeightForFontSizePx(px);
  const sizeStr = `${px}px`;
  return {
    [BLD_INLINE_FONT_SIZE_ATTR]: String(px),
    [BLD_INLINE_LINE_HEIGHT_ATTR]: lh,
    style: {
      '--bld-inline-font-size': sizeStr,
      '--bld-inline-line-height': lh,
    },
  };
}

/**
 * Remove toolbar font-size from HTML — template CSS (15px etc.) applies again.
 * @param {string} html
 */
export function stripToolbarFontSizeFromHtml(html) {
  const s = String(html || '').trim();
  if (!s) return '';
  if (typeof document === 'undefined') {
    return s
      .replace(/<span[^>]*data-bld-fs="1"[^>]*>([\s\S]*?)<\/span>/gi, '$1')
      .replace(/\s*font-size\s*:\s*[\d.]+px;?/gi, '');
  }
  const wrap = document.createElement('div');
  wrap.innerHTML = s;
  wrap.querySelectorAll(`[${BLD_FS_MARK}]`).forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    span.remove();
  });
  wrap.querySelectorAll('[style*="font-size"]').forEach((el) => {
    el.style.removeProperty('font-size');
    el.style.removeProperty('line-height');
    if (el.hasAttribute(BLD_FS_MARK)) el.removeAttribute(BLD_FS_MARK);
    const style = el.getAttribute('style');
    if (!style || !String(style).trim()) el.removeAttribute('style');
  });
  return wrap.innerHTML.trim();
}
