import { assertValidNodeHierarchy } from './builderHierarchy.js';

/** Coerce DB / JSON ids so `123` and `"123"` match in tree walks. */
export function canonicalNodeId(id) {
  if (id == null || id === '') return null;
  const n = Number(id);
  if (Number.isFinite(n)) return n;
  return id;
}

export function sameBuilderNodeId(a, b) {
  return canonicalNodeId(a) === canonicalNodeId(b);
}

function treeParentId(node) {
  if (!node || typeof node !== 'object') return null;
  const p = node.parentNodeId ?? node.parent_node_id;
  if (p === '' || p === undefined || p === null) return null;
  return p;
}

function isRootPageRowInTree(tree, rowNode) {
  if (!rowNode || rowNode.nodeType !== 'row' || !Array.isArray(tree)) return false;
  return tree.some((n) => n && sameBuilderNodeId(n.id, rowNode.id));
}

/**
 * Duplicate target for “section copy”: if the user duplicates a **column** that belongs to a
 * **top-level section row**, duplicate that **whole row** so the copy is the next section below.
 * Otherwise duplicate the selected node only (avoids a third column / twin images in one row).
 */
export function resolveSectionDuplicateTargetId(tree, nodeId) {
  const node = findNodeInTree(tree, nodeId);
  if (!node) return nodeId;
  if (node.nodeType === 'column') {
    const pid = treeParentId(node);
    if (pid == null) return nodeId;
    const parent = findNodeInTree(tree, pid);
    if (parent && parent.nodeType === 'row' && isRootPageRowInTree(tree, parent)) {
      return parent.id;
    }
  }
  return nodeId;
}

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
    if (sameBuilderNodeId(node.id, nodeId)) return node;
    const match = findNodeInTree(node.children || [], nodeId);
    if (match) return match;
  }
  return null;
}

/** First descendant (depth-first) with `nodeType`, or `root` if it already matches. */
export function findDescendantNodeByType(root, nodeType) {
  if (!root || !nodeType) return null;
  if (root.nodeType === nodeType) return root;
  for (const child of root.children || []) {
    const hit = findDescendantNodeByType(child, nodeType);
    if (hit) return hit;
  }
  return null;
}

function buildParentMap(nodes, parentId = null, out = new Map()) {
  for (const node of nodes || []) {
    if (!node) continue;
    out.set(canonicalNodeId(node.id), parentId != null ? canonicalNodeId(parentId) : null);
    if (Array.isArray(node.children) && node.children.length) {
      buildParentMap(node.children, node.id, out);
    }
  }
  return out;
}

/**
 * Nearest ancestor row containing this node (walk parents until `row`). If `startNodeId` is a row, returns that row.
 * @returns {object | null}
 */
/**
 * Nearest ancestor stack (walk parents). If `startNodeId` is a stack, returns that stack.
 * @returns {object | null}
 */
export function findAncestorStackNode(tree, startNodeId) {
  if (startNodeId == null || startNodeId === '') return null;
  const sid = canonicalNodeId(startNodeId);
  if (sid == null) return null;
  const parents = buildParentMap(tree);
  let cur = sid;
  for (let i = 0; i < 80; i += 1) {
    const node = findNodeInTree(tree, cur);
    if (!node) return null;
    if (node.nodeType === 'stack') return node;
    const p = parents.get(cur);
    if (p == null) return null;
    cur = p;
  }
  return null;
}

export function findAncestorRowNode(tree, startNodeId) {
  if (startNodeId == null || startNodeId === '') return null;
  const sid = canonicalNodeId(startNodeId);
  if (sid == null) return null;
  const parents = buildParentMap(tree);
  let cur = sid;
  for (let i = 0; i < 80; i += 1) {
    const node = findNodeInTree(tree, cur);
    if (!node) return null;
    if (node.nodeType === 'row') return node;
    const p = parents.get(cur);
    if (p == null) return null;
    cur = p;
  }
  return null;
}

/**
 * Nearest ancestor column. If `startNodeId` is a column, returns that column.
 * @returns {object | null}
 */
export function findAncestorColumnNode(tree, startNodeId) {
  if (startNodeId == null || startNodeId === '') return null;
  const sid = canonicalNodeId(startNodeId);
  if (sid == null) return null;
  const parents = buildParentMap(tree);
  let cur = sid;
  for (let i = 0; i < 80; i += 1) {
    const node = findNodeInTree(tree, cur);
    if (!node) return null;
    if (node.nodeType === 'column') return node;
    const p = parents.get(cur);
    if (p == null) return null;
    cur = p;
  }
  return null;
}

/**
 * Find where a node sits among its siblings (same parent).
 * @returns {{ parentId: number|null, siblingIds: number[], index: number } | null}
 */
export function getSiblingContext(tree, nodeId) {
  const id = canonicalNodeId(nodeId);
  if (id == null) return null;

  function walk(nodes, parentId) {
    if (!Array.isArray(nodes)) return null;
    const ids = nodes.map((n) => n.id);
    const idx = ids.findIndex((nid) => sameBuilderNodeId(nid, id));
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
 * Shallow-merge node `props` patches but deep-merge `meta` so partial meta never drops keys like `sectionLocked`.
 */
export function mergeNodePropsJsonPatch(existingProps = {}, patchProps = {}) {
  if (!patchProps || typeof patchProps !== 'object') {
    return existingProps && typeof existingProps === 'object' ? existingProps : {};
  }
  const base = existingProps && typeof existingProps === 'object' ? existingProps : {};
  const next = { ...base, ...patchProps };
  const em = base.meta;
  const pm = patchProps.meta;
  if (pm != null && typeof pm === 'object' && !Array.isArray(pm)) {
    const prevMeta = em && typeof em === 'object' && !Array.isArray(em) ? em : {};
    next.meta = { ...prevMeta, ...pm };
    for (const k of Object.keys(pm)) {
      if (pm[k] === null) delete next.meta[k];
    }
  }
  return next;
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
