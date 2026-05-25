import { buildDividerCreatePayload } from './dividerDefaults.js';
import {
  findAncestorColumnNode,
  findAncestorRowNode,
  findAncestorStackNode,
  findNodeInTree,
  getSiblingContext,
  sameBuilderNodeId,
} from './builderTree.js';

export const DIVIDER_PLACEMENTS = ['inside', 'above', 'below', 'before', 'after', 'left', 'right'];

export const DIVIDER_PLACEMENT_LABELS = {
  inside: 'Inside',
  above: 'Above',
  below: 'Below',
  before: 'Before',
  after: 'After',
  left: 'Left',
  right: 'Right',
};

const DEFAULT_SPACING_PX = 16;

/** Margin box for divider spacing from placement (style_json.spacing.margin). */
export function dividerMarginForPlacement(placement = 'inside') {
  const px = DEFAULT_SPACING_PX;
  const margin = { top: 0, right: 0, bottom: 0, left: 0 };
  switch (normalizeDividerPlacement(placement)) {
    case 'above':
      margin.bottom = px;
      break;
    case 'below':
      margin.top = px;
      break;
    case 'before':
      margin.right = px;
      break;
    case 'after':
      margin.left = px;
      break;
    case 'left':
      margin.right = px;
      break;
    case 'right':
      margin.left = px;
      break;
    case 'inside':
    default:
      margin.top = px;
      margin.bottom = px;
      break;
  }
  return margin;
}

export function normalizeDividerPlacement(placement) {
  const p = String(placement || 'inside').toLowerCase();
  return DIVIDER_PLACEMENTS.includes(p) ? p : 'inside';
}

export function dividerPayloadForPlacement(orientation, placement) {
  const orient = orientation === 'vertical' ? 'vertical' : 'horizontal';
  const base = buildDividerCreatePayload(orient);
  const margin = dividerMarginForPlacement(placement);
  const desktop = { ...(base.style_json?.desktop || {}) };
  desktop.spacing = { ...(desktop.spacing || {}), margin };
  return {
    props: base.props,
    style_json: { ...base.style_json, desktop },
  };
}

/** Compact row between sections (horizontal line). */
export function dividerBetweenSectionsRowStyle() {
  return {
    desktop: {
      spacing: {
        padding: { top: 12, right: 0, bottom: 12, left: 0 },
      },
      layout: { display: 'block' },
    },
  };
}

/** Narrow column for vertical line beside content. */
export function dividerSideColumnStyle() {
  return {
    desktop: {
      size: { width: '12px', minWidth: '4px', maxWidth: '32px' },
      layout: { flex: '0 0 auto', alignSelf: 'stretch' },
    },
  };
}

export function dividerSideStackStyle() {
  return {
    desktop: {
      layout: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
        minHeight: '48px',
      },
    },
  };
}

function walkStacks(nodes, out = []) {
  for (const n of nodes || []) {
    if (n?.nodeType === 'stack') out.push(n);
    if (n?.children?.length) walkStacks(n.children, out);
  }
  return out;
}

function firstUnlockedStack(tree, isNodeLocked) {
  return walkStacks(tree).find((s) => s?.id && !isNodeLocked(s.id)) || null;
}

function stackChildPositionIndex(tree, stack, selectedNodeId, placement) {
  const children = stack?.children || [];
  const place = normalizeDividerPlacement(placement);
  if ((place === 'before' || place === 'after') && selectedNodeId != null) {
    const ctx = getSiblingContext(tree, selectedNodeId);
    if (ctx && sameBuilderNodeId(ctx.parentId, stack.id)) {
      return place === 'before' ? ctx.index : ctx.index + 1;
    }
    const sel = findNodeInTree([stack], selectedNodeId);
    if (sel) {
      const idx = children.findIndex((c) => sameBuilderNodeId(c.id, sel.id));
      if (idx >= 0) return place === 'before' ? idx : idx + 1;
    }
  }
  return children.length;
}

/**
 * Resolve how to insert a divider (sync plan; caller runs API).
 * @returns {object | null}
 */
export function resolveDividerInsertPlan(
  tree,
  selectedNodeId,
  orientation,
  placement = 'inside',
  { isNodeLocked = () => false } = {}
) {
  if (!Array.isArray(tree) || tree.length === 0) return null;

  const place = normalizeDividerPlacement(placement);
  const orient = orientation === 'vertical' ? 'vertical' : 'horizontal';
  const payload = dividerPayloadForPlacement(orient, place);

  const anchorId =
    selectedNodeId ??
    firstUnlockedStack(tree, isNodeLocked)?.id ??
    tree.find((n) => n?.nodeType === 'row')?.id ??
    null;

  if (place === 'above' || place === 'below') {
    const row = anchorId ? findAncestorRowNode(tree, anchorId) : tree.find((n) => n?.nodeType === 'row');
    if (!row?.id) return null;
    const ctx = getSiblingContext(tree, row.id);
    const baseIndex = ctx?.index ?? 0;
    const positionIndex = place === 'above' ? baseIndex : baseIndex + 1;
    return {
      kind: 'root-row',
      positionIndex,
      rowStyle: dividerBetweenSectionsRowStyle(),
      ...payload,
    };
  }

  if (place === 'left' || place === 'right') {
    const row = anchorId ? findAncestorRowNode(tree, anchorId) : null;
    if (!row?.id || isNodeLocked(row.id)) return null;
    let column = anchorId ? findAncestorColumnNode(tree, anchorId) : null;
    if (!column?.id) {
      column = (row.children || []).find((c) => c?.nodeType === 'column') || null;
    }
    if (!column?.id) return null;
    const colCtx = getSiblingContext(tree, column.id);
    if (!colCtx) return null;
    const columnIndex = place === 'left' ? colCtx.index : colCtx.index + 1;
    const useVertical = orient === 'vertical';
    return {
      kind: 'row-column',
      rowId: row.id,
      columnIndex,
      columnStyle: dividerSideColumnStyle(),
      stackStyle: dividerSideStackStyle(),
      forceOrientation: useVertical ? 'vertical' : orient,
      ...dividerPayloadForPlacement(useVertical ? 'vertical' : orient, place),
    };
  }

  let stack = anchorId ? findAncestorStackNode(tree, anchorId) : null;
  if (!stack?.id) stack = firstUnlockedStack(tree, isNodeLocked);
  if (!stack?.id) return null;
  if (isNodeLocked(stack.id)) return null;

  const positionIndex = stackChildPositionIndex(tree, stack, anchorId, place);
  return {
    kind: 'stack-child',
    stackId: stack.id,
    positionIndex,
    ...payload,
  };
}

/** True when placement edits inside a section stack (respect section lock). */
export function dividerPlacementUsesSectionContent(placement) {
  const p = normalizeDividerPlacement(placement);
  return p === 'inside' || p === 'before' || p === 'after';
}
