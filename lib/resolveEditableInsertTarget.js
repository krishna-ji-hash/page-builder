import { isDataDrivenCompoundWidget } from './compoundWidgetRegistry.js';
import {
  findAncestorColumnNode,
  findAncestorRowNode,
  findAncestorStackNode,
  findNodeInTree,
  getSiblingContext,
  sameBuilderNodeId,
} from './builderTree.js';
import { isNodeEditsDisabledBySectionLock } from './rowLayoutMeta.js';

/** @param {object[]} tree */
function collectStackNodes(tree, out = []) {
  if (!Array.isArray(tree)) return out;
  for (const node of tree) {
    if (!node) continue;
    if (node.nodeType === 'stack') out.push(node);
    if (node.children?.length) collectStackNodes(node.children, out);
  }
  return out;
}

function findFirstUnlockedStackId(tree) {
  for (const stack of collectStackNodes(tree)) {
    if (!isNodeEditsDisabledBySectionLock(tree, stack.id)) return stack.id;
  }
  return null;
}

export const INSERT_TARGET_MESSAGES = {
  locked: 'Unlock section to add elements.',
  compound:
    'This widget is data-driven. Use its Content controls, or add a new Stack beside/below it.',
  'no-target': 'Select a Section, Column, or Stack (or an element inside a Stack) to add widgets.',
};

/**
 * Resolve where a leaf widget should be inserted (sync — no API calls).
 * @param {object[]} tree
 * @param {number|string|null|undefined} targetNodeId
 * @param {{ widgetNodeType?: string, forLeafWidget?: boolean }} [options]
 */
export function resolveEditableInsertTarget(tree, targetNodeId, options = {}) {
  if (!Array.isArray(tree) || tree.length === 0) {
    return { ok: false, reason: 'no-target', message: INSERT_TARGET_MESSAGES['no-target'] };
  }

  const target =
    targetNodeId != null && targetNodeId !== ''
      ? findNodeInTree(tree, targetNodeId)
      : null;

  if (targetNodeId != null && targetNodeId !== '' && !target?.id) {
    return { ok: false, reason: 'no-target', message: INSERT_TARGET_MESSAGES['no-target'] };
  }

  if (target?.id && isNodeEditsDisabledBySectionLock(tree, target.id)) {
    return { ok: false, reason: 'locked', message: INSERT_TARGET_MESSAGES.locked };
  }

  if (target && isDataDrivenCompoundWidget(target.nodeType)) {
    return resolveCompoundWidgetInsertTarget(tree, target);
  }

  if (!target) {
    const stackId = findFirstUnlockedStackId(tree);
    if (stackId == null) {
      return { ok: false, reason: 'no-target', message: INSERT_TARGET_MESSAGES['no-target'] };
    }
    const stack = findNodeInTree(tree, stackId);
    return {
      ok: true,
      parentId: stackId,
      insertIndex: (stack?.children || []).length,
    };
  }

  if (target.nodeType === 'stack') {
    return {
      ok: true,
      parentId: target.id,
      insertIndex: (target.children || []).length,
    };
  }

  if (target.nodeType === 'column') {
    return resolveColumnInsertTarget(tree, target);
  }

  if (target.nodeType === 'row') {
    return resolveRowInsertTarget(tree, target);
  }

  if (target.nodeType === 'modal') {
    const stackChild = (target.children || []).find((c) => c?.nodeType === 'stack');
    if (stackChild?.id && !isNodeEditsDisabledBySectionLock(tree, stackChild.id)) {
      return {
        ok: true,
        parentId: stackChild.id,
        insertIndex: (stackChild.children || []).length,
      };
    }
    return {
      ok: true,
      createMissingStack: true,
      stackParentId: target.id,
      insertIndex: 0,
    };
  }

  const stack = findAncestorStackNode(tree, target.id);
  if (stack?.id) {
    if (isNodeEditsDisabledBySectionLock(tree, stack.id)) {
      return { ok: false, reason: 'locked', message: INSERT_TARGET_MESSAGES.locked };
    }
    const ctx = getSiblingContext(tree, target.id);
    if (ctx && sameBuilderNodeId(ctx.parentId, stack.id)) {
      return {
        ok: true,
        parentId: stack.id,
        insertIndex: ctx.index + 1,
      };
    }
    return {
      ok: true,
      parentId: stack.id,
      insertIndex: (stack.children || []).length,
    };
  }

  const column = findAncestorColumnNode(tree, target.id);
  if (column?.id) {
    return resolveColumnInsertTarget(tree, column);
  }

  const row = findAncestorRowNode(tree, target.id);
  if (row?.id) {
    return resolveRowInsertTarget(tree, row);
  }

  return { ok: false, reason: 'no-target', message: INSERT_TARGET_MESSAGES['no-target'] };
}

