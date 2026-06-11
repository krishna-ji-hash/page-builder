import { isValidNodeHierarchy, normalizeNodeType } from './builderHierarchy.js';
import { computeReorderFromDrop, findNodeInTree } from './builderTree.js';
import { resolveEditableInsertTarget } from './resolveEditableInsertTarget.js';

/**
 * Drop validation parent for dnd-kit zones — blocks may drop on column/row but land in a stack.
 * @param {string|null|undefined} parentType
 * @param {string|null|undefined} draggingNodeType
 */
export function effectiveDropValidationParent(parentType, draggingNodeType) {
  if (!draggingNodeType || !parentType) return parentType ?? null;
  if (isValidNodeHierarchy(draggingNodeType, parentType)) return parentType;
  const normalizedChild = normalizeNodeType(draggingNodeType);
  if (normalizedChild === 'block' && (parentType === 'column' || parentType === 'row')) {
    return 'stack';
  }
  return parentType;
}

/**
 * Resolve a drag-drop target to a hierarchy-valid parent/index.
 * Returns null when the drop is invalid. Set `needsFulfill` when a stack must be scaffolded first.
 *
 * @param {object[]} tree
 * @param {number|string} draggedNodeId
 * @param {string|number} overId
 */
export function resolveHierarchyAwareDrop(tree, draggedNodeId, overId) {
  const raw = computeReorderFromDrop(tree, draggedNodeId, overId);
  if (!raw) return null;

  const dragged = findNodeInTree(tree, draggedNodeId);
  if (!dragged) return null;

  if (raw.newParentId == null) {
    if (isValidNodeHierarchy(dragged.nodeType, null)) return raw;
    return null;
  }

  const parent = findNodeInTree(tree, raw.newParentId);
  if (!parent) return null;

  if (isValidNodeHierarchy(dragged.nodeType, parent.nodeType)) {
    return raw;
  }

  const insertTarget = resolveEditableInsertTarget(tree, raw.newParentId, {
    widgetNodeType: dragged.nodeType,
  });
  if (!insertTarget.ok) return null;

  if (
    insertTarget.createMissingStack ||
    insertTarget.createMissingColumn ||
    insertTarget.createFeatureTabPanelStack
  ) {
    return {
      needsFulfill: true,
      insertTarget,
      newParentId: raw.newParentId,
      newIndex: raw.newIndex,
    };
  }

  if (insertTarget.parentId == null) return null;

  return {
    newParentId: insertTarget.parentId,
    newIndex:
      Number.isInteger(insertTarget.insertIndex) && insertTarget.insertIndex >= 0
        ? insertTarget.insertIndex
        : raw.newIndex,
  };
}
