import { unstable_noStore as noStore } from 'next/cache';
import { getDbPool, withTransaction } from '@/lib/db';
import {
  assertValidNodeHierarchy,
  assertValidReorderParent,
  isContainerNodeType,
} from '@/lib/builderHierarchy';
import { mergeNodePropsJsonPatch } from '@/lib/builderTree';
import { getWidgetDefinition, isWidgetAllowed } from '@/lib/builder/widgetRegistry';
import { canDeleteProjectPage, normalizeBuilderSlug } from '@/lib/builder/projectPageRules';
import { normalizeResponsiveStyle } from '@/lib/styleNormalizer';
import { DEFAULT_SITE_THEME, themeSpacingPx } from '@/lib/siteDesignTheme';
import { sanitizeRichHtml } from '@/lib/sanitizeRichHtml';
import { isSectionLockedFlagValue, metaRepresentsExplicitSectionUnlock } from '@/lib/rowLayoutMeta';

function parseSnapshot(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  return JSON.parse(value);
}

function enforceStructuralLayout(style = {}, nodeType) {
  const next = { ...(style || {}) };
  if (!['row', 'column', 'stack'].includes(nodeType)) return next;
  const layers = ['desktop', 'tablet', 'mobile'];
  for (const key of layers) {
    const layer = { ...(next[key] || {}) };
    const layout = { ...(layer.layout || {}) };
    if (nodeType === 'row') {
      const isMobile = key === 'mobile';
      layout.display = 'flex';
      if (layout.flexDirection == null || layout.flexDirection === '') {
        layout.flexDirection = isMobile ? 'column' : 'row';
      }
      if (layout.flexWrap == null || layout.flexWrap === '') {
        layout.flexWrap = isMobile ? 'wrap' : 'nowrap';
      }
      if (isMobile) {
        if (layout.alignItems == null || layout.alignItems === '') layout.alignItems = 'stretch';
        if (layout.gap == null || layout.gap === '') layout.gap = themeSpacingPx(DEFAULT_SITE_THEME, 'lg');
      } else {
        if (layout.justifyContent == null || layout.justifyContent === '') layout.justifyContent = 'space-between';
        if (layout.alignItems == null || layout.alignItems === '') layout.alignItems = 'center';
      }
      if (layout.width == null || layout.width === '') layout.width = '100%';
      const size = { ...((next[key] || {}).size || {}) };
      if (size.width == null || size.width === '') size.width = '100%';
      next[key] = {
        ...layer,
        layout,
        size,
      };
      continue;
    }
    if (nodeType === 'column') {
      layout.display = 'flex';
      layout.flexDirection = 'column';
      if (layout.flexGrow == null || layout.flexGrow === '') layout.flexGrow = 1;
      if (layout.flexShrink == null || layout.flexShrink === '') layout.flexShrink = 1;
      if (layout.flexBasis == null || layout.flexBasis === '') layout.flexBasis = '0%';
      if (layout.minWidth == null || layout.minWidth === '') layout.minWidth = 0;
    }
    if (nodeType === 'stack') {
      layout.display = 'flex';
      if (layout.flexDirection == null || layout.flexDirection === '') layout.flexDirection = 'column';
      if (layout.flexWrap == null || layout.flexWrap === '') layout.flexWrap = 'nowrap';
    }
    next[key] = {
      ...layer,
      layout,
    };
  }
  return next;
}

function isBuilderRowLockedFromPropsJson(propsJson, nodeType = 'row') {
  const props = normalizeNodeProps(parseSnapshot(propsJson) || {}, nodeType);
  return isSectionLockedFlagValue(props?.meta?.sectionLocked);
}

/** Walk DB parent chain; throw if any ancestor section row is locked. */
async function assertDbNodeNotUnderLockedSectionRow(connection, dbRow) {
  let walkParent = dbRow.parent_node_id;
  for (let depth = 0; depth < 120 && walkParent; depth += 1) {
    const anc = await getNodeById(walkParent, connection);
    if (!anc) break;
    if (anc.node_type === 'row' && isBuilderRowLockedFromPropsJson(anc.props_json, 'row')) {
      throw new Error(
        'This page section is locked. Unlock it from the Sections list or Layers panel (lock icon) before editing layers inside it.'
      );
    }
    walkParent = anc.parent_node_id;
  }
}

/** If this DB row is a locked section, only allow updates that set `meta.sectionLocked` to `false` (unlock). */
async function assertLockedRowUpdateAllowsUnlockOnly(existingDbRow, mergedProps) {
  if (existingDbRow.node_type !== 'row') return;
  if (!isBuilderRowLockedFromPropsJson(existingDbRow.props_json, 'row')) return;
  const nextMeta =
    mergedProps && typeof mergedProps.meta === 'object' && mergedProps.meta != null ? mergedProps.meta : {};
  if (!metaRepresentsExplicitSectionUnlock(nextMeta)) {
    throw new Error(
      'This section is locked. Unlock it from the Sections list or Layers panel (lock icon) before editing.'
    );
  }
}

/** For moves: destination parent must not sit under a locked section row. */
async function assertDbParentChainNotUnderLockedSectionRow(connection, parentId) {
  if (!parentId) return;
  let cur = parentId;
  for (let depth = 0; depth < 120 && cur; depth += 1) {
    const n = await getNodeById(cur, connection);
    if (!n) break;
    if (n.node_type === 'row' && isBuilderRowLockedFromPropsJson(n.props_json, 'row')) {
      throw new Error('Cannot move into a locked section. Unlock it first.');
    }
    cur = n.parent_node_id;
  }
}

function normalizeNodeProps(props = {}, nodeType = null) {
  const next = { ...(props || {}) };
  next.style_json = normalizeResponsiveStyle(next.style_json || {}, {
    nodeType,
    siteTheme: DEFAULT_SITE_THEME,
  });
  if (nodeType) {
    next.style_json = enforceStructuralLayout(next.style_json, nodeType);
  }
  return next;
}

