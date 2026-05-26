/**
 * Stable React keys for liveRenderer — include parent path + index so duplicate node ids
 * in a snapshot cannot collapse sibling stacks/leaves during SSR hydration.
 */
export function liveRenderChildKey(parentKey, child, index) {
  const type = child?.nodeType ? String(child.nodeType) : 'node';
  const id = child?.id != null && child.id !== '' ? String(child.id) : `i${index}`;
  return `${parentKey}/${type}:${id}@${index}`;
}

export function liveRenderRootKey(node, index) {
  const type = node?.nodeType ? String(node.nodeType) : 'row';
  const id = node?.id != null && node.id !== '' ? String(node.id) : `i${index}`;
  return `root/${type}:${id}@${index}`;
}
