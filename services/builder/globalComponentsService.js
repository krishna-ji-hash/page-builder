import { getDbPool } from '@/lib/db';
import { autoFixTree, reconcileStructuralParents, validateTree } from '@/lib/builderTree';

function parseJson(value, fallback) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeSnapshotNodes(nodes) {
  const safe = Array.isArray(nodes) ? nodes : [];
  const fixed = reconcileStructuralParents(autoFixTree(safe));
  validateTree(fixed);
  return fixed;
}

export async function listGlobalComponents(projectId) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  const [rows] = await getDbPool().query(
    `SELECT id, project_id, type, name, current_revision, linked_pages_count, created_at, updated_at
     FROM global_components
     WHERE project_id = ?
     ORDER BY updated_at DESC, id DESC`,
    [pid]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    projectId: Number(r.project_id),
    type: r.type,
    name: r.name,
    currentRevision: Number(r.current_revision || 1),
    linkedPagesCount: Number(r.linked_pages_count || 0),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getGlobalComponent(projectId, componentId) {
  const pid = Number(projectId);
  const id = Number(componentId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid componentId');
  const [rows] = await getDbPool().query(
    `SELECT id, project_id, type, name, current_revision, snapshot_json, linked_pages_count, created_at, updated_at
     FROM global_components
     WHERE id = ? AND project_id = ?
     LIMIT 1`,
    [id, pid]
  );
  if (!rows.length) return null;
  const r = rows[0];
  const snap = parseJson(r.snapshot_json, { nodes: [] });
  return {
    id: Number(r.id),
    projectId: Number(r.project_id),
    type: r.type,
    name: r.name,
    currentRevision: Number(r.current_revision || 1),
    linkedPagesCount: Number(r.linked_pages_count || 0),
    snapshot: snap,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function createGlobalComponent({ projectId, type, name, snapshotNodes }) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  const safeType = String(type || 'generic').trim().slice(0, 64) || 'generic';
  const safeName = String(name || '').trim().slice(0, 255);
  if (!safeName) throw new Error('Component name is required');
  const normalizedNodes = normalizeSnapshotNodes(snapshotNodes);
  const snapshot = { nodes: normalizedNodes };

  const pool = getDbPool();
  const [res] = await pool.query(
    `INSERT INTO global_components (project_id, type, name, current_revision, snapshot_json, linked_pages_count)
     VALUES (?, ?, ?, 1, ?, 0)`,
    [pid, safeType, safeName, JSON.stringify(snapshot)]
  );
  const id = res.insertId;
  await pool.query(
    `INSERT INTO global_component_revisions (component_id, revision, snapshot_json)
     VALUES (?, 1, ?)`,
    [id, JSON.stringify(snapshot)]
  );
  return getGlobalComponent(pid, id);
}

export async function updateGlobalComponentSnapshot({ projectId, componentId, snapshotNodes }) {
  const pid = Number(projectId);
  const id = Number(componentId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid componentId');
  const normalizedNodes = normalizeSnapshotNodes(snapshotNodes);
  const snapshot = { nodes: normalizedNodes };

  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT current_revision FROM global_components WHERE id = ? AND project_id = ? LIMIT 1`,
    [id, pid]
  );
  if (!rows.length) throw new Error('Global component not found');
  const nextRev = Number(rows[0].current_revision || 1) + 1;

  await pool.query(
    `UPDATE global_components
     SET current_revision = ?, snapshot_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND project_id = ?`,
    [nextRev, JSON.stringify(snapshot), id, pid]
  );
  await pool.query(
    `INSERT INTO global_component_revisions (component_id, revision, snapshot_json)
     VALUES (?, ?, ?)`,
    [id, nextRev, JSON.stringify(snapshot)]
  );
  return getGlobalComponent(pid, id);
}

export async function getGlobalComponentsByIds(projectId, ids) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  const list = Array.isArray(ids) ? ids.map((x) => Number(x)).filter((n) => Number.isInteger(n) && n > 0) : [];
  if (!list.length) return [];
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT id, snapshot_json, current_revision
     FROM global_components
     WHERE project_id = ? AND id IN (?)`,
    [pid, list]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    currentRevision: Number(r.current_revision || 1),
    snapshot: parseJson(r.snapshot_json, { nodes: [] }),
  }));
}

