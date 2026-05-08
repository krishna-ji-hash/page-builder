import { applyBindingsToTree } from '@/lib/cms/cmsBindings';
import { normalizeCmsRepeatQuery } from '@/lib/cms/cmsQuery';

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function safeInt(n, fallback = null) {
  const v = Number(n);
  return Number.isInteger(v) ? v : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function cloneNodeWithPrefix(node, prefix, parentId = null) {
  const id = `${prefix}-${node.id}`;
  const children = Array.isArray(node.children) ? node.children : [];
  return {
    ...node,
    id,
    parentNodeId: parentId,
    children: children.map((c) => cloneNodeWithPrefix(c, prefix, id)),
  };
}

function cmsMeta(node) {
  const m = node?.props?.meta;
  return isPlainObject(m) ? m.cms : null;
}

function normalizeQuery(raw) {
  return normalizeCmsRepeatQuery(raw);
}

/**
 * Expand CMS repeaters + bindings before renderTree.
 *
 * Repeater encoding (additive; no renderer changes):
 * - Put repeater config on any node at `node.props.meta.cms.repeat`
 * - The node's FIRST child is treated as the "card template" to repeat.
 *
 * Example:
 * meta: { cms: { repeat: { collectionSlug: "properties", limit: 6, sortBy: "published_at" } } }
 */
export async function expandCms(nodes, { projectId, cmsService, pageContext } = {}) {
  if (!Array.isArray(nodes) || !nodes.length) return nodes || [];
  if (!cmsService || typeof cmsService.listItemsByCollectionSlug !== 'function') return nodes;

  const expandNode = async (node) => {
    const kids = Array.isArray(node.children) ? node.children : [];
    const meta = cmsMeta(node);
    const repeat = isPlainObject(meta?.repeat) ? meta.repeat : null;

    // First expand children (so nested repeaters are supported with guardrails).
    const expandedKids = [];
    for (const child of kids) expandedKids.push(await expandNode(child));

    if (!repeat) {
      return { ...node, children: expandedKids };
    }

    const collectionSlug = typeof repeat.collectionSlug === 'string' ? repeat.collectionSlug.trim() : '';
    if (!collectionSlug) return { ...node, children: expandedKids };

    const template = expandedKids[0];
    if (!template) return { ...node, children: expandedKids };

    const query = normalizeQuery(repeat);
    // Pagination: allow pageContext.cms?.page to influence offset.
    const pageParamKey = typeof repeat.pageParam === 'string' && repeat.pageParam.trim() ? repeat.pageParam.trim() : 'page';
    const ctxPage = Number(pageContext?.cms?.[pageParamKey] ?? pageContext?.cms?.page ?? 0) || 0;
    const pageSize = query.pageSize > 0 ? query.pageSize : query.limit > 0 ? query.limit : 0;
    const offsetFromPage =
      ctxPage > 0 && pageSize > 0 ? clamp((ctxPage - 1) * pageSize, 0, 100000) : query.offset || 0;
    const queryWithOffset = { ...query, offset: offsetFromPage, limit: pageSize || query.limit };

    const items = await cmsService.listItemsByCollectionSlug(projectId, collectionSlug, queryWithOffset);
    const safeItems = Array.isArray(items) ? items : [];
    const useItems = queryWithOffset.limit > 0 ? safeItems.slice(0, queryWithOffset.limit) : safeItems;

    const repeated = useItems.map((it, idx) => {
      const itemContext = {
        ...(isPlainObject(pageContext) ? pageContext : {}),
        item: isPlainObject(it) ? it : {},
        sys: {
          index: idx,
          id: safeInt(it?.id, null),
          slug: typeof it?.slug === 'string' ? it.slug : '',
          collection: collectionSlug,
        },
      };
      const cloned = cloneNodeWithPrefix(template, `cms-${collectionSlug}-${it?.id ?? idx}`);
      const bound = applyBindingsToTree([cloned], itemContext);
      return bound[0];
    });

    return {
      ...node,
      children: repeated,
    };
  };

  // Guard: prevent runaway expansion loops.
  const out = [];
  for (const n of nodes) out.push(await expandNode(n));
  return out;
}