/**
 * Quick-add beside/below a compound widget (tabs, carousel, accordion, …) in the parent stack.
 * @param {object[]} tree
 * @param {object} compoundNode
 */
function resolveCompoundWidgetInsertTarget(tree, compoundNode) {
  const stack = findAncestorStackNode(tree, compoundNode.id);
  if (stack?.id) {
    if (isNodeEditsDisabledBySectionLock(tree, stack.id)) {
      return { ok: false, reason: 'locked', message: INSERT_TARGET_MESSAGES.locked };
    }
    const ctx = getSiblingContext(tree, compoundNode.id);
    if (ctx && sameBuilderNodeId(ctx.parentId, stack.id)) {
      return {
        ok: true,
        parentId: stack.id,
        insertIndex: ctx.index + 1,
      };
    }
    return {
      ok: true,
      parentId: stack.id,
      insertIndex: (stack.children || []).length,
    };
  }

  const column = findAncestorColumnNode(tree, compoundNode.id);
  if (column?.id) {
    return resolveColumnInsertTarget(tree, column);
  }

  const row = findAncestorRowNode(tree, compoundNode.id);
  if (row?.id) {
    return resolveRowInsertTarget(tree, row);
  }

  return { ok: false, reason: 'compound', message: INSERT_TARGET_MESSAGES.compound };
}

/** @param {object[]} tree @param {object} column */
function resolveColumnInsertTarget(tree, column) {
  if (isNodeEditsDisabledBySectionLock(tree, column.id)) {
    return { ok: false, reason: 'locked', message: INSERT_TARGET_MESSAGES.locked };
  }
  const stacks = (column.children || []).filter((c) => c?.nodeType === 'stack');
  const editable = stacks.find((s) => s?.id && !isNodeEditsDisabledBySectionLock(tree, s.id));
  if (editable?.id) {
    return {
      ok: true,
      parentId: editable.id,
      insertIndex: (editable.children || []).length,
    };
  }
  return {
    ok: true,
    createMissingStack: true,
    stackParentId: column.id,
    insertIndex: stacks.length,
  };
}

/** @param {object[]} tree @param {object} row */
function resolveRowInsertTarget(tree, row) {
  if (isNodeEditsDisabledBySectionLock(tree, row.id)) {
    return { ok: false, reason: 'locked', message: INSERT_TARGET_MESSAGES.locked };
  }
  const columns = (row.children || []).filter((c) => c?.nodeType === 'column');
  for (const col of columns) {
    const colTarget = resolveColumnInsertTarget(tree, col);
    if (colTarget.ok && colTarget.parentId != null) {
      return colTarget;
    }
    if (colTarget.ok && colTarget.createMissingStack) {
      return colTarget;
    }
  }
  for (const col of columns) {
    if (isNodeEditsDisabledBySectionLock(tree, col.id)) continue;
    const stacks = (col.children || []).filter((c) => c?.nodeType === 'stack');
    if (!stacks.length) {
      return {
        ok: true,
        createMissingStack: true,
        stackParentId: col.id,
        insertIndex: 0,
      };
    }
  }
  const unlockedCol = columns.find((c) => c?.id && !isNodeEditsDisabledBySectionLock(tree, c.id));
  if (unlockedCol?.id) {
    return {
      ok: true,
      createMissingStack: true,
      stackParentId: unlockedCol.id,
      insertIndex: 0,
    };
  }
  return {
    ok: true,
    createMissingColumn: true,
    rowParentId: row.id,
    insertIndex: columns.length,
    createMissingStack: true,
  };
}

/** Whether quick-add is plausible for the current selection (sidebar enablement). */
export function canQuickAddFromSelection(tree, selectedNode) {
  if (!selectedNode?.id) return false;
  if (selectedNode.nodeType === 'row' || selectedNode.nodeType === 'column' || selectedNode.nodeType === 'stack') {
    return true;
  }
  const r = resolveEditableInsertTarget(tree, selectedNode.id, { forLeafWidget: true });
  return r.ok;
}
