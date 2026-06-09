/** Flush in-progress builder canvas inline edits before save / preview. */

const COMPOUND_FIELD_SELECTOR = '[data-bld-feature-tab-field]';

/**
 * Blur the active contenteditable field so blur-to-commit handlers run.
 * @returns {Promise<void>}
 */
export function flushActiveCanvasInlineEdits() {
  if (typeof document === 'undefined') return Promise.resolve();
  const active = document.activeElement;
  if (!active || typeof active.blur !== 'function') return Promise.resolve();

  const inBuilder =
    typeof active.closest === 'function' &&
    Boolean(active.closest('.bld-builder-root, .bld-canvas__page'));
  if (!inBuilder) return Promise.resolve();

  const isCompoundField = Boolean(active.closest?.(COMPOUND_FIELD_SELECTOR));
  const isLeafEditable = active.isContentEditable;
  if (!isCompoundField && !isLeafEditable) return Promise.resolve();

  active.blur();
  return new Promise((resolve) => {
    window.setTimeout(resolve, 80);
  });
}
