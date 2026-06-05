/** Selectors for portaled builder formatting toolbars (not inside the inline edit subtree). */
export const FLOATING_TOOLBAR_SELECTOR =
  '.bld-floating-inline-toolbar, .bld-floating-quick-toolbar, .bld-wp-toolbar';

export function isFocusInFloatingToolbar() {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement;
  if (!active || typeof active.closest !== 'function') return false;
  return Boolean(
    active.closest(FLOATING_TOOLBAR_SELECTOR) ||
      active.closest('.bld-wp-toolbar, .bld-font-size-stepper') ||
      active.matches?.('input[type="color"]')
  );
}

/**
 * Inline `contenteditable` uses blur-to-commit; opening toolbar color pickers blurs the field.
 * @param {FocusEvent|null|undefined} event
 * @param {boolean} [colorPickerSessionOpen]
 */
export function shouldDeferInlineEditBlurCommit(event, colorPickerSessionOpen = false) {
  if (colorPickerSessionOpen) return true;
  const related = event?.relatedTarget;
  if (related && typeof related.closest === 'function') {
    if (related.closest(FLOATING_TOOLBAR_SELECTOR)) return true;
    if (related.closest('.bld-font-size-stepper, .bld-wp-toolbar')) return true;
    if (related.matches?.('input[type="color"]')) return true;
  }
  return isFocusInFloatingToolbar();
}
