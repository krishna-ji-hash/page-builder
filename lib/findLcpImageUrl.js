import { isMeaningfulImageSrc } from './liveImagePerf.js';

function walk(nodes, visit) {
  if (!Array.isArray(nodes)) return;
  for (const n of nodes) {
    if (!n) continue;
    visit(n);
    if (Array.isArray(n.children) && n.children.length) walk(n.children, visit);
  }
}

/**
 * First meaningful image in document order (LCP candidate on typical marketing pages).
 * @param {object[]} nodes
 * @returns {string|null}
 */
export function findFirstLcpImageUrl(nodes) {
  let found = null;
  walk(nodes, (node) => {
    if (found) return;
    if (node.nodeType === 'image' && isMeaningfulImageSrc(node.props?.src)) {
      found = String(node.props.src).trim();
      return;
    }
    if (node.nodeType === 'carousel') {
      const slides = Array.isArray(node.props?.slides) ? node.props.slides : [];
      for (const slide of slides) {
        const src =
          slide?.imageSrc || slide?.image || slide?.imageUrl || '';
        if (isMeaningfulImageSrc(src)) {
          found = String(src).trim();
          return;
        }
      }
    }
  });
  return found;
}
