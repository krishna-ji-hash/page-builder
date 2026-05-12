/**
 * Stacks saved with flex row + "heading beside body copy" are almost always a mistake
 * (e.g. Row quick action). Coerce to column so title stacks above paragraph without mutating DB.
 */

function isHeadingType(t) {
  return t === 'heading';
}

function isBodyCopyType(t) {
  return t === 'text' || t === 'rich_text';
}

/**
 * @param {{ nodeType?: string, children?: unknown[] }} treeNode
 * @param {Record<string, unknown>} deviceStyle — one breakpoint slice (e.g. getDeviceStyle output)
 * @returns {Record<string, unknown>}
 */
export function applyTypographicStackRowToColumnDeviceStyle(treeNode, deviceStyle = {}) {
  if (!treeNode || treeNode.nodeType !== 'stack') return deviceStyle;
  if (treeNode.props?.direction === 'horizontal') return deviceStyle;
  const kids = Array.isArray(treeNode.children) ? treeNode.children : [];
  if (kids.length !== 2) return deviceStyle;
  const t0 = kids[0]?.nodeType;
  const t1 = kids[1]?.nodeType;
  const typographicPair =
    (isHeadingType(t0) && isBodyCopyType(t1)) || (isHeadingType(t1) && isBodyCopyType(t0));
  if (!typographicPair) return deviceStyle;

  const layout = deviceStyle.layout || {};
  const dir = String(layout.flexDirection || '').toLowerCase();
  if (dir !== 'row' && dir !== 'row-reverse') return deviceStyle;

  return {
    ...deviceStyle,
    layout: {
      ...layout,
      flexDirection: 'column',
    },
  };
}
