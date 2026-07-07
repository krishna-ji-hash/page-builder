/**
 * Builder canvas text-edit session: defer edit until after selection, format whole block when no selection.
 */
import {
  execRichCommandInRoot,
  preserveRichTextSelectionForToolbar as preserveRichTextSelectionForToolbarImpl,
  restoreRichTextSelection,
  selectAllContentsInRoot,
  selectionNonCollapsedInRoot,
} from './richTextExecCommands.js';

/** Commands that apply to the whole block when the caret has no highlight. */
export const WHOLE_BLOCK_WHEN_COLLAPSED = new Set([
  'bold',
  'italic',
  'underline',
  'strikeThrough',
  'removeFormat',
  'unlink',
]);

/**
 * Run after the node is selected (parent state commit + paint).
 * @param {() => void} fn
 */
export function scheduleAfterCanvasSelection(fn) {
  if (typeof fn !== 'function') return;
  if (typeof window === 'undefined') {
    fn();
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => fn());
  });
}

/**
 * @param {HTMLElement|null} root
 * @param {string} command
 * @param {string|boolean} [value]
 * @param {{ wholeBlockIfCollapsed?: boolean }} [opts]
 */
export function execFormatOnTextRoot(root, command, value, opts = {}) {
  if (!root) return null;
  const wholeBlockIfCollapsed = opts.wholeBlockIfCollapsed !== false;
  restoreRichTextSelection(root);
  if (
    wholeBlockIfCollapsed &&
    WHOLE_BLOCK_WHEN_COLLAPSED.has(command) &&
    !selectionNonCollapsedInRoot(root)
  ) {
    selectAllContentsInRoot(root);
  }
  return execRichCommandInRoot(root, command, value);
}

/**
 * Save selection before toolbar interaction (call on toolbar pointerdown).
 * @param {HTMLElement|null} root
 */
export function preserveTextEditSelectionForToolbar(root) {
  preserveRichTextSelectionForToolbarImpl(root);
}
