/** Content node types stored in DB; hierarchy treats them as "block" children of stack. */
export const BLOCK_TYPES = new Set([
  'heading',
  'text',
  'rich_text',
  'image',
  'button',
  'menu',
  'table',
  'form',
  'carousel',
]);

/** Layout containers that may appear in the tree as parents. */
export const CONTAINER_TYPES = new Set(['row', 'column', 'stack']);

/**
 * Strict layout rules:
 * - row: only at root (no parent)
 * - column: only inside row
 * - stack: only inside column
 * - block (heading/text/image/button): only inside stack
 */
const REQUIRED_PARENT_BY_NORMALIZED = {
  row: null,
  column: 'row',
  stack: 'column',
  block: 'stack',
};

export function normalizeNodeType(nodeType) {
  if (!nodeType || typeof nodeType !== 'string') return '';
  if (BLOCK_TYPES.has(nodeType)) return 'block';
  return nodeType;
}

export function isContainerNodeType(nodeType) {
  return CONTAINER_TYPES.has(nodeType);
}

/**
 * @param {string} childNodeType - raw DB node_type
 * @param {string|null|undefined} parentNodeType - raw parent node_type, or null/undefined for root
 */
export function assertValidNodeHierarchy(childNodeType, parentNodeType) {
  const normalizedChild = normalizeNodeType(childNodeType);
  if (!normalizedChild || !(normalizedChild in REQUIRED_PARENT_BY_NORMALIZED)) {
    throw new Error(`Invalid node type: ${childNodeType}`);
  }
  const requiredParent = REQUIRED_PARENT_BY_NORMALIZED[normalizedChild];
  const normalizedParent = parentNodeType ? normalizeNodeType(parentNodeType) : null;
  if (requiredParent !== normalizedParent) {
    const where = requiredParent === null ? 'root only' : `inside ${requiredParent}`;
    throw new Error(`Invalid hierarchy: ${childNodeType} must be ${where}`);
  }
}

export function isValidNodeHierarchy(childNodeType, parentNodeType) {
  try {
    assertValidNodeHierarchy(childNodeType, parentNodeType);
    return true;
  } catch {
    return false;
  }
}

/** When moving under a parent id, that parent must exist and be a layout container. */
export function assertValidReorderParent(newParentId, parentRow) {
  if (!newParentId) return;
  if (!parentRow) {
    throw new Error('Parent node not found');
  }
  if (!isContainerNodeType(parentRow.node_type)) {
    throw new Error('Invalid move: parent must be a row, column, or stack container');
  }
}
