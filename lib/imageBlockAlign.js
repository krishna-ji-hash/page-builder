import { findNodeInTree } from './builderTree.js';
import { getDeviceStyle, sanitizeInlineMarginCss } from './styleToCss.js';
import { mergeDeviceStyleWithTypeDefaults } from './nodeLayoutDefaults.js';

export const IMAGE_OBJECT_POSITION_CSS = {
  center: 'center',
  top: 'center top',
  bottom: 'center bottom',
  left: 'left center',
  right: 'right center',
};

export function mapImageObjectPositionCss(raw) {
  const key = String(raw ?? '').toLowerCase().trim();
  return IMAGE_OBJECT_POSITION_CSS[key] || undefined;
}

export function parseMarginBoxForPatch(margin) {
  if (!margin) return { top: 0, right: 0, bottom: 0, left: 0 };
  if (typeof margin === 'object' && !Array.isArray(margin)) {
    const q = (side) => {
      const n = Number.parseFloat(String(margin[side] ?? '0').replace(/px/gi, '').trim());
      return Number.isFinite(n) ? n : 0;
    };
    return { top: q('top'), right: q('right'), bottom: q('bottom'), left: q('left') };
  }
  const parts = String(margin)
    .trim()
    .split(/\s+/)
    .map((s) => {
      const n = Number.parseFloat(String(s).replace(/px/gi, '').trim());
      return Number.isFinite(n) ? n : 0;
    });
  if (parts.length === 1) return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  if (parts.length === 2) return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  if (parts.length === 3) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  return { top: parts[0] || 0, right: parts[1] || 0, bottom: parts[2] || 0, left: parts[3] || 0 };
}

export function findParentNodeInTree(tree, nodeId) {
  let parent = null;
  const walk = (nodes, directParent) => {
    for (const n of nodes || []) {
      if (String(n.id) === String(nodeId)) {
        parent = directParent;
        return true;
      }
      if (walk(n.children || [], n)) return true;
    }
    return false;
  };
  walk(tree, null);
  return parent;
}

/** Parent flex main axis: row-like vs column-like (for image position mapping). */
export function getImageParentFlexDirection(tree, nodeId, device = 'desktop', siteTheme = null) {
  const parent = findParentNodeInTree(tree, nodeId);
  if (!parent) return 'column';
  const raw = getDeviceStyle(parent.style_json || {}, device);
  const merged = mergeDeviceStyleWithTypeDefaults(parent.nodeType, raw, { treeNode: parent });
  const dir = String(merged.layout?.flexDirection || 'column').toLowerCase();
  if (dir === 'row' || dir === 'row-reverse') return 'row';
  return 'column';
}

function isRowLikeFlex(parentFlexDirection) {
  const d = String(parentFlexDirection || '').toLowerCase();
  return d === 'row' || d === 'row-reverse';
}

/** Horizontal track: left / center / right. */
export function resolveImageHorizontalAlign(horizontal, parentFlexDirection = 'column') {
  const h = String(horizontal || '').toLowerCase().trim();
  if (!h) return {};
  const rowLike = isRowLikeFlex(parentFlexDirection);

  if (h === 'left') {
    return rowLike
      ? { marginLeft: 0, marginRight: 'auto' }
      : { alignSelf: 'flex-start', marginLeft: 0, marginRight: 'auto' };
  }
  if (h === 'center') {
    return rowLike
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : { alignSelf: 'center', marginLeft: 'auto', marginRight: 'auto' };
  }
  if (h === 'right') {
    return rowLike
      ? { marginLeft: 'auto', marginRight: 0 }
      : { alignSelf: 'flex-end', marginLeft: 'auto', marginRight: 0 };
  }
  return {};
}

/** Vertical track: top / bottom (column parent = main axis; row parent = cross axis). */
export function resolveImageVerticalAlign(vertical, parentFlexDirection = 'column') {
  const v = String(vertical || '').toLowerCase().trim();
  if (!v) return {};
  const rowLike = isRowLikeFlex(parentFlexDirection);

  if (v === 'top') {
    return rowLike
      ? { alignSelf: 'flex-start', marginTop: 0, marginBottom: 0 }
      : { marginTop: 0, marginBottom: 0 };
  }
  if (v === 'bottom') {
    return rowLike
      ? { alignSelf: 'flex-end', marginTop: 0, marginBottom: 0 }
      : { marginTop: 'auto', marginBottom: 0 };
  }
  if (v === 'center' || v === 'middle') {
    return rowLike
      ? { alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto' }
      : { marginTop: 'auto', marginBottom: 'auto' };
  }
  return {};
}

/** Read horizontal + vertical from props (legacy `imageBlockAlign` = single axis). */
export function readImageAlignAxes(props = {}) {
  let horizontal = String(props.imageAlignHorizontal || '').toLowerCase().trim();
  let vertical = String(props.imageAlignVertical || '').toLowerCase().trim();
  const legacy = String(props.imageBlockAlign || '').toLowerCase().trim();
  if (!horizontal && ['left', 'center', 'right'].includes(legacy)) horizontal = legacy;
  if (!vertical && ['top', 'bottom'].includes(legacy)) vertical = legacy;
  return { horizontal, vertical };
}

/**
 * When an image uses vertical center/bottom, ancestor stack + column must fill the row column height.
 * @param {object[]} tree
 * @param {number|string} imageNodeId
 * @param {string} vertical
 */
export function buildVerticalAlignContainerPatches(tree, imageNodeId, vertical) {
  const v = String(vertical || '').toLowerCase().trim();
  if (!v || v === 'top') {
    return { stackId: null, columnId: null, stackPatch: null, columnPatch: null };
  }

  const stack = findParentNodeInTree(tree, imageNodeId);
  if (!stack?.id || stack.nodeType !== 'stack') {
    return { stackId: null, columnId: null, stackPatch: null, columnPatch: null };
  }

  const column = findParentNodeInTree(tree, stack.id);
  if (!column?.id || column.nodeType !== 'column') {
    return { stackId: null, columnId: null, stackPatch: null, columnPatch: null };
  }

  return {
    stackId: stack.id,
    columnId: column.id,
    stackPatch: {
      layout: {
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '0%',
        alignSelf: 'stretch',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        minHeight: '100%',
        width: '100%',
        minWidth: 0,
      },
      size: {
        minHeight: '100%',
        width: '100%',
      },
    },
    columnPatch: {
      layout: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        alignSelf: 'stretch',
        minHeight: '100%',
        minWidth: 0,
      },
    },
  };
}

