/**
 * Detect published/draft JSON shape without mutating render pipelines.
 * Node trees use the legacy PublishedLiveTree path; sections/blocks use PublicPageRenderer fallback.
 */

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

/** Builder node tree: `{ nodes: [...] }`, legacy array root, or nested project layout with nodes. */
export function extractPublishedNodes(content) {
  if (Array.isArray(content)) {
    return content.length ? content : null;
  }
  const root = asRecord(content);
  if (!root) return null;

  if (Array.isArray(root.nodes) && root.nodes.length) {
    return root.nodes;
  }

  if (Array.isArray(root.snapshot) && root.snapshot.length) {
    return root.snapshot;
  }

  if (Array.isArray(root.layout) && root.layout.length) {
    return root.layout;
  }

  return null;
}

export function hasRenderableNodeTree(content) {
  const nodes = extractPublishedNodes(content);
  return Array.isArray(nodes) && nodes.length > 0;
}

/**
 * Sections-style JSON for PublicPageRenderer fallback.
 * Supports `{ sections }`, `{ blocks }`, and legacy array roots that are not node trees.
 */
export function normalizePublishedSections(content) {
  const root = asRecord(content);
  if (!root) return [];

  const sections = root.sections;
  if (Array.isArray(sections)) {
    return sections.filter((item) => item && typeof item === 'object');
  }

  return [];
}

export function normalizePublishedBlocks(content) {
  const root = asRecord(content);
  if (!root) {
    if (Array.isArray(content)) {
      return content.filter((item) => item && typeof item === 'object');
    }
    return [];
  }

  const blocks = root.blocks;
  if (Array.isArray(blocks)) {
    return blocks.filter((item) => item && typeof item === 'object');
  }

  return [];
}

export function hasRenderableSections(content) {
  return normalizePublishedSections(content).length > 0;
}

export function hasRenderableBlocks(content) {
  return normalizePublishedBlocks(content).length > 0;
}

/**
 * Prefer legacy live tree when nodes exist; then sections; then blocks.
 */
export function resolvePublishedRenderMode(content) {
  if (hasRenderableNodeTree(content)) return 'nodes';
  if (hasRenderableSections(content)) return 'sections';
  if (hasRenderableBlocks(content)) return 'blocks';
  return 'unknown';
}
