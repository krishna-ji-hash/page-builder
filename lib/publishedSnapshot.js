import { emptyFrozenGlobalSections } from './globalSectionSnapshot.js';

function normalizeGlobalSectionRole(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  return normalizeNodeEntry(entry);
}

/** @param {unknown} raw */
function normalizeGlobalSectionsInSnapshot(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return emptyFrozenGlobalSections();
  }
  const header = raw.header != null ? normalizeGlobalSectionRole(raw.header) : null;
  const footer = raw.footer != null ? normalizeGlobalSectionRole(raw.footer) : null;
  return { header, footer };
}

/**
 * Validate and normalize a published page snapshot (page_versions.snapshot_json).
 * Shape: `{ nodes: object[], globalSections?: { header?, footer? } }`
 * @returns {{ ok: true, nodes: object[], globalSections: { header: object|null, footer: object|null } } | { ok: false, code: string }}
 */
export function parsePublishedSnapshot(raw) {
  let data = raw;
  if (data == null) {
    return { ok: false, code: 'empty' };
  }
  if (typeof globalThis.Buffer !== 'undefined' && globalThis.Buffer.isBuffer?.(data)) {
    try {
      data = JSON.parse(data.toString('utf8'));
    } catch {
      return { ok: false, code: 'invalid_json' };
    }
  } else if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return { ok: false, code: 'invalid_json' };
    }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, code: 'invalid_shape' };
  }
  if (!Array.isArray(data.nodes)) {
    return { ok: false, code: 'missing_nodes' };
  }

  const nodes = [];
  for (const node of data.nodes) {
    const normalized = normalizeNodeEntry(node);
    if (!normalized) {
      return { ok: false, code: 'invalid_node' };
    }
    nodes.push(normalized);
  }
  const globalSections = normalizeGlobalSectionsInSnapshot(data.globalSections);
  return { ok: true, nodes, globalSections };
}

function normalizeNodeEntry(node) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return null;
  if (typeof node.nodeType !== 'string' || !node.nodeType) return null;
  if ('children' in node && !Array.isArray(node.children)) {
    return null;
  }
  const childrenRaw = Array.isArray(node.children) ? node.children : [];
  const children = [];
  for (const c of childrenRaw) {
    const n = normalizeNodeEntry(c);
    if (!n) return null;
    children.push(n);
  }
  const props = node.props && typeof node.props === 'object' && !Array.isArray(node.props) ? node.props : {};
  const out = {
    id: node.id,
    nodeType: node.nodeType,
    displayName: typeof node.displayName === 'string' ? node.displayName : '',
    positionIndex: Number.isFinite(node.positionIndex) ? node.positionIndex : 0,
    props,
    children,
  };
  if (node.style_json && typeof node.style_json === 'object' && !Array.isArray(node.style_json)) {
    out.style_json = node.style_json;
  }
  if (node.dataJson && typeof node.dataJson === 'object' && !Array.isArray(node.dataJson)) {
    out.dataJson = node.dataJson;
  }
  if (node.actionsJson && typeof node.actionsJson === 'object' && !Array.isArray(node.actionsJson)) {
    out.actionsJson = node.actionsJson;
  }
  return out;
}
