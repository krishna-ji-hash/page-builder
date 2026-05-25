import { findNodeInTree, getSiblingContext, canonicalNodeId } from './builderTree.js';

/** True when `meta.sectionLocked` is set in a way that should lock the section (handles DB/JSON quirks). */
export function isSectionLockedFlagValue(raw) {
  if (raw === true || raw === 1) return true;
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 'on';
  }
  return false;
}

/**
 * After merge, the row is explicitly being unlocked (server + client allow only this edit on a locked section row).
 * Accepts boolean false, 0, and common string forms — not strict `=== false` only.
 */
export function metaRepresentsExplicitSectionUnlock(meta) {
  if (!meta || typeof meta !== 'object') return false;
  if (!Object.prototype.hasOwnProperty.call(meta, 'sectionLocked')) return false;
  const v = meta.sectionLocked;
  if (v === false || v === 0) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'false' || s === '0' || s === 'off' || s === 'no';
  }
  return false;
}

/** Row section metadata (header/footer roles, layout guardrails). */
export function isHeaderRowNode(node) {
  if (!node || node.nodeType !== 'row') return false;
  const m = node.props?.meta || node.meta || {};
  return Boolean(m.isHeader || m.role === 'header');
}

export function isFooterRowNode(node) {
  if (!node || node.nodeType !== 'row') return false;
  const m = node.props?.meta || node.meta || {};
  return Boolean(m.isFooter || m.role === 'footer');
}

export function isLayoutLockedRow(node) {
  if (!node || node.nodeType !== 'row') return false;
  const m = node.props?.meta || node.meta || {};
  // Same rules as section lock — avoid Boolean("false") === true from JSON/string quirks.
  return isSectionLockedFlagValue(m.layoutLocked);
}

/** User “section lock” — entire subtree is read-only until unlocked from Layers / Sections. */
export function isSectionLockedRow(node) {
  if (!node || node.nodeType !== 'row') return false;
  const m = node.props?.meta || node.meta || {};
  return isSectionLockedFlagValue(m.sectionLocked);
}

/** True if any ancestor **section** (`row`) has `meta.sectionLocked`. */
export function isStrictAncestorSectionLocked(tree, nodeId) {
  if (!Array.isArray(tree) || tree.length === 0 || nodeId == null) return false;
  const id = canonicalNodeId(nodeId);
  if (id == null) return false;
  let ctx = getSiblingContext(tree, id);
  while (ctx && ctx.parentId != null) {
    const parent = findNodeInTree(tree, ctx.parentId);
    if (parent?.nodeType === 'row' && isSectionLockedRow(parent)) return true;
    ctx = getSiblingContext(tree, ctx.parentId);
  }
  return false;
}

/**
 * Inspector / canvas should treat this node as non-editable when:
 * - it sits under a locked section, or
 * - it is a locked section row (unlock first).
 */
export function isNodeEditsDisabledBySectionLock(tree, nodeId) {
  if (!Array.isArray(tree) || tree.length === 0 || nodeId == null) return false;
  const nid = canonicalNodeId(nodeId);
  if (nid == null) return false;
  if (isStrictAncestorSectionLocked(tree, nid)) return true;
  const node = findNodeInTree(tree, nid);
  return Boolean(node?.nodeType === 'row' && isSectionLockedRow(node));
}
