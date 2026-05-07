/**
 * Decide when to prepend global header/footer for live / draft preview.
 * Page-owned header/footer rows are marked with props.meta.isHeader / props.meta.isFooter
 * (or top-level meta for JSON stored outside builder_nodes).
 */

function rowDeclaresHeader(node) {
  if (!node || node.nodeType !== 'row') return false;
  return node.meta?.isHeader === true || node.props?.meta?.isHeader === true;
}

function rowDeclaresFooter(node) {
  if (!node || node.nodeType !== 'row') return false;
  return node.meta?.isFooter === true || node.props?.meta?.isFooter === true;
}

/** @param {unknown[]} pageRootNodes */
export function pageDeclaresOwnHeader(pageRootNodes) {
  return (Array.isArray(pageRootNodes) ? pageRootNodes : []).some(rowDeclaresHeader);
}

/** @param {unknown[]} pageRootNodes */
export function pageDeclaresOwnFooter(pageRootNodes) {
  return (Array.isArray(pageRootNodes) ? pageRootNodes : []).some(rowDeclaresFooter);
}

/**
 * @param {unknown[]} pageRootNodes
 * @param {unknown | null} globalHeader
 * @param {unknown | null} globalFooter
 * @param {(node: unknown, prefix: string) => unknown} cloneGlobalNode
 */
export function buildRenderNodesWithGlobals(pageRootNodes, globalHeader, globalFooter, cloneGlobalNode) {
  const roots = Array.isArray(pageRootNodes) ? pageRootNodes : [];
  const out = [];
  if (globalHeader && !pageDeclaresOwnHeader(roots)) {
    out.push(cloneGlobalNode(globalHeader, 'global-header'));
  }
  out.push(...roots);
  if (globalFooter && !pageDeclaresOwnFooter(roots)) {
    out.push(cloneGlobalNode(globalFooter, 'global-footer'));
  }
  return out;
}
