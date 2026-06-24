/**
 * Builder node tree ↔ pages.draftJson helpers for /d/builder flow.
 */

export function extractTreeFromDraftJson(draftJson) {
  if (!draftJson || typeof draftJson !== 'object' || Array.isArray(draftJson)) return [];
  const nodes = draftJson.nodes;
  return Array.isArray(nodes) ? nodes : [];
}

export function normalizeDraftJsonObject(draftJson) {
  if (!draftJson || typeof draftJson !== 'object' || Array.isArray(draftJson)) return {};
  return { ...draftJson };
}

/** Persist current builder tree into draftJson while keeping non-node keys (e.g. sections). */
export function buildDraftContentFromTree(baseDraftJson, tree) {
  const base = normalizeDraftJsonObject(baseDraftJson);
  return { ...base, nodes: tree };
}
