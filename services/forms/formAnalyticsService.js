import { getDbPool } from '@/lib/db';

const ALLOWED_EVENTS = new Set(['view', 'start', 'submit']);

/**
 * @param {{ projectId: number; pageId?: number|null; formNodeId: string; event: string }} params
 */
export async function recordFormAnalyticsEvent({ projectId, pageId, formNodeId, event }) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  const ev = String(event || '').trim().toLowerCase();
  if (!ALLOWED_EVENTS.has(ev)) throw new Error('Invalid event');
  const fid = String(formNodeId || '').trim().slice(0, 96);
  if (!fid) throw new Error('Invalid formNodeId');
  const pgid = pageId != null ? Number(pageId) : null;
  const pageVal = Number.isInteger(pgid) && pgid > 0 ? pgid : null;

  const pool = getDbPool();
  await pool.query(
    `INSERT INTO form_analytics (project_id, page_id, form_node_id, event_type)
     VALUES (?, ?, ?, ?)`,
    [pid, pageVal, fid, ev]
  );
  return { ok: true };
}

/**
 * @param {{ projectId: number; formNodeId?: string|null; pageId?: number|null }} query
 */
export async function getFormAnalyticsSummary({ projectId, formNodeId = null, pageId = null }) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');

  const clauses = ['project_id = ?'];
  const params = [pid];
  const pgid = pageId != null ? Number(pageId) : null;
  if (Number.isInteger(pgid) && pgid > 0) {
    clauses.push('page_id = ?');
    params.push(pgid);
  }
  const fid = formNodeId != null ? String(formNodeId).trim().slice(0, 96) : '';
  if (fid) {
    clauses.push('form_node_id = ?');
    params.push(fid);
  }

  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT event_type, COUNT(*) AS cnt
     FROM form_analytics
     WHERE ${clauses.join(' AND ')}
     GROUP BY event_type`,
    params
  );

  const counts = { view: 0, start: 0, submit: 0 };
  for (const row of rows || []) {
    const k = String(row.event_type || '').toLowerCase();
    if (counts[k] != null) counts[k] = Number(row.cnt) || 0;
  }
  const conversionRate =
    counts.start > 0 ? Math.round((counts.submit / counts.start) * 1000) / 10 : counts.view > 0
      ? Math.round((counts.submit / counts.view) * 1000) / 10
      : 0;

  return {
    views: counts.view,
    starts: counts.start,
    submissions: counts.submit,
    conversionRate,
  };
}
