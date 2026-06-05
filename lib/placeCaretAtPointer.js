/**
 * Place the text caret where the user clicked inside a contenteditable field.
 * @param {HTMLElement} root
 * @param {PointerEvent | MouseEvent} event
 */
export function placeCaretAtPointer(root, event) {
  if (!root || !event || typeof document === 'undefined') return false;
  const x = event.clientX;
  const y = event.clientY;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;

  let range = null;
  if (typeof document.caretRangeFromPoint === 'function') {
    range = document.caretRangeFromPoint(x, y);
  } else if (typeof document.caretPositionFromPoint === 'function') {
    const pos = document.caretPositionFromPoint(x, y);
    if (pos) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
    }
  }
  if (!range || !root.contains(range.startContainer)) return false;

  const sel = window.getSelection();
  if (!sel) return false;
  sel.removeAllRanges();
  sel.addRange(range);
  if (typeof root.focus === 'function') {
    try {
      root.focus({ preventScroll: true });
    } catch {
      root.focus();
    }
  }
  return true;
}

/**
 * @param {HTMLElement} root
 */
export function selectionIsInsideRoot(root) {
  if (!root || typeof window === 'undefined') return false;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount < 1) return false;
  return root.contains(sel.getRangeAt(0).startContainer);
}
