import { assertValidNodeHierarchy } from './builderHierarchy.js';

/**
 * Depth-first check: row → column → stack → blocks (throws same errors as DB / API).
 * Call after {@link reconcileStructuralParents} before save or publish.
 */
export function validateTree(nodes, parentNodeType = null) {
  if (!Array.isArray(nodes)) return;
  for (const node of nodes) {
    if (!node || typeof node !== 'object') {
      throw new Error('Invalid node: expected object');
    }
    if (!node.nodeType || typeof node.nodeType !== 'string') {
      throw new Error('Invalid node: missing nodeType');
    }
    assertValidNodeHierarchy(node.nodeType, parentNodeType ?? null);
    validateTree(node.children || [], node.nodeType);
  }
}

/**
 * Rewrite parentNodeId / positionIndex from the nested children shape so DB sync
 * cannot drift when client objects carry stale parent ids (fixes hierarchy errors
 * like "stack must be inside column" after reorder/publish).
 */
export function reconcileStructuralParents(nodes, parentId = null) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node, index) => {
    if (!node || typeof node !== 'object') return node;
    const id = node.id;
    const children = node.children || [];
    return {
      ...node,
      parentNodeId: parentId ?? null,
      positionIndex: index,
      children: reconcileStructuralParents(children, id),
    };
  });
}

/**
 * Move stacks that sit directly under a row into the first column child (valid hierarchy).
 * No new ids; safe before persist when legacy data had stacks as row children.
 */
export function autoFixTree(nodes) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map(fixNodeDeep);
}

function fixNodeDeep(node) {
  if (!node || typeof node !== 'object') return node;
  if (node.nodeType === 'row') return autoFixMisplacedStacksInRow(node);
  return {
    ...node,
    children: (node.children || []).map(fixNodeDeep),
  };
}

function autoFixMisplacedStacksInRow(row) {
  const ch = row.children || [];
  const stacks = ch.filter((c) => c?.nodeType === 'stack');
  const cols = ch.filter((c) => c?.nodeType === 'column');
  if (!stacks.length || !cols.length) {
    return { ...row, children: ch.map(fixNodeDeep) };
  }
  const firstCol = cols[0];
  const rest = ch.filter((c) => c?.nodeType !== 'stack');
  const newChildren = rest.map((c) => {
    if (c && firstCol && c.id === firstCol.id) {
      return {
        ...firstCol,
        children: [...(firstCol.children || []).map(fixNodeDeep), ...stacks.map(fixNodeDeep)],
      };
    }
    return fixNodeDeep(c);
  });
  return { ...row, children: newChildren };
}

export function findNodeInTree(nodes, nodeId) {
  for (const node of nodes || []) {
    if (node.id === nodeId) return node;
    const match = findNodeInTree(node.children || [], nodeId);
    if (match) return match;
  }
  return null;
}

/**
 * Find where a node sits among its siblings (same parent).
 * @returns {{ parentId: number|null, siblingIds: number[], index: number } | null}
 */
export function getSiblingContext(tree, nodeId) {
  const id = Number(nodeId);
  if (!Number.isFinite(id)) return null;

  function walk(nodes, parentId) {
    if (!Array.isArray(nodes)) return null;
    const ids = nodes.map((n) => n.id);
    const idx = ids.indexOf(id);
    if (idx >= 0) {
      return { parentId: parentId ?? null, siblingIds: ids, index: idx };
    }
    for (const n of nodes) {
      const r = walk(n.children || [], n.id);
      if (r) return r;
    }
    return null;
  }

  return walk(tree, null);
}

/**
 * Move one step earlier among siblings (up / left in a horizontal row).
 */
export function computeMoveUp(tree, nodeId) {
  const ctx = getSiblingContext(tree, nodeId);
  if (!ctx || ctx.index <= 0) return null;
  return {
    nodeId,
    newParentId: ctx.parentId,
    newIndex: ctx.index - 1,
  };
}

/**
 * Move one step later among siblings (down / right in a horizontal row).
 */
export function computeMoveDown(tree, nodeId) {
  const ctx = getSiblingContext(tree, nodeId);
  if (!ctx || ctx.index >= ctx.siblingIds.length - 1) return null;
  return {
    nodeId,
    newParentId: ctx.parentId,
    newIndex: ctx.index + 1,
  };
}

function orderedSiblingIds(tree, parentNodeId) {
  if (parentNodeId == null || parentNodeId === undefined) {
    return (tree || []).map((n) => n.id);
  }
  const parent = findNodeInTree(tree, parentNodeId);
  if (!parent) return [];
  return (parent.children || []).map((c) => c.id);
}

/**
 * Maps dnd-kit droppable ids to { newParentId, newIndex } matching backend reorder semantics:
 * newIndex is the 0-based index among siblings after excluding the dragged node.
 *
 * Droppable ids:
 * - root-drop-append
 * - before-{targetNodeId}
 * - inside-{parentContainerId}
 */
export function computeReorderFromDrop(tree, draggedNodeId, overId) {
  if (!tree || draggedNodeId == null || overId == null) return null;
  const draggedId = Number(draggedNodeId);
  if (!Number.isFinite(draggedId)) return null;

  if (overId === 'root-drop-append') {
    const ids = orderedSiblingIds(tree, null).filter((id) => id !== draggedId);
    return { newParentId: null, newIndex: ids.length };
  }

  if (typeof overId === 'string' && overId.startsWith('inside-')) {
    const parentId = Number(overId.slice('inside-'.length));
    if (!Number.isFinite(parentId)) return null;
    const parent = findNodeInTree(tree, parentId);
    if (!parent) return null;
    const newIndex = (parent.children || []).filter((c) => c.id !== draggedId).length;
    return { newParentId: parentId, newIndex };
  }

  if (typeof overId === 'string' && overId.startsWith('before-')) {
    const targetId = Number(overId.slice('before-'.length));
    if (!Number.isFinite(targetId)) return null;
    const target = findNodeInTree(tree, targetId);
    if (!target) return null;
    const ctx = getSiblingContext(tree, targetId);
    if (!ctx) return null;
    const parentNodeId = ctx.parentId;
    const siblings = orderedSiblingIds(tree, parentNodeId);
    const filtered = siblings.filter((id) => id !== draggedId);
    const idx = filtered.indexOf(targetId);
    if (idx < 0) return null;
    return { newParentId: parentNodeId, newIndex: idx };
  }

  return null;
}
