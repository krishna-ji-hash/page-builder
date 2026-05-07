/**
 * Validate and normalize a published page snapshot (page_versions.snapshot_json).
 * @returns {{ ok: true, nodes: object[] } | { ok: false, code: string }}
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
  return { ok: true, nodes };
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
