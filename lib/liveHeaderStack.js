import { isHeaderRowNode } from './rowLayoutMeta.js';

/**
 * Group consecutive root header rows for stacked rendering (announcement + nav).
 * @param {Array<{ nodeType?: string, props?: { meta?: object } }>} nodes
 * @returns {Array<{ type: 'header-stack' | 'single', items: Array<{ node: object, index: number }> }>}
 */
export function segmentRootNodes(nodes) {
  if (!Array.isArray(nodes) || !nodes.length) return [];
  const segments = [];
  let index = 0;
  while (index < nodes.length) {
    const node = nodes[index];
    if (!node) {
      index += 1;
      continue;
    }
    if (isHeaderRowNode(node)) {
      const items = [];
      let j = index;
      while (j < nodes.length && isHeaderRowNode(nodes[j])) {
        items.push({ node: nodes[j], index: j });
        j += 1;
      }
      if (items.length > 1) {
        segments.push({ type: 'header-stack', items });
        index = j;
        continue;
      }
    }
    segments.push({ type: 'single', items: [{ node, index }] });
    index += 1;
  }
  return segments;
}
