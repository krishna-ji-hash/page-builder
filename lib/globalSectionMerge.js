/**
 * Decide when to prepend global header/footer for live / draft preview.
 * Page-owned header/footer rows are marked with props.meta.isHeader / props.meta.isFooter
 * (or top-level meta for JSON stored outside builder_nodes).
 */

function rowDeclaresHeader(node) {
  if (!node || node.nodeType !== 'row') return false;
  const meta = node.meta || node.props?.meta || {};
  return meta.isHeader === true || meta.role === 'header';
}

function rowDeclaresFooter(node) {
  if (!node || node.nodeType !== 'row') return false;
  const meta = node.meta || node.props?.meta || {};
  return meta.isFooter === true || meta.role === 'footer';
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
 * Keep site chrome above article content when a page stores header/footer mid-tree
 * (common bug for blog-post templates — breadcrumbs otherwise appear above the nav).
 * @param {unknown[]} roots
 */
export function orderPageRootsHeaderContentFooter(roots) {
  const list = Array.isArray(roots) ? roots : [];
  if (list.length < 2) return list;
  const headers = [];
  const footers = [];
  const middle = [];
  for (const node of list) {
    if (rowDeclaresHeader(node)) headers.push(node);
    else if (rowDeclaresFooter(node)) footers.push(node);
    else middle.push(node);
  }
  if (!headers.length && !footers.length) return list;
  return [...headers, ...middle, ...footers];
}

/**
 * @param {unknown[]} pageRootNodes
 * @param {unknown | null} globalHeader
 * @param {unknown | null} globalFooter
 * @param {(node: unknown, prefix: string) => unknown} cloneGlobalNode
 */
export function buildRenderNodesWithGlobals(pageRootNodes, globalHeader, globalFooter, cloneGlobalNode) {
  const roots = orderPageRootsHeaderContentFooter(
    Array.isArray(pageRootNodes) ? pageRootNodes : []
  );
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