function parseJsonColumn(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'object' && !Buffer.isBuffer(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

function jsonOrNullForDb(value) {
  if (value == null) return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function normalizeSlug(value) {
  return normalizeBuilderSlug(value);
}

function assertValidTitle(title, fieldName = 'title') {
  if (typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 255) {
    throw new Error(`Invalid ${fieldName}`);
  }
}

function assertValidSlug(slug, fieldName = 'slug') {
  const normalized = normalizeSlug(slug);
  if (!normalized || normalized.length < 1 || normalized.length > 180) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return normalized;
}

function buildTree(nodes) {
  const byId = new Map();
  const roots = [];

  nodes.forEach((node) => {
    const parsedProps = normalizeNodeProps(parseSnapshot(node.props_json) || {}, node.node_type);
    byId.set(node.id, {
      id: node.id,
      pageId: node.page_id,
      versionId: node.version_id,
      parentNodeId: node.parent_node_id,
      nodeType: node.node_type,
      displayName: node.display_name,
      positionIndex: node.position_index,
      props: parsedProps,
      style_json: parsedProps.style_json,
      dataJson: parseJsonColumn(node.data_json),
      actionsJson: parseJsonColumn(node.actions_json),
      children: [],
    });
  });

  byId.forEach((node) => {
    if (!node.parentNodeId) {
      roots.push(node);
      return;
    }
    const parent = byId.get(node.parentNodeId);
    if (parent) parent.children.push(node);
  });

  const sortNodes = (items) => {
    items.sort((a, b) => a.positionIndex - b.positionIndex);
    items.forEach((item) => sortNodes(item.children));
  };
  sortNodes(roots);

  return roots;
}

async function getNodeById(nodeId, connection) {
  const [rows] = await connection.query(
    `SELECT id, page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json
     FROM builder_nodes
     WHERE id = ?`,
    [nodeId]
  );
  return rows[0] || null;
}

async function fetchFirstChildId(connection, draftId, parentId, nodeType) {
  const [rows] = await connection.query(
    `SELECT id FROM builder_nodes
     WHERE version_id = ? AND parent_node_id = ? AND node_type = ?
     ORDER BY position_index ASC, id ASC
     LIMIT 1`,
    [draftId, parentId, nodeType]
  );
  return rows[0]?.id || null;
}

/** Ensures a stack exists under `columnId`; creates an empty stack at the end if needed. */
async function ensureStackUnderColumn(connection, pageId, draftId, columnId) {
  const existingId = await fetchFirstChildId(connection, draftId, columnId, 'stack');
  if (existingId) return existingId;
  const [countRows] = await connection.query(
    `SELECT COUNT(*) AS total FROM builder_nodes WHERE version_id = ? AND (parent_node_id <=> ?)`,
    [draftId, columnId]
  );
  const position = Number(countRows[0]?.total || 0);
  const nextProps = normalizeNodeProps({}, 'stack');
  const [insertResult] = await connection.query(
    `INSERT INTO builder_nodes
      (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json)
     VALUES (?, ?, ?, 'stack', ?, ?, ?, NULL, NULL)`,
    [pageId, draftId, columnId, 'Stack', JSON.stringify(nextProps), position]
  );
  return insertResult.insertId;
}

/**
 * Rewrites the requested parent so createNode matches layout rules when the client
 * sends a slightly wrong parent (e.g. stack under row, widget under column with no stack yet).
 */
async function resolveCreateNodeParent(connection, pageId, draftId, payload) {
  let parentNodeId = payload.parentNodeId || null;
  let parentNode = null;
  if (parentNodeId) {
    parentNode = await getNodeById(parentNodeId, connection);
    if (!parentNode) {
      throw new Error('Parent node not found');
    }
    if (Number(parentNode.version_id) !== Number(draftId)) {
      throw new Error('Parent node must be in the current draft');
    }
  }

  const { nodeType } = payload;

  if (nodeType === 'stack' && parentNode?.node_type === 'row') {
    const colId = await fetchFirstChildId(connection, draftId, parentNode.id, 'column');
    if (!colId) {
      throw new Error('Add a Column to this section before adding a Stack');
    }
    parentNodeId = colId;
    parentNode = await getNodeById(parentNodeId, connection);
  }

  if (!isContainerNodeType(nodeType) && parentNode?.node_type === 'column') {
    const stackId = await ensureStackUnderColumn(connection, pageId, draftId, parentNodeId);
    parentNodeId = stackId;
    parentNode = await getNodeById(parentNodeId, connection);
  }

  if (!isContainerNodeType(nodeType) && parentNode?.node_type === 'row') {
    const colId = await fetchFirstChildId(connection, draftId, parentNode.id, 'column');
    if (!colId) {
      throw new Error('Add a Column to this section before adding content');
    }
    const stackId = await ensureStackUnderColumn(connection, pageId, draftId, colId);
    parentNodeId = stackId;
    parentNode = await getNodeById(parentNodeId, connection);
  }

  return { parentNodeId, parentNode };
}

async function getNodeChildren(versionId, connection) {
  const [rows] = await connection.query(
    `SELECT id, parent_node_id
     FROM builder_nodes
     WHERE version_id = ?`,
    [versionId]
  );
  return rows;
}

function isDescendantNode(nodeId, targetParentId, links) {
  const childMap = new Map();
  links.forEach((row) => {
    const key = row.parent_node_id || 0;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key).push(row.id);
  });

  const stack = [nodeId];
  while (stack.length) {
    const current = stack.pop();
    if (current === targetParentId) return true;
    const children = childMap.get(current) || [];
    children.forEach((childId) => stack.push(childId));
  }
  return false;
}

async function getPageById(pageId, connection) {
  const db = connection || getDbPool();
  const [rows] = await db.query(
    `SELECT p.id,
            p.slug,
            p.title,
            p.published_version_id,
            p.project_id,
            p.seo_json,
            pr.slug AS project_slug,
            pr.type AS project_type,
            pr.config_json
     FROM pages p
     INNER JOIN projects pr ON pr.id = p.project_id
     WHERE p.id = ?`,
    [pageId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    projectType: row.project_type || 'website',
    projectConfig: parseJsonColumn(row.config_json),
  };
}

async function getLatestDraftVersion(pageId, connection) {
  const db = connection || getDbPool();
  const [rows] = await db.query(
    `SELECT id, page_id, version_number, status, snapshot_json, created_at
     FROM page_versions
     WHERE page_id = ? AND status = 'draft'
     ORDER BY version_number DESC
     LIMIT 1`,
    [pageId]
  );
  return rows[0] || null;
}

async function getVersionById(versionId, connection) {
  const db = connection || getDbPool();
  const [rows] = await db.query(
    `SELECT id, page_id, version_number, status, snapshot_json, created_at
     FROM page_versions
     WHERE id = ?`,
    [versionId]
  );
  return rows[0] || null;
}

/**
 * Insert order when cloning `builder_nodes` into a new version: parents before children.
 * SQL `ORDER BY position_index, id` is unsafe because `position_index` repeats per sibling group —
 * a column (index 0) under section row B can sort before row B itself, so `idMap` lacks the parent
 * and the node is inserted as a root (broken tree / empty columns after publish → new draft).
 */
function sortBuilderNodesParentsBeforeChildren(rows) {
  const list = Array.isArray(rows) ? [...rows] : [];
  if (list.length <= 1) return list;
  const byId = new Map(list.map((r) => [r.id, r]));

  const depthMemo = new Map();
  function depthFromRoot(nodeId) {
    if (depthMemo.has(nodeId)) return depthMemo.get(nodeId);
    const seen = new Set();
    let d = 0;
    let cur = nodeId;
    while (true) {
      const row = byId.get(cur);
      if (!row) {
        depthMemo.set(nodeId, d);
        return d;
      }
      const pid = row.parent_node_id;
      if (pid == null || !byId.has(pid)) {
        depthMemo.set(nodeId, d);
        return d;
      }
      if (seen.has(cur)) {
        depthMemo.set(nodeId, 0);
        return 0;
      }
      seen.add(cur);
      cur = pid;
      d += 1;
      if (d > 4096) {
        depthMemo.set(nodeId, 0);
        return 0;
      }
    }
  }

  list.forEach((r) => depthFromRoot(r.id));
  list.sort((a, b) => {
    const da = depthMemo.get(a.id) ?? depthFromRoot(a.id);
    const db = depthMemo.get(b.id) ?? depthFromRoot(b.id);
    if (da !== db) return da - db;
    const pa = Number(a.position_index) || 0;
    const pb = Number(b.position_index) || 0;
    if (pa !== pb) return pa - pb;
    return Number(a.id) - Number(b.id);
  });
  return list;
}

async function createDraftFromVersion(pageId, sourceVersion, connection) {
  const nextVersionNumber = sourceVersion.version_number + 1;
  const snapshot = parseSnapshot(sourceVersion.snapshot_json) || { nodes: [] };
  const [insertVersion] = await connection.query(
    `INSERT INTO page_versions (page_id, version_number, status, snapshot_json)
     VALUES (?, ?, 'draft', ?)`,
    [pageId, nextVersionNumber, JSON.stringify(snapshot)]
  );
  const newVersionId = insertVersion.insertId;

  const [sourceNodes] = await connection.query(
    `SELECT id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json
     FROM builder_nodes
     WHERE version_id = ?`,
    [sourceVersion.id]
  );

  const orderedNodes = sortBuilderNodesParentsBeforeChildren(sourceNodes);
  const idMap = new Map();
  for (const node of orderedNodes) {
    const mappedParentId = node.parent_node_id ? idMap.get(node.parent_node_id) : null;
    const [insertNode] = await connection.query(
      `INSERT INTO builder_nodes
        (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pageId,
        newVersionId,
        mappedParentId || null,
        node.node_type,
        node.display_name,
        node.props_json,
        node.position_index,
        node.data_json,
        node.actions_json,
      ]
    );
    idMap.set(node.id, insertNode.insertId);
  }

  return getVersionById(newVersionId, connection);
}

export async function getBuilderState(pageId) {
  noStore();
  const page = await getPageById(pageId);
  if (!page) return null;
  const projectPages = await listPagesByProject(page.project_id);

  const draftVersion = await ensureDraftVersion(pageId);
  const [nodes] = await getDbPool().query(
    `SELECT id, page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json
     FROM builder_nodes
     WHERE version_id = ?
     ORDER BY position_index ASC, id ASC`,
    [draftVersion.id]
  );

  const tree = buildTree(nodes);
  const snapshot = { nodes: tree };

  return {
    page: {
      id: page.id,
      projectId: page.project_id,
      slug: page.slug,
      title: page.title,
      seo: parseJsonColumn(page.seo_json) || {},
      publishedVersionId: page.published_version_id,
      projectSlug: page.project_slug,
      projectType: page.projectType || 'website',
      projectConfig: page.projectConfig ?? null,
    },
    draftVersion: {
      id: draftVersion.id,
      versionNumber: draftVersion.version_number,
      status: draftVersion.status,
      createdAt: draftVersion.created_at,
    },
    tree,
    snapshot,
    projectPages,
  };
}

async function refreshVersionSnapshot(versionId, connection) {
  const [nodes] = await connection.query(
    `SELECT id, page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json
     FROM builder_nodes
     WHERE version_id = ?
     ORDER BY position_index ASC, id ASC`,
    [versionId]
  );
  const tree = buildTree(nodes);
  await connection.query(
    `UPDATE page_versions
     SET snapshot_json = ?
     WHERE id = ?`,
    [JSON.stringify({ nodes: tree }), versionId]
  );
  return tree;
}

async function ensureDraftVersionTx(pageId, connection) {
  const page = await getPageById(pageId, connection);
  if (!page) throw new Error('Page not found');

  const existingDraft = await getLatestDraftVersion(pageId, connection);
  if (existingDraft) return existingDraft;

  const sourceVersionId = page.published_version_id;
  if (!sourceVersionId) {
    const [newVersion] = await connection.query(
      `INSERT INTO page_versions (page_id, version_number, status, snapshot_json)
       VALUES (?, 1, 'draft', JSON_OBJECT('nodes', JSON_ARRAY()))`,
      [pageId]
    );
    return getVersionById(newVersion.insertId, connection);
  }

  const publishedVersion = await getVersionById(sourceVersionId, connection);
  return createDraftFromVersion(pageId, publishedVersion, connection);
}

export async function ensureDraftVersion(pageId) {
  return withTransaction(async (connection) => ensureDraftVersionTx(pageId, connection));
}

/**
 * Single insert inside an open transaction (no snapshot refresh).
 * @param {import('mysql2/promise').PoolConnection} connection
 */
async function createNodeTx(connection, pageId, draft, page, payload) {
  const { parentNodeId: resolvedParentId, parentNode } = await resolveCreateNodeParent(
    connection,
    pageId,
    draft.id,
    payload
  );
    assertValidNodeHierarchy(payload.nodeType, parentNode?.node_type || null);
    if (resolvedParentId) {
      await assertDbParentChainNotUnderLockedSectionRow(connection, resolvedParentId);
    }

    const projectType = page.projectType || 'website';
    if (!isContainerNodeType(payload.nodeType)) {
      if (!isWidgetAllowed(projectType, payload.nodeType)) {
        throw new Error(
          `Invalid widget: type "${payload.nodeType}" is not allowed for project type "${projectType}"`
        );
      }
    }

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM builder_nodes
       WHERE version_id = ? AND (parent_node_id <=> ?)`,
      [draft.id, resolvedParentId]
    );
    const fallbackPosition = Number(countRows[0]?.total || 0);

    let nextProps = normalizeNodeProps(
      { ...(payload.props || {}), style_json: payload.style_json || {} },
      payload.nodeType
    );
    const widgetDef = getWidgetDefinition(projectType, payload.nodeType);
    if (widgetDef?.defaultProps && payload.nodeType === 'form') {
      const hasFields = Array.isArray(nextProps.fields) && nextProps.fields.length;
      if (!hasFields && Array.isArray(widgetDef.defaultProps.fields)) {
        nextProps = normalizeNodeProps(
          {
            ...widgetDef.defaultProps,
            ...nextProps,
            style_json: payload.style_json || {},
          },
          payload.nodeType
        );
      }
    }
    if (widgetDef?.defaultProps && payload.nodeType === 'rich_text') {
      nextProps = normalizeNodeProps(
        {
          ...widgetDef.defaultProps,
          ...nextProps,
          style_json: payload.style_json || {},
        },
        payload.nodeType
      );
      nextProps.content = sanitizeRichHtml(String(nextProps.content || ''));
    }
    let resolvedDataJson = payload.dataJson;
    if (resolvedDataJson === undefined) {
      if (widgetDef?.supportsData && widgetDef?.defaultDataSource) {
        resolvedDataJson = {
          source: { ...widgetDef.defaultDataSource },
        };
      } else {
        resolvedDataJson = null;
      }
    }
    const dataValue = jsonOrNullForDb(resolvedDataJson);
    const resolvedActionsJson =
      payload.actionsJson !== undefined
        ? payload.actionsJson
        : widgetDef?.supportsActions && widgetDef?.defaultActions
          ? { ...widgetDef.defaultActions }
          : null;
    const actionsValue = jsonOrNullForDb(resolvedActionsJson);

    const parentKey = resolvedParentId;
    let insertPosition = fallbackPosition;
    const rawPos = payload.positionIndex;
    if (rawPos !== undefined && rawPos !== null && Number.isFinite(Number(rawPos))) {
      const insertAt = Math.max(0, Math.min(Math.trunc(Number(rawPos)), fallbackPosition));
      await connection.query(
        `UPDATE builder_nodes
         SET position_index = position_index + 1
         WHERE version_id = ? AND (parent_node_id <=> ?) AND position_index >= ?`,
        [draft.id, parentKey, insertAt]
      );
      insertPosition = insertAt;
    }

    const [insertResult] = await connection.query(
      `INSERT INTO builder_nodes
        (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pageId,
        draft.id,
        parentKey,
        payload.nodeType,
        payload.displayName || payload.nodeType,
        JSON.stringify(nextProps),
        insertPosition,
        dataValue,
        actionsValue,
      ]
    );

    const [rows] = await connection.query(
      `SELECT id, page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json
       FROM builder_nodes
       WHERE id = ?`,
      [insertResult.insertId]
    );
  const row = rows[0];
  const parsed = normalizeNodeProps(parseSnapshot(row.props_json) || {}, row.node_type);

  return {
    node: {
      ...row,
      props: parsed,
      style_json: parsed.style_json,
      dataJson: parseJsonColumn(row.data_json),
      actionsJson: parseJsonColumn(row.actions_json),
    },
    draftVersionId: draft.id,
  };
}

export async function createNode(pageId, payload) {
  return withTransaction(async (connection) => {
    const draft = await ensureDraftVersionTx(pageId, connection);
    const page = await getPageById(pageId, connection);
    if (!page) {
      throw new Error('Page not found');
    }
    const { node } = await createNodeTx(connection, pageId, draft, page, payload);
    const tree = await refreshVersionSnapshot(draft.id, connection);
    return {
      node,
      tree,
      draftVersionId: draft.id,
    };
  });
}

/**
 * Create many nodes in one transaction. Each row must appear after its parent.
 * Fields: tempId?, parentRef?, parentNodeId?, positionIndex?, nodeType, displayName?, props?, style_json?, dataJson?, actionsJson?
 */
export async function createNodesBulk(pageId, orderedNodes) {
  if (!Array.isArray(orderedNodes) || orderedNodes.length === 0) {
    throw new Error('Bulk create requires a non-empty nodes array');
  }
  return withTransaction(async (connection) => {
    const draft = await ensureDraftVersionTx(pageId, connection);
    const page = await getPageById(pageId, connection);
    if (!page) {
      throw new Error('Page not found');
    }
    const idByTemp = new Map();
    const rootIds = [];
    for (const entry of orderedNodes) {
      if (!entry || typeof entry !== 'object') {
        throw new Error('Bulk create: invalid node entry');
      }
      const { tempId, parentRef, ...rest } = entry;
      let parentNodeId = rest.parentNodeId ?? null;
      if (parentRef != null && parentRef !== '') {
        const mapped = idByTemp.get(String(parentRef));
        if (mapped == null) {
          throw new Error(`Bulk create: unknown parentRef "${parentRef}"`);
        }
        parentNodeId = mapped;
      }
      const payload = { ...rest, parentNodeId };
      if (!payload.nodeType) {
        throw new Error('Bulk create: nodeType is required');
      }
      const { node } = await createNodeTx(connection, pageId, draft, page, payload);
      if (tempId != null && String(tempId).length) {
        idByTemp.set(String(tempId), node.id);
      }
      if (parentNodeId == null) {
        rootIds.push(node.id);
      }
    }
    const tree = await refreshVersionSnapshot(draft.id, connection);
    return { tree, rootIds, draftVersionId: draft.id };
  });
}

export async function updateNode(nodeId, payload) {
  return withTransaction(async (connection) => {
    const existing = await getNodeById(nodeId, connection);
    if (!existing) return null;

    const existingProps = normalizeNodeProps(parseSnapshot(existing.props_json) || {}, existing.node_type);
    const mergedProps = payload.props ? mergeNodePropsJsonPatch(existingProps, payload.props) : existingProps;
    if (payload.style_json !== undefined) {
      mergedProps.style_json = payload.style_json;
    }
    if (existing.node_type === 'rich_text' && mergedProps.content !== undefined) {
      mergedProps.content = sanitizeRichHtml(String(mergedProps.content));
    }
    await assertDbNodeNotUnderLockedSectionRow(connection, existing);
    await assertLockedRowUpdateAllowsUnlockOnly(existing, mergedProps);
    const nextProps = JSON.stringify(normalizeNodeProps(mergedProps, existing.node_type));
    const nextDisplayName = payload.displayName ?? existing.display_name;
    const nextPosition = payload.positionIndex ?? existing.position_index;
    const nextParent = payload.parentNodeId !== undefined ? payload.parentNodeId : existing.parent_node_id;

    if (payload.parentNodeId !== undefined) {
      let parentNode = null;
      if (nextParent) {
        parentNode = await getNodeById(nextParent, connection);
        if (!parentNode) throw new Error('Parent node not found');
        if (parentNode.version_id !== existing.version_id) {
          throw new Error('Parent node must be in same version');
        }
        const links = await getNodeChildren(existing.version_id, connection);
        if (isDescendantNode(existing.id, nextParent, links)) {
          throw new Error('Invalid move: cannot move node inside its own subtree');
        }
      }
      assertValidNodeHierarchy(existing.node_type, parentNode?.node_type || null);
      await assertDbParentChainNotUnderLockedSectionRow(connection, nextParent || null);
    }

    let nextDataJson = parseJsonColumn(existing.data_json);
    if (payload.dataJson !== undefined) {
      nextDataJson = payload.dataJson;
    }
    let nextActionsJson = parseJsonColumn(existing.actions_json);
    if (payload.actionsJson !== undefined) {
      nextActionsJson = payload.actionsJson;
    }
    const dataForDb = jsonOrNullForDb(nextDataJson);
    const actionsForDb = jsonOrNullForDb(nextActionsJson);

    await connection.query(
      `UPDATE builder_nodes
       SET parent_node_id = ?, display_name = ?, props_json = ?, position_index = ?, data_json = ?, actions_json = ?
       WHERE id = ?`,
      [nextParent, nextDisplayName, nextProps, nextPosition, dataForDb, actionsForDb, nodeId]
    );

    const tree = await refreshVersionSnapshot(existing.version_id, connection);
    return {
      id: existing.id,
      versionId: existing.version_id,
      tree,
    };
  });
}

export async function reorderNode({ nodeId, newParentId, newIndex }) {
  return withTransaction(async (connection) => {
    const node = await getNodeById(nodeId, connection);
    if (!node) return null;

    let newParent = null;
    if (newParentId) {
      newParent = await getNodeById(newParentId, connection);
      if (!newParent) throw new Error('Parent node not found');
      if (newParent.version_id !== node.version_id) {
        throw new Error('Invalid move: parent must be in same draft version');
      }
    }

    const links = await getNodeChildren(node.version_id, connection);
    if (newParentId && isDescendantNode(node.id, newParentId, links)) {
      throw new Error('Invalid move: cannot move node inside its own subtree');
    }

    assertValidReorderParent(newParentId, newParent);
    assertValidNodeHierarchy(node.node_type, newParent?.node_type || null);

    await assertDbNodeNotUnderLockedSectionRow(connection, node);
    await assertDbParentChainNotUnderLockedSectionRow(connection, newParentId || null);

    const oldParentId = node.parent_node_id || null;
    const [oldSiblingsRows] = await connection.query(
      `SELECT id
       FROM builder_nodes
       WHERE version_id = ? AND (parent_node_id <=> ?) AND id <> ?
       ORDER BY position_index ASC, id ASC`,
      [node.version_id, oldParentId, node.id]
    );
    for (let index = 0; index < oldSiblingsRows.length; index += 1) {
      await connection.query(`UPDATE builder_nodes SET position_index = ? WHERE id = ?`, [
        index,
        oldSiblingsRows[index].id,
      ]);
    }

    const targetParentId = newParentId || null;
    const [newSiblingsRows] = await connection.query(
      `SELECT id
       FROM builder_nodes
       WHERE version_id = ? AND (parent_node_id <=> ?) AND id <> ?
       ORDER BY position_index ASC, id ASC`,
      [node.version_id, targetParentId, node.id]
    );

    const clampedIndex = Math.max(0, Math.min(Number(newIndex) || 0, newSiblingsRows.length));
    const reorderedIds = [...newSiblingsRows.map((row) => row.id)];
    reorderedIds.splice(clampedIndex, 0, node.id);

    await connection.query(
      `UPDATE builder_nodes
       SET parent_node_id = ?
       WHERE id = ?`,
      [targetParentId, node.id]
    );
    for (let index = 0; index < reorderedIds.length; index += 1) {
      await connection.query(`UPDATE builder_nodes SET position_index = ? WHERE id = ?`, [
        index,
        reorderedIds[index],
      ]);
    }

    const tree = await refreshVersionSnapshot(node.version_id, connection);
    return {
      nodeId,
      newParentId: targetParentId,
      newIndex: clampedIndex,
      tree,
    };
  });
}

export async function deleteNode(nodeId) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(
      `SELECT id, version_id
       FROM builder_nodes
       WHERE id = ?`,
      [nodeId]
    );
    const existing = rows[0];
    if (!existing) return null;

    const root = await getNodeById(nodeId, connection);
    if (!root) return null;
    await assertDbNodeNotUnderLockedSectionRow(connection, root);
    if (root.node_type === 'row' && isBuilderRowLockedFromPropsJson(root.props_json, 'row')) {
      throw new Error(
        'This section is locked. Unlock it from the Sections list or Layers panel before deleting it.'
      );
    }

    const [allRows] = await connection.query(
      `SELECT id, parent_node_id
       FROM builder_nodes
       WHERE version_id = ?`,
      [existing.version_id]
    );

    const childrenMap = new Map();
    allRows.forEach((row) => {
      const key = row.parent_node_id || 0;
      if (!childrenMap.has(key)) childrenMap.set(key, []);
      childrenMap.get(key).push(row.id);
    });

    const toDelete = [];
    const stack = [nodeId];
    while (stack.length) {
      const current = stack.pop();
      toDelete.push(current);
      const children = childrenMap.get(current) || [];
      children.forEach((childId) => stack.push(childId));
    }

    await connection.query(`DELETE FROM builder_nodes WHERE id IN (?)`, [toDelete]);
    const tree = await refreshVersionSnapshot(existing.version_id, connection);

    return { deletedIds: toDelete, versionId: existing.version_id, tree };
  });
}

export async function duplicateNode(nodeId) {
  return withTransaction(async (connection) => {
    const source = await getNodeById(nodeId, connection);
    if (!source) return null;
    await assertDbNodeNotUnderLockedSectionRow(connection, source);

    const [allRows] = await connection.query(
      `SELECT id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json
       FROM builder_nodes
       WHERE version_id = ?
       ORDER BY position_index ASC, id ASC`,
      [source.version_id]
    );

    const byParent = new Map();
    allRows.forEach((row) => {
      const parentKey = row.parent_node_id || 0;
      if (!byParent.has(parentKey)) byParent.set(parentKey, []);
      byParent.get(parentKey).push(row);
    });

    const subtreeIds = new Set();
    const queue = [source.id];
    while (queue.length) {
      const currentId = queue.shift();
      subtreeIds.add(currentId);
      const children = byParent.get(currentId) || [];
      children.forEach((child) => queue.push(child.id));
    }

    const siblings = (byParent.get(source.parent_node_id || 0) || []).filter((row) => row.id !== source.id);
    const insertionIndex = Number(source.position_index) + 1;
    for (const sibling of siblings) {
      if (Number(sibling.position_index) >= insertionIndex) {
        await connection.query(
          `UPDATE builder_nodes SET position_index = position_index + 1 WHERE id = ?`,
          [sibling.id]
        );
      }
    }

    const idMap = new Map();
    const insertClone = async (nodeRow, parentCloneId, isRoot = false) => {
      const [insertRes] = await connection.query(
        `INSERT INTO builder_nodes
          (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          source.page_id,
          source.version_id,
          parentCloneId,
          nodeRow.node_type,
          isRoot ? `${nodeRow.display_name} Copy` : nodeRow.display_name,
          nodeRow.props_json,
          isRoot ? insertionIndex : nodeRow.position_index,
          nodeRow.data_json,
          nodeRow.actions_json,
        ]
      );
      idMap.set(nodeRow.id, insertRes.insertId);
      return insertRes.insertId;
    };

    const rootRow = allRows.find((row) => row.id === source.id);
    const newRootId = await insertClone(rootRow, source.parent_node_id || null, true);

    const bfs = [source.id];
    while (bfs.length) {
      const oldParentId = bfs.shift();
      const oldChildren = byParent.get(oldParentId) || [];
      for (const child of oldChildren) {
        if (!subtreeIds.has(child.id)) continue;
        const newParentId = idMap.get(oldParentId);
        await insertClone(child, newParentId, false);
        bfs.push(child.id);
      }
    }

    const tree = await refreshVersionSnapshot(source.version_id, connection);
    return {
      nodeId: source.id,
      duplicatedNodeId: newRootId,
      versionId: source.version_id,
      tree,
    };
  });
}

function collectStructuralLayoutRows(roots) {
  const rows = [];
  const walk = (arr, parentId) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((node, index) => {
      if (!node || node.id == null) return;
      const id = Number(node.id);
      if (!Number.isInteger(id) || id <= 0) return;
      const pid = parentId == null || parentId === undefined ? null : Number(parentId);
      rows.push({ id, parentId: pid, index });
      walk(node.children || [], id);
    });
  };
  walk(roots || [], null);
  return rows;
}

