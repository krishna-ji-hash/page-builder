/** Courier partner template card — inspector + canvas helpers. */

export function isCourierPartnerCardStack(node) {
  if (!node || node.nodeType !== 'stack') return false;
  return String(node?.props?.meta?.tplRole || '') === 'courier-partner-card';
}

/** @returns {{ image: object|null, label: object|null }|null} */
export function getCourierPartnerCardParts(stackNode) {
  if (!isCourierPartnerCardStack(stackNode)) return null;
  const children = Array.isArray(stackNode.children) ? stackNode.children : [];
  const image = children.find((c) => c?.nodeType === 'image') || null;
  const label = children.find((c) => c?.nodeType === 'text') || null;
  if (!image && !label) return null;
  return { image, label };
}
