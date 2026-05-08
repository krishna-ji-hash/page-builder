function cloneNode(node, prefix, parentId = null) {
  const id = `${prefix}-${String(node.id ?? 'n')}`;
  const base = {
    ...node,
    id,
    parentNodeId: parentId,
    children: [],
  };
  const kids = Array.isArray(node.children) ? node.children : [];
  base.children = kids.map((c) => cloneNode(c, prefix, id));
  return base;
}

function isLinkedPlaceholder(node) {
  if (!node || node.nodeType !== 'row') return false;
  const meta = node.props?.meta || node.meta || {};
  return meta?.globalMode === 'linked' && meta?.globalComponentId != null;
}

/**
 * Expand linked global components into node trees **before** renderTree.
 * - Does not change renderTree pipeline; it only transforms the node list.
 * - Prevents recursion/cycles via a visited set.
 *
 * @param {any[]} roots page root nodes
 * @param {(id: number) => { nodes: any[] } | null} resolver returns snapshot {nodes} for component id
 */
export function expandLinkedGlobalComponents(roots, resolver) {
  const visited = new Set();

  function expandList(list) {
    const out = [];
    for (const node of Array.isArray(list) ? list : []) {
      if (!isLinkedPlaceholder(node)) {
        const kids = Array.isArray(node.children) ? expandList(node.children) : node.children;
        out.push({ ...node, children: kids });
        continue;
      }
      const meta = node.props?.meta || {};
      const compId = Number(meta.globalComponentId);
      if (!Number.isInteger(compId) || compId <= 0) {
        out.push(node);
        continue;
      }
      if (visited.has(compId)) {
        // recursion/cycle: keep placeholder but drop children
        out.push({ ...node, children: [] });
        continue;
      }
      visited.add(compId);
      const snap = resolver?.(compId);
      const snapNodes = Array.isArray(snap?.nodes) ? snap.nodes : [];
      // Replace placeholder row with snapshot roots (cloned with stable prefix).
      const prefix = `gc-${compId}-at-${String(node.id ?? 'row')}`;
      const clonedRoots = snapNodes.map((r, idx) => {
        const cloned = cloneNode({ ...r, positionIndex: node.positionIndex ?? idx }, prefix, null);
        return cloned;
      });
      out.push(...clonedRoots);
      visited.delete(compId);
    }
    return out;
  }

  return expandList(roots);
}

