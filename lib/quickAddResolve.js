import { BLOCK_TYPES } from './builderHierarchy.js';
import { findAncestorStackNode, findNodeInTree } from './builderTree.js';
import { findModalContentStack } from './modalElement.js';
import { isNodeEditsDisabledBySectionLock } from './rowLayoutMeta.js';

/** Content blocks that must live inside a stack (includes advanced elements). */
export function isStackLeafWidgetType(nodeType) {
  return BLOCK_TYPES.has(nodeType);
}

/** @param {object[]} tree */
export function collectStackNodes(tree, out = []) {
  if (!Array.isArray(tree)) return out;
  for (const node of tree) {
    if (!node) continue;
    if (node.nodeType === 'stack') out.push(node);
    if (node.children?.length) collectStackNodes(node.children, out);
  }
  return out;
}

/** First stack not under a locked section. */
export function findFirstUnlockedStackId(tree) {
  for (const stack of collectStackNodes(tree)) {
    if (!isNodeEditsDisabledBySectionLock(tree, stack.id)) return stack.id;
  }
  return null;
}

/**
 * Resolve stack parent for quick-add of a leaf widget from current selection.
 * Prefers ancestor stack; falls back to any unlocked stack on the page.
 */
export function resolveQuickAddStackParentId(tree, targetNodeId) {
  const target = findNodeInTree(tree, targetNodeId);
  if (target?.nodeType === 'modal') {
    const stack = findModalContentStack(target);
    if (stack?.id) {
      if (!isNodeEditsDisabledBySectionLock(tree, stack.id)) return stack.id;
      const fallback = findFirstUnlockedStackId(tree);
      return fallback ?? stack.id;
    }
    return findFirstUnlockedStackId(tree);
  }
  if (target?.nodeType === 'stack') {
    if (!isNodeEditsDisabledBySectionLock(tree, target.id)) return target.id;
    return findFirstUnlockedStackId(tree) ?? target.id;
  }

  const ancestor = findAncestorStackNode(tree, targetNodeId);
  if (ancestor?.id) {
    if (!isNodeEditsDisabledBySectionLock(tree, ancestor.id)) return ancestor.id;
    const fallback = findFirstUnlockedStackId(tree);
    return fallback ?? ancestor.id;
  }

  return findFirstUnlockedStackId(tree);
}
