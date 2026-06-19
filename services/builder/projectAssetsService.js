import { getDbPool } from '@/lib/db';
import { normalizeSiteTheme, SITE_THEME_SCHEMA_VERSION } from '@/lib/siteDesignTheme';
import { normalizeThemeTokens, THEME_TOKENS_SCHEMA_VERSION } from '@/lib/themeTokens';
import { normalizeStylePresets, STYLE_PRESETS_SCHEMA_VERSION } from '@/lib/stylePresetsStore';
import { normalizeAnimationPresets, ANIMATION_PRESETS_SCHEMA_VERSION } from '@/lib/animationPresetsStore';
import { getBuilderState } from '@/services/builder/builderService';
import { autoFixTree, reconcileStructuralParents, validateTree } from '@/lib/builderTree';

function parseConfig(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function cloneSectionNode(node, keyPrefix, role, isRoot = true) {
  const base = {
    ...node,
    id: `${keyPrefix}-${node.id}`,
    parentNodeId: null,
    children: Array.isArray(node.children)
      ? node.children.map((child) => ({
          ...cloneSectionNode(child, keyPrefix, role, false),
          parentNodeId: `${keyPrefix}-${node.id}`,
        }))
      : [],
  };
  if (base.nodeType !== 'row' || !isRoot) return base;
  const metaPatch =
    role === 'header' ? { isHeader: true } : role === 'footer' ? { isFooter: true } : {};
  if (!Object.keys(metaPatch).length) return base;
  const prevProps = base.props && typeof base.props === 'object' ? base.props : {};
  const prevMeta = prevProps.meta && typeof prevProps.meta === 'object' ? prevProps.meta : {};
  return {
    ...base,
    props: {
      ...prevProps,
      meta: { ...prevMeta, ...metaPatch },
    },
  };
}

function findNodeById(nodes, id) {
  for (const node of nodes || []) {
    if (Number(node.id) === Number(id)) return node;
    const inChildren = findNodeById(node.children || [], id);
    if (inChildren) return inChildren;
  }
  return null;
}

async function getProjectConfig(projectId) {
  const [rows] = await getDbPool().query(
    `SELECT id, config_json FROM projects WHERE id = ? LIMIT 1`,
    [projectId]
  );
  if (!rows.length) return null;
  return {
    id: rows[0].id,
    config: parseConfig(rows[0].config_json),
  };
}

async function saveProjectConfig(projectId, config) {
  await getDbPool().query(`UPDATE projects SET config_json = ? WHERE id = ?`, [
    JSON.stringify(config || {}),
    projectId,
  ]);
}

export async function saveGlobalSection({ pageId, rowId, role }) {
  const validRole = role === 'header' || role === 'footer' ? role : null;
  if (!validRole) throw new Error('Invalid global section role');
  const state = await getBuilderState(pageId);
  if (!state?.page?.projectId) throw new Error('Page not found');
  const row = findNodeById(state.tree, rowId);
  if (!row || row.nodeType !== 'row') throw new Error('Row section not found');
  const project = await getProjectConfig(state.page.projectId);
  if (!project) throw new Error('Project not found');
  const nextConfig = {
    ...(project.config || {}),
    globalSections: {
      ...((project.config || {}).globalSections || {}),
      [validRole]: cloneSectionNode(row, `global-${validRole}`, validRole),
    },
  };
  await saveProjectConfig(state.page.projectId, nextConfig);
  return nextConfig.globalSections;
}

export async function removeGlobalSection({ projectId, role }) {
  const validRole = role === 'header' || role === 'footer' ? role : null;
  if (!validRole) throw new Error('Invalid global section role');
  const project = await getProjectConfig(projectId);
  if (!project) throw new Error('Project not found');
  const prevGlobal = (project.config || {}).globalSections || {};
  const nextGlobal = { ...prevGlobal, [validRole]: null };
  const nextConfig = {
    ...(project.config || {}),
    globalSections: nextGlobal,
  };
  await saveProjectConfig(projectId, nextConfig);
  return nextGlobal;
}

export async function savePageTemplate({ pageId, name }) {
  const templateName = String(name || '').trim();
  if (!templateName) throw new Error('Template name is required');
  const state = await getBuilderState(pageId);
  if (!state?.page?.projectId) throw new Error('Page not found');
  const project = await getProjectConfig(state.page.projectId);
  if (!project) throw new Error('Project not found');
  const existing = Array.isArray(project.config?.pageTemplates) ? project.config.pageTemplates : [];
  const template = {
    id: `tpl-${Date.now()}`,
    name: templateName,
    createdAt: new Date().toISOString(),
    snapshot: state.tree || [],
  };
  const nextConfig = {
    ...(project.config || {}),
    pageTemplates: [...existing, template],
  };
  await saveProjectConfig(state.page.projectId, nextConfig);
  return template;
}

export async function listProjectTemplates(projectId) {
  const project = await getProjectConfig(projectId);
  if (!project) throw new Error('Project not found');
  return Array.isArray(project.config?.pageTemplates) ? project.config.pageTemplates : [];
}

function stripNodeForReusableSnapshot(node, parentNodeId = null) {
  const n = node && typeof node === 'object' ? node : {};
  return {
    id: Number(n.id),
    nodeType: n.nodeType,
    displayName: n.displayName,
    parentNodeId,
    positionIndex: Number(n.positionIndex || 0),
    props: n.props && typeof n.props === 'object' ? n.props : {},
    style_json: n.style_json && typeof n.style_json === 'object' ? n.style_json : undefined,
    dataJson: n.dataJson ?? null,
    actionsJson: n.actionsJson ?? null,
    children: Array.isArray(n.children)
      ? n.children.map((c, idx) => stripNodeForReusableSnapshot(c, Number(n.id)))
      : [],
  };
}

function findNodeByIdDeep(nodes, id) {
  for (const node of nodes || []) {
    if (Number(node.id) === Number(id)) return node;
    const child = findNodeByIdDeep(node.children || [], id);
    if (child) return child;
  }
  return null;
}

export async function createReusableBlock({ pageId, rowId, name }) {
  const blockName = String(name || '').trim();
  if (!blockName) throw new Error('Reusable block name is required');
  const state = await getBuilderState(pageId);
  if (!state?.page?.projectId) throw new Error('Page not found');
  const row = findNodeByIdDeep(state.tree, rowId);
  if (!row || row.nodeType !== 'row') throw new Error('Row section not found');

  const snapshotTree = reconcileStructuralParents(autoFixTree([row]));
  validateTree(snapshotTree);

  const stripped = snapshotTree.map((n) => stripNodeForReusableSnapshot(n, null));

  const pool = getDbPool();
  const [res] = await pool.query(
    `INSERT INTO reusable_blocks (project_id, name, snapshot_json)
     VALUES (?, ?, ?)`,
    [state.page.projectId, blockName, JSON.stringify({ nodes: stripped })]
  );
  const id = res.insertId;
  const [rows] = await pool.query(
    `SELECT id, project_id, name, snapshot_json, created_at, updated_at
     FROM reusable_blocks
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  const r = rows[0];
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    snapshot: parseConfig(r.snapshot_json),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listReusableBlocks(projectId) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  const [rows] = await getDbPool().query(
    `SELECT id, project_id, name, snapshot_json, created_at, updated_at
     FROM reusable_blocks
     WHERE project_id = ?
     ORDER BY updated_at DESC, id DESC`,
    [pid]
  );
  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    snapshot: parseConfig(r.snapshot_json),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function renameReusableBlock({ projectId, blockId, name }) {
  const pid = Number(projectId);
  const id = Number(blockId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid blockId');
  const nextName = String(name || '').trim();
  if (!nextName) throw new Error('Reusable block name is required');
  const pool = getDbPool();
  await pool.query(
    `UPDATE reusable_blocks SET name = ? WHERE id = ? AND project_id = ?`,
    [nextName, id, pid]
  );
  const [rows] = await pool.query(
    `SELECT id, project_id, name, snapshot_json, created_at, updated_at
     FROM reusable_blocks
     WHERE id = ? AND project_id = ?
     LIMIT 1`,
    [id, pid]
  );
  if (!rows.length) throw new Error('Reusable block not found');
  const r = rows[0];
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    snapshot: parseConfig(r.snapshot_json),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function deleteReusableBlock({ projectId, blockId }) {
  const pid = Number(projectId);
  const id = Number(blockId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid blockId');
  const [res] = await getDbPool().query(
    `DELETE FROM reusable_blocks WHERE id = ? AND project_id = ?`,
    [id, pid]
  );
  return { deleted: Number(res.affectedRows || 0) > 0 };
}

/**
 * Persist site-wide design tokens on `projects.config_json.siteTheme` (project-scoped).
 * @param {number} projectId
 * @param {object} siteTheme — client payload; `revision` is assigned server-side.
 * @param {number} [ifRevision] — optimistic concurrency: must match current stored revision.
 */
export async function saveSiteTheme({ projectId, siteTheme, ifRevision }) {
  const prid = Number(projectId);
  if (!Number.isInteger(prid) || prid <= 0) throw new Error('Invalid projectId');
  const project = await getProjectConfig(prid);
  if (!project) throw new Error('Project not found');
  const current = project.config?.siteTheme;
  const currentRev =
    typeof current?.revision === 'number' && Number.isFinite(current.revision)
      ? Math.max(0, Math.floor(current.revision))
      : 0;
  if (ifRevision !== undefined && ifRevision !== null && Number(ifRevision) !== currentRev) {
    const err = new Error('REVISION_CONFLICT');
    err.code = 'REVISION_CONFLICT';
    throw err;
  }
  const normalized = normalizeSiteTheme(siteTheme);
  normalized.revision = currentRev + 1;
  normalized.schemaVersion = SITE_THEME_SCHEMA_VERSION;
  const nextConfig = {
    ...(project.config || {}),
    siteTheme: normalized,
  };
  await saveProjectConfig(prid, nextConfig);
  return normalized;
}

/**
 * Persist project-wide design tokens on `projects.config_json.themeTokens`.
 * @param {number} projectId
 * @param {object} themeTokens
 * @param {number} [ifRevision]
 */
export async function saveThemeTokens({ projectId, themeTokens, ifRevision }) {
  const prid = Number(projectId);
  if (!Number.isInteger(prid) || prid <= 0) throw new Error('Invalid projectId');
  const project = await getProjectConfig(prid);
  if (!project) throw new Error('Project not found');
  const current = project.config?.themeTokens;
  const currentRev =
    typeof current?.revision === 'number' && Number.isFinite(current.revision)
      ? Math.max(0, Math.floor(current.revision))
      : 0;
  if (ifRevision !== undefined && ifRevision !== null && Number(ifRevision) !== currentRev) {
    const err = new Error('REVISION_CONFLICT');
    err.code = 'REVISION_CONFLICT';
    throw err;
  }
  const normalized = normalizeThemeTokens(themeTokens);
  normalized.revision = currentRev + 1;
  normalized.schemaVersion = THEME_TOKENS_SCHEMA_VERSION;
  const nextConfig = {
    ...(project.config || {}),
    themeTokens: normalized,
  };
  await saveProjectConfig(prid, nextConfig);
  return normalized;
}

/**
 * Persist reusable style presets on `projects.config_json.stylePresets`.
 * @param {number} projectId
 * @param {object} stylePresets
 * @param {number} [ifRevision]
 */
export async function saveStylePresets({ projectId, stylePresets, ifRevision }) {
  const prid = Number(projectId);
  if (!Number.isInteger(prid) || prid <= 0) throw new Error('Invalid projectId');
  const project = await getProjectConfig(prid);
  if (!project) throw new Error('Project not found');
  const current = project.config?.stylePresets;
  const currentRev =
    typeof current?.revision === 'number' && Number.isFinite(current.revision)
      ? Math.max(0, Math.floor(current.revision))
      : 0;
  if (ifRevision !== undefined && ifRevision !== null && Number(ifRevision) !== currentRev) {
    const err = new Error('REVISION_CONFLICT');
    err.code = 'REVISION_CONFLICT';
    throw err;
  }
  const normalized = normalizeStylePresets(stylePresets);
  normalized.revision = currentRev + 1;
  normalized.schemaVersion = STYLE_PRESETS_SCHEMA_VERSION;
  const nextConfig = {
    ...(project.config || {}),
    stylePresets: normalized,
  };
  await saveProjectConfig(prid, nextConfig);
  return normalized;
}

/**
 * Persist reusable animation presets on `projects.config_json.animationPresets`.
 */
export async function saveAnimationPresets({ projectId, animationPresets, ifRevision }) {
  const prid = Number(projectId);
  if (!Number.isInteger(prid) || prid <= 0) throw new Error('Invalid projectId');
  const project = await getProjectConfig(prid);
  if (!project) throw new Error('Project not found');
  const current = project.config?.animationPresets;
  const currentRev =
    typeof current?.revision === 'number' && Number.isFinite(current.revision)
      ? Math.max(0, Math.floor(current.revision))
      : 0;
  if (ifRevision !== undefined && ifRevision !== null && Number(ifRevision) !== currentRev) {
    const err = new Error('REVISION_CONFLICT');
    err.code = 'REVISION_CONFLICT';
    throw err;
  }
  const normalized = normalizeAnimationPresets(animationPresets);
  normalized.revision = currentRev + 1;
  normalized.schemaVersion = ANIMATION_PRESETS_SCHEMA_VERSION;
  const nextConfig = {
    ...(project.config || {}),
    animationPresets: normalized,
  };
  await saveProjectConfig(prid, nextConfig);
  return normalized;
}

/**
 * Load site theme + theme tokens from project config (admin theme workspace).
 */
export async function getProjectThemeAssets(projectId) {
  const prid = Number(projectId);
  if (!Number.isInteger(prid) || prid <= 0) throw new Error('Invalid projectId');
  const project = await getProjectConfig(prid);
  if (!project) throw new Error('Project not found');
  const cfg = project.config || {};
  return {
    siteTheme: normalizeSiteTheme(cfg.siteTheme),
    themeTokens: normalizeThemeTokens(cfg.themeTokens),
  };
}

