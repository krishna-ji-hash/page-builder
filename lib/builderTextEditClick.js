/** Builder canvas: single-click → inline / rich text edit + floating formatting toolbar. */

const CANVAS_EDIT_NODE_TYPES = new Set(['heading', 'text', 'paragraph', 'button', 'rich_text']);

const FEATURE_TAB_FIELD_SELECTOR = '[data-bld-feature-tab-field]';

const BLOCKED_CLICK_SELECTOR = [
  '.bld-node__chrome',
  '.bld-node-controls',
  '.bld-floating-inline-toolbar',
  '.bld-floating-quick-toolbar',
  '.bld-quick-text-toolbar',
  '.bld-transform-handle',
  '.bld-resize-handle',
  '.bld-drop-zone',
  '.bld-add-section-inline',
  '.bld-wp-toolbar',
  '.live-carousel__split-nav',
  '.live-carousel__split-arrow',
  '.live-carousel__split-dot',
  '.live-carousel__arrow',
  '.live-carousel__dot',
  '.live-feature-tabs__tab',
  '.live-feature-tabs__image-btn',
  '.live-faq-accordion__chevron-btn',
  '.live-faq-accordion__add-btn',
  'input',
  'textarea',
  'select',
  'option',
].join(', ');

/**
 * @param {string} nodeType
 */
export function nodeSupportsClickToEdit(nodeType) {
  return CANVAS_EDIT_NODE_TYPES.has(String(nodeType || ''));
}

/**
 * True when a canvas click on this node should enter text edit (not chrome / nav / form controls).
 * @param {Event} event
 * @param {string} nodeType
 */
export function shouldStartTextEditFromCanvasClick(event, nodeType) {
  if (!nodeSupportsClickToEdit(nodeType)) return false;
  const target = event?.target;
  if (!target || typeof target.closest !== 'function') return false;
  if (target.closest(BLOCKED_CLICK_SELECTOR)) return false;
  if (nodeType === 'button') {
    return Boolean(
      target.closest('.bld-demo-button, .bld-live-leaf-edit-host button, [data-bld-node] button, button')
    );
  }
  return true;
}

/**
 * Feature Tabs widget: panel heading / body / bullets (not tab nav buttons).
 * @param {Event} event
 */
export function shouldStartFeatureTabTextEdit(event) {
  const target = event?.target;
  if (!target || typeof target.closest !== 'function') return false;
  if (target.closest(BLOCKED_CLICK_SELECTOR)) return false;
  if (
    target.closest(
      '.live-feature-tabs__tab, .live-feature-tabs__image-btn, .live-feature-tabs__figure--editable input[type="file"]'
    )
  ) {
    return false;
  }
  return Boolean(target.closest(FEATURE_TAB_FIELD_SELECTOR));
}

export { FEATURE_TAB_FIELD_SELECTOR };
