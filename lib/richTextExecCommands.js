/**
 * contenteditable formatting commands (builder inline toolbar).
 */
import {
  applyInlineFontSizeWithMarkup,
  ensureFontSizeMarkupInRoot,
  readInlineFontSizePxFromRoot,
} from './inlineFontSize.js';

export { ensureFontSizeMarkupInRoot } from './inlineFontSize.js';

/** @type {WeakMap<object, Range>} */
const savedSelectionByRoot = new WeakMap();

export function saveRichTextSelection(root) {
  if (!root || typeof window === 'undefined') return;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return;
  try {
    savedSelectionByRoot.set(root, range.cloneRange());
  } catch (_) {
    /* ignore */
  }
}

export function restoreRichTextSelection(root) {
  if (!root || typeof window === 'undefined') return false;
  const range = savedSelectionByRoot.get(root);
  if (!range) return false;
  try {
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(range);
    root.focus();
    return true;
  } catch (_) {
    return false;
  }
}

export function selectionNonCollapsedInRoot(root) {
  if (!root || typeof window === 'undefined') return false;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return false;
  return root.contains(range.commonAncestorContainer);
}

/** Select entire editable block (used when applying color with no text highlighted). */
export function selectAllContentsInRoot(root) {
  if (!root || typeof window === 'undefined') return false;
  const sel = window.getSelection();
  if (!sel) return false;
  try {
    const range = document.createRange();
    range.selectNodeContents(root);
    sel.removeAllRanges();
    sel.addRange(range);
    root.focus();
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Apply foreColor / hiliteColor after restoring saved selection; selects all when collapsed.
 * @param {'foreColor'|'hiliteColor'|'backColor'} command
 */
export function applyRichColorInRoot(root, command, color, options = {}) {
  if (!root) return null;
  const selectAllIfCollapsed = options.selectAllIfCollapsed !== false;
  restoreRichTextSelection(root);
  if (selectAllIfCollapsed && !selectionNonCollapsedInRoot(root)) {
    selectAllContentsInRoot(root);
  }
  return execRichCommandInRoot(root, command, color);
}

export const FONT_SIZE_MIN_PX = 8;
export const FONT_SIZE_MAX_PX = 120;
export const FONT_SIZE_STEP_PX = 1;

function clampFontSizePx(value, fallback = 16) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(FONT_SIZE_MIN_PX, Math.min(FONT_SIZE_MAX_PX, n));
}

function parsePxFromFontSize(value) {
  const s = String(value || '').trim();
  const m = s.match(/^([\d.]+)\s*px$/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function stripLegacyFontElements(root) {
  root.querySelectorAll('font[size]').forEach((font) => {
    const parent = font.parentNode;
    if (!parent) return;
    while (font.firstChild) parent.insertBefore(font.firstChild, font);
    font.remove();
  });
}

function applyFontSizeToRootContents(root, sizeStr) {
  stripLegacyFontElements(root);
  const px = parsePxFromFontSize(sizeStr);
  if (px) applyInlineFontSizeWithMarkup(root, px);
}

/**
 * Read explicit or computed font size (px) for the caret/selection in `root`.
 * @param {HTMLElement} root
 * @param {number} [fallback]
 */
export function readFontSizePxFromRoot(root, fallback = 16) {
  if (!root || typeof window === 'undefined') return fallback;
  const fromHost = readInlineFontSizePxFromRoot(root, 0);
  if (fromHost > 0) return fromHost;
  const sel = window.getSelection();
  let el = root;
  if (sel?.rangeCount) {
    const range = sel.getRangeAt(0);
    let node = range.startContainer;
    if (node?.nodeType === 3) node = node.parentElement;
    if (node && root.contains(node)) el = node;
  }
  let cur = el;
  while (cur && (root === cur || root.contains(cur))) {
    const inlinePx = parsePxFromFontSize(cur.style?.fontSize);
    if (inlinePx) return inlinePx;
    if (cur === root) break;
    cur = cur.parentElement;
  }
  const rootInline = parsePxFromFontSize(root.style?.fontSize);
  if (rootInline) return rootInline;
  const computed = parseFloat(window.getComputedStyle(el).fontSize);
  if (Number.isFinite(computed) && computed > 0) return Math.round(computed);
  return fallback;
}

/**
 * Apply exact pixel font size (no browser font-size levels 1–7).
 * @param {HTMLElement} root
 * @param {number} px
 * @param {{ selectAllIfCollapsed?: boolean, wholeBlock?: boolean }} [options]
 */
export function applyFontSizePxInRoot(root, px, options = {}) {
  if (!root || typeof document === 'undefined') return null;
  const n = clampFontSizePx(px);
  const sizeStr = `${n}px`;
  const before = root.innerHTML;
  const hadCe = root.getAttribute('contenteditable');
  root.setAttribute('contenteditable', 'true');

  if (options.wholeBlock) {
    root.focus();
    stripLegacyFontElements(root);
    applyFontSizeToRootContents(root, sizeStr);
    const after = root.innerHTML;
    if (hadCe === null) root.removeAttribute('contenteditable');
    else root.setAttribute('contenteditable', hadCe);
    saveRichTextSelection(root);
    return { before, after };
  }

  restoreRichTextSelection(root);

  const sel = window.getSelection();
  if (!sel) return null;

  let range = sel.rangeCount ? sel.getRangeAt(0) : null;
  const selectAllIfCollapsed = options.selectAllIfCollapsed !== false;
  const rangeInRoot = (r) => r && root.contains(r.commonAncestorContainer);

  if ((!range || !rangeInRoot(range)) && selectAllIfCollapsed) {
    selectAllContentsInRoot(root);
    range = sel.rangeCount ? sel.getRangeAt(0) : null;
  }
  if (range?.collapsed && selectAllIfCollapsed) {
    selectAllContentsInRoot(root);
    range = sel.rangeCount ? sel.getRangeAt(0) : null;
  }

  root.focus();
  stripLegacyFontElements(root);

  if (!rangeInRoot(range)) {
    applyFontSizeToRootContents(root, sizeStr);
    const after = root.innerHTML;
    if (hadCe === null) root.removeAttribute('contenteditable');
    else root.setAttribute('contenteditable', hadCe);
    saveRichTextSelection(root);
    return { before, after };
  }

  try {
    if (!range.collapsed) {
      const span = document.createElement('span');
      span.setAttribute('data-bld-fs', '1');
      span.style.fontSize = sizeStr;
      span.style.setProperty('font-size', sizeStr, 'important');
      const extracted = range.extractContents();
      span.appendChild(extracted);
      range.insertNode(span);
      sel.removeAllRanges();
      const end = document.createRange();
      end.selectNodeContents(span);
      end.collapse(false);
      sel.addRange(end);
    } else {
      applyFontSizeToRootContents(root, sizeStr);
    }
  } catch (_) {
    try {
      applyFontSizeToRootContents(root, sizeStr);
    } catch (_) {
      return null;
    }
  }

  const after = root.innerHTML;
  if (hadCe === null) root.removeAttribute('contenteditable');
  else root.setAttribute('contenteditable', hadCe);
  saveRichTextSelection(root);
  return { before, after };
}

export function execRichCommandInRoot(root, command, value) {
  if (!root || typeof document === 'undefined') return null;
  const before = root.innerHTML;
  const hadCe = root.getAttribute('contenteditable');
  root.setAttribute('contenteditable', 'true');
  root.focus();
  try {
    const useCss =
      command === 'foreColor' ||
      command === 'hiliteColor' ||
      command === 'backColor' ||
      command === 'fontSize';
    document.execCommand('styleWithCSS', false, useCss ? 'true' : 'false');
  } catch (_) {
    /* ignore */
  }
  try {
    switch (command) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
      case 'strikeThrough':
        document.execCommand('strikeThrough', false);
        break;
      case 'foreColor':
        document.execCommand('foreColor', false, String(value ?? ''));
        break;
      case 'hiliteColor':
      case 'backColor':
        document.execCommand('hiliteColor', false, String(value ?? ''));
        break;
      case 'createLink':
        document.execCommand('createLink', false, String(value ?? ''));
        break;
      case 'unlink':
        document.execCommand('unlink', false);
        break;
      case 'removeFormat':
        document.execCommand('removeFormat', false);
        break;
      default:
        break;
    }
  } catch (_) {
    /* ignore */
  }
  const after = root.innerHTML;
  if (hadCe === null) root.removeAttribute('contenteditable');
  else root.setAttribute('contenteditable', hadCe);
  return { before, after };
}