async function persistClientTreeOntoDraft(connection, draftVersionId, clientRoots) {
  const byClientId = new Map();
  const walkMap = (arr) => {
    if (!Array.isArray(arr)) return;
    for (const n of arr) {
      if (!n?.id) continue;
      const id = Number(n.id);
      if (Number.isInteger(id) && id > 0) byClientId.set(id, n);
      walkMap(n.children || []);
    }
  };
  walkMap(clientRoots || []);

  const structural = collectStructuralLayoutRows(clientRoots);

  for (const st of structural) {
    const raw = byClientId.get(st.id);
    if (!raw) continue;
    const nodeId = st.id;
    const existing = await getNodeById(nodeId, connection);
    if (!existing || Number(existing.version_id) !== Number(draftVersionId)) continue;

    const existingProps = normalizeNodeProps(parseSnapshot(existing.props_json) || {}, existing.node_type);
    const merged = mergeNodePropsJsonPatch(existingProps, raw.props || {});
    if (raw.style_json !== undefined) merged.style_json = raw.style_json;
    if (raw.meta !== undefined && raw.meta && typeof raw.meta === 'object') {
      merged.meta = { ...(merged.meta || {}), ...raw.meta };
    }
    if (existing.node_type === 'rich_text' && merged.content !== undefined) {
      merged.content = sanitizeRichHtml(String(merged.content));
    }
    const nextPropsStr = JSON.stringify(normalizeNodeProps(merged, existing.node_type));
    const nextDisplayName = raw.displayName ?? existing.display_name;
    const nextParent = st.parentId;
    const nextPosition = st.index;

    let parentNode = null;
    if (nextParent) {
      parentNode = await getNodeById(nextParent, connection);
      if (!parentNode) throw new Error('Parent node not found');
      if (Number(parentNode.version_id) !== Number(draftVersionId)) {
        throw new Error('Parent node must be in the current draft');
      }
      const links = await getNodeChildren(existing.version_id, connection);
      if (isDescendantNode(existing.id, nextParent, links)) {
        throw new Error('Invalid move: cannot move node inside its own subtree');
      }
    }
    assertValidNodeHierarchy(existing.node_type, parentNode?.node_type || null);

    let nextDataJson = parseJsonColumn(existing.data_json);
    if (raw.dataJson !== undefined) nextDataJson = raw.dataJson;
    let nextActionsJson = parseJsonColumn(existing.actions_json);
    if (raw.actionsJson !== undefined) nextActionsJson = raw.actionsJson;

    await connection.query(
      `UPDATE builder_nodes
       SET parent_node_id = ?, display_name = ?, props_json = ?, position_index = ?, data_json = ?, actions_json = ?
       WHERE id = ? AND version_id = ?`,
      [
        nextParent,
        nextDisplayName,
        nextPropsStr,
        nextPosition,
        jsonOrNullForDb(nextDataJson),
        jsonOrNullForDb(nextActionsJson),
        nodeId,
        draftVersionId,
      ]
    );
  }
}

