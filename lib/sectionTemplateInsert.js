import { autoFixTree, findAncestorColumnNode, findAncestorRowNode, findNodeInTree, getSiblingContext } from './builderTree.js';
import { isNodeEditsDisabledBySectionLock } from './rowLayoutMeta.js';

/** Header/footer templates must stay at page root. */
export const PAGE_LEVEL_SECTION_TEMPLATE_KEYS = new Set([
  'header',
  'headerSpread',
  'headerBoxed',
  'headerCentered',
  'footer',
  'navbar',
]);

export function isPageLevelSectionTemplateKey(key) {
  return PAGE_LEVEL_SECTION_TEMPLATE_KEYS.has(String(key || '').trim());
}

function isRootLevelRow(tree, rowId) {
  const ctx = getSiblingContext(tree, rowId);
  return Boolean(ctx && (ctx.parentId == null || ctx.parentId === ''));
}

function stackAppendIndex(container) {
  return Array.isArray(container?.children) ? container.children.length : 0;
}

export function isPlaceholderEmptyStack(node) {
  if (!node || node.nodeType !== 'stack') return false;
  if (Array.isArray(node.children) && node.children.length > 0) return false;
  const name = String(node.displayName || '').trim();
  return /^Stack(\s+\d+)?$/i.test(name);
}

/** Column looks empty to the user (only auto-scaffold placeholder stacks). */
export function columnHasOnlyPlaceholderStacks(column) {
  const children = column?.children || [];
  if (!children.length) return false;
  return children.every((child) => isPlaceholderEmptyStack(child));
}

/**
 * Resolve whether a section template should fill the selected column or insert a new page section.
 * @param {object[]} tree
 * @param {number|string|null|undefined} targetNodeId
 * @returns {{ mode: 'page-root' } | { mode: 'column', columnId: number|string, rowId: number|string, positionIndex: number }}
 */
export function resolveSectionTemplateInsertContext(tree, targetNodeId) {
  if (!Array.isArray(tree) || !tree.length || targetNodeId == null || targetNodeId === '') {
    return { mode: 'page-root' };
  }
  if (isNodeEditsDisabledBySectionLock(tree, targetNodeId)) {
    return { mode: 'page-root', locked: true };
  }

  const target = findNodeInTree(tree, targetNodeId);
  if (!target) return { mode: 'page-root' };

  let column = null;
  if (target.nodeType === 'column') {
    column = target;
  } else if (target.nodeType === 'stack') {
    column = findAncestorColumnNode(tree, targetNodeId);
  } else if (target.nodeType === 'row') {
    column = (target.children || []).find((c) => c?.nodeType === 'column') || null;
  }

  if (!column?.id) return { mode: 'page-root' };

  const row = findAncestorRowNode(tree, column.id);
  if (!row?.id || !isRootLevelRow(tree, row.id)) {
    return { mode: 'page-root' };
  }

  return {
    mode: 'column',
    columnId: column.id,
    rowId: row.id,
    positionIndex: stackAppendIndex(column),
  };
}

/**
 * @param {object} templateRoot — single section row node
 */
export function templateRowContentColumns(templateRoot) {
  const fixed = autoFixTree([templateRoot])[0];
  return (fixed?.children || []).filter((c) => c?.nodeType === 'column');
}

/**
 * DFS bulk nodes for template children under an existing column.
 * @param {object} templateRoot
 * @param {number|string} targetColumnId
 * @param {number} startPositionIndex
 */
export function flattenTemplateIntoColumnBulkNodes(templateRoot, targetColumnId, startPositionIndex = 0) {
  const columns = templateRowContentColumns(templateRoot);
  if (!columns.length) {
    throw new Error('Section template has no column content');
  }

  const toInsert = [];
  for (const col of columns) {
    for (const child of col.children || []) {
      toInsert.push(child);
    }
  }
  if (!toInsert.length) {
    throw new Error('Section template column is empty');
  }

  const out = [];
  let seq = 0;
  function walk(node, parentTempId, parentNodeId, childIndex) {
    const tempId = `t${seq}`;
    seq += 1;
    const row = {
      tempId,
      nodeType: node.nodeType,
      displayName: node.displayName || node.nodeType,
      positionIndex: childIndex,
    };
    if (node.props) row.props = node.props;
    if (node.style_json) row.style_json = node.style_json;
    if (parentTempId != null) row.parentRef = parentTempId;
    else row.parentNodeId = parentNodeId;
    out.push(row);
    (node.children || []).forEach((ch, i) => walk(ch, tempId, null, i));
  }

  toInsert.forEach((child, i) => {
    walk(child, null, targetColumnId, startPositionIndex + i);
  });
  return out;
}

/** Row-level patch when applying template inside an existing section column. */
export function templateRowPatchFromRoot(templateRoot) {
  const fixed = autoFixTree([templateRoot])[0];
  const patch = {};
  if (fixed?.displayName) patch.displayName = fixed.displayName;
  if (fixed?.props) patch.props = fixed.props;
  if (fixed?.style_json) patch.style_json = fixed.style_json;
  return patch;
}
