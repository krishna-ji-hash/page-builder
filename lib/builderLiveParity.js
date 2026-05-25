/**
 * Builder canvas ↔ published site: one render pipeline (liveRenderer).
 */
import { createElement } from 'react';

/** @typedef {import('react').ReactNode} ReactNode */

const BUILDER_LEAF_TYPES = new Set([
  'heading',
  'text',
  'button',
  'rich_text',
  'image',
  'menu',
  'divider',
  'tabs',
  'accordion',
  'carousel',
  'table',
  'form',
  'input',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'switch',
  'date',
  'submit',
]);

/**
 * @param {string} nodeType
 * @param {{ inlineEditing?: boolean, richTextEditing?: boolean }} ctx
 */
export function canRenderBuilderLeafViaLive(nodeType, ctx = {}) {
  if (!BUILDER_LEAF_TYPES.has(nodeType)) return false;
  if (ctx.cmsBindingContext) return false;
  if (ctx.inlineEditing && (nodeType === 'heading' || nodeType === 'text' || nodeType === 'button')) {
    return false;
  }
  if (ctx.richTextEditing && nodeType === 'rich_text') return false;
  return true;
}

/**
 * @param {object} params
 * @param {'desktop'|'tablet'|'mobile'} params.device
 * @param {object|null|undefined} params.siteTheme
 * @param {boolean} [params.insideSiteHeaderRow]
 * @param {object} [params.builderCanvas] — widget edit hooks (tabs, FAQ, etc.)
 */
export function buildBuilderLiveRenderOptions({
  device,
  siteTheme,
  insideSiteHeaderRow = false,
  builderCanvas = null,
}) {
  return {
    device,
    siteTheme: siteTheme || undefined,
    insideSiteHeaderRow,
    builderDataAttr: false,
    builderCanvas: builderCanvas || undefined,
    currentPath: '#',
  };
}

/**
 * Wrap live leaf output so double-click still opens inline edit in the builder shell.
 * @param {object} node
 * @param {ReactNode} child
 * @param {(node: object, event: import('react').MouseEvent) => void} [onInlineEditStart]
 */
export function wrapBuilderLeafForInlineEdit(node, child, onInlineEditStart) {
  if (!onInlineEditStart) return child;
  if (node.nodeType !== 'heading' && node.nodeType !== 'text' && node.nodeType !== 'button') {
    return child;
  }
  return createElement(
    'div',
    {
      className: 'bld-live-leaf-edit-host',
      style: { width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' },
      onDoubleClick: (event) => onInlineEditStart(node, event),
    },
    child
  );
}
