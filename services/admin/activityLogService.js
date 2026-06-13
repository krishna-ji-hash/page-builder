import { activityActionLabel } from '@/lib/admin/activityActions';
import { getDbPool } from '@/lib/db';

function normalizeId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseMetadata(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mapActivityRow(row) {
  const metadata = parseMetadata(row.metadata_json);
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    pageId: row.page_id,
    action: row.action,
    actionLabel: activityActionLabel(row.action),
    metadata,
    createdAt: row.created_at,
    userEmail: row.user_email || null,
    userDisplayName: row.user_display_name || null,
    projectName: row.project_name || null,
    projectSlug: row.project_slug || null,
    pageTitle: row.page_title || null,
    pageSlug: row.page_slug || null,
  };
}

/**
 * Record an admin activity event. Never throws — failures are logged only.
 */
export async function recordAdminActivity({
  userId = null,
  projectId = null,
  pageId = null,
  action,
  metadata = null,
}) {
  const actionKey = String(action || '').trim();
  if (!actionKey) return null;

  try {
    const pool = getDbPool();
    const [result] = await pool.query(
      `INSERT INTO admin_activity_logs (user_id, project_id, page_id, action, metadata_json)
       VALUES (?, ?, ?, ?, ?)`,
      [
        normalizeId(userId),
        normalizeId(projectId),
        normalizeId(pageId),
        actionKey,
        metadata && typeof metadata === 'object' ? JSON.stringify(metadata) : null,
      ]
    );
    return result.insertId;
  } catch (error) {
    console.error('[activityLog] record failed:', error?.message || error);
    return null;
  }
}

export async function listAdminActivityLogs(options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 25, 1), 200);
  const offset = Math.max(Number(options.offset) || 0, 0);
  const projectId = normalizeId(options.projectId);
  const action = options.action ? String(options.action).trim() : null;

  const where = [];
  const params = {};
  if (projectId) {
    where.push('l.project_id = :projectId');
    params.projectId = projectId;
  }
  if (action) {
    where.push('l.action = :action');
    params.action = action;
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT l.id, l.user_id, l.project_id, l.page_id, l.action, l.metadata_json, l.created_at,
            u.email AS user_email,
            COALESCE(NULLIF(u.display_name, ''), u.email) AS user_display_name,
            COALESCE(NULLIF(p.name, ''), p.title) AS project_name,
            p.slug AS project_slug,
            pg.title AS page_title,
            pg.slug AS page_slug
     FROM admin_activity_logs l
     LEFT JOIN admin_users u ON u.id = l.user_id
     LEFT JOIN projects p ON p.id = l.project_id
     LEFT JOIN pages pg ON pg.id = l.page_id
     ${whereSql}
     ORDER BY l.created_at DESC, l.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return rows.map(mapActivityRow);
}