export async function syncDraftSnapshot(pageId, clientRoots = null) {
  if (Array.isArray(clientRoots) && clientRoots.length > 0) {
    return withTransaction(async (connection) => {
      const draft = await ensureDraftVersionTx(pageId, connection);
      await persistClientTreeOntoDraft(connection, draft.id, clientRoots);
      const tree = await refreshVersionSnapshot(draft.id, connection);
      return {
        pageId,
        draftVersionId: draft.id,
        tree,
      };
    });
  }
  return withTransaction(async (connection) => {
    const draft = await ensureDraftVersionTx(pageId, connection);
    const tree = await refreshVersionSnapshot(draft.id, connection);
    return {
      pageId,
      draftVersionId: draft.id,
      tree,
    };
  });
}

export async function saveDraftSnapshotFromClient(pageId, nodes) {
  const pid = Number(pageId);
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error('Invalid pageId');
  }
  if (!Array.isArray(nodes)) {
    throw new Error('Invalid snapshot nodes');
  }

  return withTransaction(async (connection) => {
    const draft = await ensureDraftVersionTx(pid, connection);
    const safeSnapshot = { nodes };
    await connection.query(
      `UPDATE page_versions
       SET snapshot_json = ?
       WHERE id = ?`,
      [JSON.stringify(safeSnapshot), draft.id]
    );
    return {
      pageId: pid,
      draftVersionId: draft.id,
      snapshot: safeSnapshot,
    };
  });
}

