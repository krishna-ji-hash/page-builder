import { findNodeInTree } from './builderTree.js';

export const MODAL_CONTENT_STACK_NAME = 'Modal content';

/** @param {object} props */
export function modalDialogStyleFromProps(props = {}) {
  const widthPx = Number(props.dialogWidthPx);
  const maxWidthPx = Number(props.dialogMaxWidthPx);
  const minHeightPx = Number(props.dialogMinHeightPx);
  const maxHeightPx = Number(props.dialogMaxHeightPx);
  const style = {};
  if (Number.isFinite(widthPx) && widthPx >= 280) style.width = `${Math.min(widthPx, 1200)}px`;
  if (Number.isFinite(maxWidthPx) && maxWidthPx >= 280) style.maxWidth = `${Math.min(maxWidthPx, 1200)}px`;
  if (Number.isFinite(minHeightPx) && minHeightPx >= 80) style.minHeight = `${Math.min(minHeightPx, 900)}px`;
  if (Number.isFinite(maxHeightPx) && maxHeightPx >= 120) style.maxHeight = `${Math.min(maxHeightPx, 900)}px`;
  return style;
}

/** Nearest stack directly under a modal node. */
export function findModalContentStack(modalNode) {
  if (!modalNode || modalNode.nodeType !== 'modal') return null;
  const kids = Array.isArray(modalNode.children) ? modalNode.children : [];
  return kids.find((c) => c?.nodeType === 'stack') || null;
}

export function findModalContentStackInTree(tree, modalNodeId) {
  const modal = findNodeInTree(tree, modalNodeId);
  return findModalContentStack(modal);
}

export function modalUsesLegacyBody(modalNode) {
  const stack = findModalContentStack(modalNode);
  if (!stack) return true;
  return !(Array.isArray(stack.children) && stack.children.length > 0);
}
