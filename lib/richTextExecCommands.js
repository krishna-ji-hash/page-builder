/**
 * contenteditable formatting commands (builder inline toolbar).
 */

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