export async function listPagesForBuilder() {
  const [rows] = await getDbPool().query(
    `SELECT p.id, p.slug, p.title, p.status, pr.slug AS project_slug
     FROM pages p
     INNER JOIN projects pr ON pr.id = p.project_id
     ORDER BY pr.slug ASC, p.slug ASC`
  );
  return rows;
}

export async function listProjectsWithPageCount() {
  const [rows] = await getDbPool().query(
    `SELECT
       pr.id,
       COALESCE(NULLIF(pr.name, ''), 'Untitled Project') AS name,
       pr.slug,
       pr.type,
       pr.config_json,
       pr.created_at,
       pr.updated_at,
       COUNT(p.id) AS pages_count
     FROM projects pr
     LEFT JOIN pages p ON p.project_id = pr.id
     GROUP BY pr.id
     ORDER BY pr.created_at DESC, pr.id DESC`
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type || 'website',
    configJson: parseJsonColumn(row.config_json),
    pageCount: Number(row.pages_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function createStarterNodesForPageTx(pageId, draftVersionId, connection) {
  const [rowRes] = await connection.query(
    `INSERT INTO builder_nodes
      (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json)
     VALUES (?, ?, NULL, 'row', 'New Page Row', ?, 0, NULL, NULL)`,
    [pageId, draftVersionId, JSON.stringify(normalizeNodeProps({ style_json: {} }))]
  );
  const rowId = rowRes.insertId;

  const [colRes] = await connection.query(
    `INSERT INTO builder_nodes
      (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json)
     VALUES (?, ?, ?, 'column', 'New Page Column', ?, 0, NULL, NULL)`,
    [pageId, draftVersionId, rowId, JSON.stringify(normalizeNodeProps({ style_json: {} }))]
  );
  const colId = colRes.insertId;

  const [stackRes] = await connection.query(
    `INSERT INTO builder_nodes
      (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json)
     VALUES (?, ?, ?, 'stack', 'New Page Stack', ?, 0, NULL, NULL)`,
    [pageId, draftVersionId, colId, JSON.stringify(normalizeNodeProps({ style_json: {} }))]
  );
  const stackId = stackRes.insertId;

  await connection.query(
    `INSERT INTO builder_nodes
      (page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index, data_json, actions_json)
     VALUES (?, ?, ?, 'heading', 'New Page Heading', ?, 0, NULL, NULL)`,
    [
      pageId,
      draftVersionId,
      stackId,
      JSON.stringify(normalizeNodeProps({ text: 'New Page', style_json: {} })),
    ]
  );

  await refreshVersionSnapshot(draftVersionId, connection);
}

export async function createProjectWithDefaultPage({ name, slug, type = 'website' }) {
  assertValidTitle(name, 'name');
  const normalizedSlug = assertValidSlug(slug, 'slug');
  const normalizedType = ['website', 'dashboard', 'admin', 'app'].includes(type) ? type : 'website';

  return withTransaction(async (connection) => {
    const [dupRows] = await connection.query(
      `SELECT id FROM projects WHERE slug = ? LIMIT 1`,
      [normalizedSlug]
    );
    if (dupRows.length) {
      throw new Error('Project slug already exists');
    }

    const [insertProject] = await connection.query(
      `INSERT INTO projects (name, title, slug, type, config_json)
       VALUES (?, ?, ?, ?, NULL)`,
      [name.trim(), name.trim(), normalizedSlug, normalizedType]
    );
    const projectId = insertProject.insertId;

    const [insertPage] = await connection.query(
      `INSERT INTO pages (project_id, title, slug, status, published_version_id)
       VALUES (?, 'Home', 'home', 'draft', NULL)`,
      [projectId]
    );
    const pageId = insertPage.insertId;

    await connection.query(
      `INSERT INTO page_versions (page_id, version_number, status, snapshot_json)
       VALUES (?, 1, 'draft', JSON_OBJECT('nodes', JSON_ARRAY()))`,
      [pageId]
    );

    const [projectRows] = await connection.query(
      `SELECT id, COALESCE(NULLIF(name, ''), 'Untitled Project') AS name, slug, type, config_json, created_at, updated_at
       FROM projects
       WHERE id = ?`,
      [projectId]
    );
    const [pageRows] = await connection.query(
      `SELECT id, project_id, title, slug, status, published_version_id, created_at, updated_at
       FROM pages
       WHERE id = ?`,
      [pageId]
    );

    return {
      project: {
        id: projectRows[0].id,
        name: projectRows[0].name,
        slug: projectRows[0].slug,
        type: projectRows[0].type,
        configJson: parseJsonColumn(projectRows[0].config_json),
        createdAt: projectRows[0].created_at,
        updatedAt: projectRows[0].updated_at,
      },
      defaultPage: {
        id: pageRows[0].id,
        projectId: pageRows[0].project_id,
        title: pageRows[0].title,
        slug: pageRows[0].slug,
        status: pageRows[0].status,
        publishedVersionId: pageRows[0].published_version_id,
        createdAt: pageRows[0].created_at,
        updatedAt: pageRows[0].updated_at,
      },
    };
  });
}

export async function listPagesByProject(projectId) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');

  const [rows] = await getDbPool().query(
    `SELECT id, project_id, title, slug, status, published_version_id, created_at, updated_at
     FROM pages
     WHERE project_id = ?
     ORDER BY created_at ASC, id ASC`,
    [pid]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    slug: row.slug,
    status: row.status || 'draft',
    publishedVersionId: row.published_version_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createPageForProject(
  projectId,
  { title, slug, createStarter = true } = {}
) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  assertValidTitle(title, 'title');
  const normalizedSlug = assertValidSlug(slug, 'slug');

  return withTransaction(async (connection) => {
    const [projectRows] = await connection.query(
      `SELECT id FROM projects WHERE id = ? LIMIT 1`,
      [pid]
    );
    if (!projectRows.length) throw new Error('Project not found');

    const [dupRows] = await connection.query(
      `SELECT id FROM pages WHERE project_id = ? AND slug = ? LIMIT 1`,
      [pid, normalizedSlug]
    );
    if (dupRows.length) throw new Error('Page slug already exists in this project');

    const [insertPage] = await connection.query(
      `INSERT INTO pages (project_id, title, slug, status, published_version_id)
       VALUES (?, ?, ?, 'draft', NULL)`,
      [pid, title.trim(), normalizedSlug]
    );
    const pageId = insertPage.insertId;

    const [insertVersion] = await connection.query(
      `INSERT INTO page_versions (page_id, version_number, status, snapshot_json)
       VALUES (?, 1, 'draft', JSON_OBJECT('nodes', JSON_ARRAY()))`,
      [pageId]
    );
    const draftVersionId = insertVersion.insertId;

    if (createStarter) {
      await createStarterNodesForPageTx(pageId, draftVersionId, connection);
    }

    const [rows] = await connection.query(
      `SELECT id, project_id, title, slug, status, published_version_id, created_at, updated_at
       FROM pages
       WHERE id = ?`,
      [pageId]
    );
    const row = rows[0];
    return {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      slug: row.slug,
      status: row.status || 'draft',
      publishedVersionId: row.published_version_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export async function updatePageMeta(pageId, { title, slug }) {
  const id = Number(pageId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid pageId');

  return withTransaction(async (connection) => {
    const [existingRows] = await connection.query(
      `SELECT id, project_id, title, slug
       FROM pages
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    if (!existingRows.length) return null;
    const existing = existingRows[0];

    const nextTitle = title !== undefined ? String(title).trim() : existing.title;
    const nextSlug = slug !== undefined ? assertValidSlug(slug, 'slug') : existing.slug;
    assertValidTitle(nextTitle, 'title');

    if (nextSlug !== existing.slug) {
      const [dupRows] = await connection.query(
        `SELECT id
         FROM pages
         WHERE project_id = ? AND slug = ? AND id <> ?
         LIMIT 1`,
        [existing.project_id, nextSlug, id]
      );
      if (dupRows.length) throw new Error('Page slug already exists in this project');
    }

    await connection.query(
      `UPDATE pages
       SET title = ?, slug = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextTitle, nextSlug, id]
    );

    const [rows] = await connection.query(
      `SELECT id, project_id, title, slug, status, published_version_id, created_at, updated_at
       FROM pages
       WHERE id = ?`,
      [id]
    );
    const row = rows[0];
    return {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      slug: row.slug,
      status: row.status || 'draft',
      publishedVersionId: row.published_version_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export async function deletePageSafely(pageId) {
  const id = Number(pageId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid pageId');

  return withTransaction(async (connection) => {
    const [existingRows] = await connection.query(
      `SELECT id, project_id
       FROM pages
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    if (!existingRows.length) return null;
    const existing = existingRows[0];

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM pages
       WHERE project_id = ?`,
      [existing.project_id]
    );
    const total = Number(countRows[0]?.total || 0);
    if (!canDeleteProjectPage(total)) throw new Error('Cannot delete last page of a project');

    await connection.query(`DELETE FROM pages WHERE id = ?`, [id]);

    return { id, projectId: existing.project_id, deleted: true };
  });
}

export async function deleteProjectSafely(projectId) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');

  return withTransaction(async (connection) => {
    const [rows] = await connection.query(
      `SELECT id FROM projects WHERE id = ? LIMIT 1`,
      [pid]
    );
    if (!rows.length) return null;

    // Pages (and their nodes/versions) are NOT cascade-deleted from projects.
    const [pageRows] = await connection.query(
      `SELECT id FROM pages WHERE project_id = ?`,
      [pid]
    );
    const pageIds = pageRows.map((r) => Number(r.id)).filter((x) => Number.isInteger(x) && x > 0);

    if (pageIds.length) {
      const placeholders = pageIds.map(() => '?').join(',');
      // builder_nodes has FK → page_versions, so delete nodes first.
      await connection.query(
        `DELETE FROM builder_nodes WHERE page_id IN (${placeholders})`,
        pageIds
      );
      // page_versions holds drafts/published snapshots.
      await connection.query(
        `DELETE FROM page_versions WHERE page_id IN (${placeholders})`,
        pageIds
      );
      // form_submissions cascades from pages, but this keeps deletes deterministic.
      await connection.query(
        `DELETE FROM pages WHERE id IN (${placeholders})`,
        pageIds
      );
    }

    // CMS tables are project-scoped but not FK-cascaded from projects.
    await connection.query(
      `DELETE FROM cms_items WHERE collection_id IN (SELECT id FROM cms_collections WHERE project_id = ?)`,
      [pid]
    );
    await connection.query(`DELETE FROM cms_collections WHERE project_id = ?`, [pid]);

    // Project apps are project-scoped and not FK-cascaded.
    await connection.query(`DELETE FROM project_apps WHERE project_id = ?`, [pid]);

    // These are ON DELETE CASCADE: global_components, reusable_blocks, media_assets, form_submissions (project_id).
    await connection.query(`DELETE FROM projects WHERE id = ?`, [pid]);

    return { id: pid, deleted: true };
  });
}

export async function getPageRoutingInfo(pageId) {
  const [rows] = await getDbPool().query(
    `
    SELECT p.slug AS pageSlug, pr.slug AS projectSlug
    FROM pages p
    JOIN projects pr ON pr.id = p.project_id
    WHERE p.id = ?
    LIMIT 1
    `,
    [pageId]
  );
  if (!rows.length) return null;
  return rows[0];
}

export async function publishPage(pageId) {
  return withTransaction(async (connection) => {
    const page = await getPageById(pageId, connection);
    if (!page) return null;

    const draft = await ensureDraftVersionTx(pageId, connection);
    // Ensure publish always uses latest authoritative node tree (prevents stale snapshot drift).
    await refreshVersionSnapshot(draft.id, connection);
    const [versionRows] = await connection.query(
      `SELECT id, page_id, version_number, status, snapshot_json
       FROM page_versions
       WHERE id = ?`,
      [draft.id]
    );
    const fullDraft = versionRows[0];
    const snapshot = parseSnapshot(fullDraft.snapshot_json) || { nodes: [] };

    await connection.query(
      `UPDATE page_versions
       SET status = 'published'
       WHERE id = ?`,
      [fullDraft.id]
    );

    await connection.query(
      `UPDATE page_versions
       SET status = 'archived'
       WHERE page_id = ? AND id <> ? AND status = 'published'`,
      [pageId, fullDraft.id]
    );

    await connection.query(
      `UPDATE pages
       SET published_version_id = ?, status = 'published', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [fullDraft.id, pageId]
    );

    return {
      pageId,
      publishedVersionId: fullDraft.id,
      versionNumber: fullDraft.version_number,
      snapshot,
    };
  });
}
