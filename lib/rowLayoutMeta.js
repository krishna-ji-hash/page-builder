/** Row section metadata (header/footer roles, layout guardrails). */
export function isHeaderRowNode(node) {
  if (!node || node.nodeType !== 'row') return false;
  const m = node.props?.meta || node.meta || {};
  return Boolean(m.isHeader || m.role === 'header');
}

export function isLayoutLockedRow(node) {
  if (!node || node.nodeType !== 'row') return false;
  const m = node.props?.meta || node.meta || {};
  return Boolean(m.layoutLocked);
}
