import { autoFixTree, reconcileStructuralParents, validateTree } from './builderTree.js';

/**
 * Flatten reusable block snapshot nodes for POST /api/pages/:pageId/nodes/bulk.
 * @param {number} blockId
 * @param {object[]} snapshotNodes
 * @param {number} rootInsertIndex
 */
export function buildReusableBulkOrderedNodes(blockId, snapshotNodes, rootInsertIndex = 0) {
  const fixed = reconcileStructuralParents(autoFixTree(snapshotNodes));
  validateTree(fixed);
  const ordered = [];
  const walk = (n, parentRef = null, rootOffset = 0) => {
    const tempId = `rb-${blockId}-${n.id}`;
    const entry = {
      tempId,
      parentRef: parentRef || null,
      nodeType: n.nodeType,
      displayName: n.displayName || n.nodeType,
      positionIndex:
        parentRef == null ? rootInsertIndex + rootOffset : Number(n.positionIndex) || 0,
      props: n.props || {},
      style_json: n.style_json || (n.props?.style_json ?? undefined),
      dataJson: n.dataJson ?? null,
      actionsJson: n.actionsJson ?? null,
    };
    ordered.push(entry);
    for (const child of n.children || []) {
      walk(child, tempId, 0);
    }
  };
  fixed.forEach((root, rIdx) => walk(root, null, rIdx));
  return { ordered, fixed };
}
