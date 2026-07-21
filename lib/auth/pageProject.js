import { getDbPool } from '../db.js';
import { toClientId } from './clientIds.js';

export async function getPageProjectId(pageId) {
  const id = toClientId(pageId);
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) return null;
  const pool = getDbPool();
  const [rows] = await pool.execute(
    `SELECT project_id FROM pages WHERE id = :id LIMIT 1`,
    { id }
  );
  const projectId = rows[0]?.project_id;
  return projectId != null ? toClientId(projectId) : null;
}
