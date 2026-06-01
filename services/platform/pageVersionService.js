import { getDbPool, withTransaction } from '@/lib/db';
import { flattenTemplateToBulkNodes } from '@/lib/sectionTemplates';
import { autoFixTree, validateTree } from '@/lib/builderTree';
import {
  createNodesBulk,
  getBuilderState,
} from '@/services/builder/builderService';

function parseSnapshot(value) {
  if (value == null) return { nodes: [] };
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return { nodes: [] };
  }
}

function flattenClientTreeToBulkNodes(roots) {
  const rootsFixed = autoFixTree(roots);
  validateTree(rootsFixed, null);
  return flattenTemplateToBulkNodes(rootsFixed, 0);
}

export async function listPageVersionHistory(pageId) {
  const pid = Number(pageId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid pageId');

  const [rows] = await getDbPool().query(
    `SELECT pv.id, pv.page_id, pv.version_number, pv.status, pv.created_at,
            p.published_version_id,
            p.title AS page_title,
            p.slug AS page_slug
     FROM page_versions pv
     INNER JOIN pages p ON p.id = pv.page_id
     WHERE pv.page_id = ?
       AND pv.status IN ('published', 'archived')
     ORDER BY pv.version_number DESC, pv.id DESC`,
    [pid]
  );

  return rows.map((row) => ({
    id: row.id,
    pageId: row.page_id,
    versionNumber: row.version_number,
    status: row.status,
    createdAt: row.created_at,
    isLive: Number(row.published_version_id) === Number(row.id),
    publishDate: row.created_at,
    author: 'Builder',
    pageTitle: row.page_title,
    pageSlug: row.page_slug,
  }));
}

/**
 * Restore an archived/published snapshot into the current draft (does not auto-publish).
 */
export async function restorePageVersionToDraft(pageId, versionId) {
  const pid = Number(pageId);
  const vid = Number(versionId);

  const [versionRows] = await getDbPool().query(
    `SELECT id, page_id, status, snapshot_json FROM page_versions WHERE id = ? AND page_id = ? LIMIT 1`,
    [vid, pid]
  );
  if (!versionRows.length) throw new Error('Version not found');
  const version = versionRows[0];
  if (version.status === 'draft') throw new Error('Cannot restore from draft version');

  const snapshot = parseSnapshot(version.snapshot_json);
  const nodes = Array.isArray(snapshot.nodes) ? snapshot.nodes : [];

  const state = await getBuilderState(pid);
  if (!state?.draftVersion?.id) throw new Error('Draft version not found');
  const draftVersionId = state.draftVersion.id;

  await withTransaction(async (connection) => {
    await connection.query(`DELETE FROM builder_nodes WHERE version_id = ?`, [draftVersionId]);
    await connection.query(
      `UPDATE page_versions SET snapshot_json = ? WHERE id = ?`,
      [JSON.stringify({ nodes: [] }), draftVersionId]
    );
  });

  if (nodes.length) {
    const bulk = flattenClientTreeToBulkNodes(nodes);
    await createNodesBulk(pid, bulk);
  }

  const refreshed = await getBuilderState(pid);
  return {
    pageId: pid,
    restoredVersionId: vid,
    draftVersionId,
    tree: refreshed?.tree || [],
  };
}

/**
 * Duplicate a historical version as a new draft version row (branch for preview).
 */
export async function duplicatePageVersion(pageId, versionId) {
  const pid = Number(pageId);
  const vid = Number(versionId);

  return withTransaction(async (connection) => {
    const [versionRows] = await connection.query(
      `SELECT id, page_id, version_number, snapshot_json FROM page_versions WHERE id = ? AND page_id = ? LIMIT 1`,
      [vid, pid]
    );
    if (!versionRows.length) throw new Error('Version not found');

    const [maxRows] = await connection.query(
      `SELECT COALESCE(MAX(version_number), 0) AS max_v FROM page_versions WHERE page_id = ?`,
      [pid]
    );
    const nextNum = Number(maxRows[0]?.max_v || 0) + 1;
    const snapshot = parseSnapshot(versionRows[0].snapshot_json);

    const [insert] = await connection.query(
      `INSERT INTO page_versions (page_id, version_number, status, snapshot_json)
       VALUES (?, ?, 'draft', ?)`,
      [pid, nextNum, JSON.stringify(snapshot)]
    );

    return {
      pageId: pid,
      sourceVersionId: vid,
      newVersionId: insert.insertId,
      versionNumber: nextNum,
      snapshot,
    };
  });
}

export async function getPageVersionPreview(pageId, versionId) {
  const [rows] = await getDbPool().query(
    `SELECT id, page_id, version_number, status, snapshot_json, created_at
     FROM page_versions
     WHERE id = ? AND page_id = ?
     LIMIT 1`,
    [Number(versionId), Number(pageId)]
  );
  if (!rows.length) return null;
  const row = rows[0];
  const snapshot = parseSnapshot(row.snapshot_json);
  return {
    id: row.id,
    pageId: row.page_id,
    versionNumber: row.version_number,
    status: row.status,
    createdAt: row.created_at,
    nodes: snapshot.nodes || [],
    globalSections: snapshot.globalSections || null,
  };
}