export function resolveImageShellAlignStyle(slot, parentFlexDirection = 'column') {
  const align = String(slot || '').toLowerCase().trim();
  if (!align) return {};
  if (['left', 'center', 'right'].includes(align)) {
    return resolveImageHorizontalAlign(align, parentFlexDirection);
  }
  if (['top', 'bottom', 'center', 'middle'].includes(align)) {
    const vertical = align === 'middle' ? 'center' : align;
    return resolveImageVerticalAlign(vertical, parentFlexDirection);
  }
  return {};
}

export function resolveImageShellAlignFromProps(props = {}, parentFlexDirection = 'column') {
  const { horizontal, vertical } = readImageAlignAxes(props);
  return {
    ...resolveImageHorizontalAlign(horizontal, parentFlexDirection),
    ...resolveImageVerticalAlign(vertical, parentFlexDirection),
  };
}

export const IMAGE_SHELL_LAYOUT_KEYS = new Set([
  'alignSelf',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'width',
  'maxWidth',
  'minWidth',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'order',
]);

export function splitImageNodeCss(css) {
  if (!css || typeof css !== 'object') return { shell: undefined, figure: undefined };
  const shell = {};
  const figure = {};
  for (const [key, value] of Object.entries(css)) {
    if (value == null || value === '') continue;
    if (IMAGE_SHELL_LAYOUT_KEYS.has(key)) shell[key] = value;
    else figure[key] = value;
  }
  const shellOut = Object.keys(shell).length ? sanitizeInlineMarginCss(shell) : undefined;
  return {
    shell: shellOut && Object.keys(shellOut).length ? shellOut : undefined,
    figure: Object.keys(figure).length ? sanitizeInlineMarginCss(figure) : undefined,
  };
}

export function measureImageContentWidth(shellEl) {
  if (!shellEl) return 0;
  const img = shellEl.querySelector('img.bld-demo-image, .bld-demo-image');
  const wrap = shellEl.querySelector('.bld-demo-image-wrap');
  const target = img || wrap;
  const rect = target?.getBoundingClientRect?.();
  return Math.round(rect?.width || 0);
}

const IMAGE_BLOCK_ALIGN_FOCAL = {
  left: 'left',
  right: 'right',
  top: 'top',
  bottom: 'bottom',
  center: 'center',
};

/**
 * @param {'horizontal'|'vertical'} axis
 * @param {string} slot
 */
export function buildImageAlignStylePatch(
  axis,
  slot,
  deviceStyle,
  shellEl,
  parentFlexDirection = 'column',
  props = {}
) {
  const { horizontal: h0, vertical: v0 } = readImageAlignAxes(props);
  const horizontal = axis === 'horizontal' ? slot : h0;
  const vertical = axis === 'vertical' ? slot : v0;

  const layout = {
    flexGrow: 0,
    flexShrink: 0,
    ...resolveImageHorizontalAlign(horizontal, parentFlexDirection),
    ...resolveImageVerticalAlign(vertical, parentFlexDirection),
  };
  const size = {};
  const shellRect = shellEl?.getBoundingClientRect?.();
  const contentW = measureImageContentWidth(shellEl) || Math.round(shellRect?.width || 0) || 320;
  const width = String(deviceStyle?.size?.width || '').trim();
  const alignSelfStored = String(deviceStyle?.layout?.alignSelf || '').trim();
  const shellWiderThanBitmap =
    shellRect && contentW > 0 && shellRect.width > contentW + 12;
  const needsExplicitWidth =
    width === '100%' ||
    alignSelfStored === 'stretch' ||
    shellWiderThanBitmap ||
    !width ||
    width === 'auto';

  const focal =
    axis === 'vertical'
      ? IMAGE_BLOCK_ALIGN_FOCAL[vertical] || 'center'
      : IMAGE_BLOCK_ALIGN_FOCAL[horizontal] || 'center';

  if (needsExplicitWidth && axis === 'horizontal') {
    const px = Math.max(80, contentW);
    layout.maxWidth = `${px}px`;
    size.width = `${px}px`;
  }

  const result = {
    layout,
    focal,
    propsPatch: {
      imageAlignHorizontal: horizontal || '',
      imageAlignVertical: vertical || '',
      imageBlockAlign: axis === 'horizontal' ? horizontal : vertical,
      imageObjectPosition: focal,
    },
  };
  if (Object.keys(size).length) {
    result.size = size;
  }
  return result;
}
