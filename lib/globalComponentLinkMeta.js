export function getGlobalLinkMeta(node) {
  if (!node || typeof node !== 'object') return null;
  const props = node.props && typeof node.props === 'object' ? node.props : {};
  const meta = props.meta && typeof props.meta === 'object' ? props.meta : {};
  const globalMode = meta.globalMode;
  const globalComponentId = meta.globalComponentId;
  if (globalMode !== 'linked') return null;
  const idNum = Number(globalComponentId);
  if (!Number.isInteger(idNum) || idNum <= 0) return null;
  return {
    globalComponentId: idNum,
    globalMode: 'linked',
    globalComponentName: typeof meta.globalComponentName === 'string' ? meta.globalComponentName : '',
  };
}

export function isLinkedGlobalPlaceholder(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.nodeType !== 'row') return false;
  return Boolean(getGlobalLinkMeta(node));
}

export function treeContainsLinkedGlobals(nodes) {
  const stack = Array.isArray(nodes) ? [...nodes] : [];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    if (isLinkedGlobalPlaceholder(n)) return true;
    const kids = Array.isArray(n.children) ? n.children : [];
    for (const c of kids) stack.push(c);
  }
  return false;
}

