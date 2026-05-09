import { getDbPool } from '@/lib/db';
import { listAvailableApps } from '@/lib/registry/appLoader';

function parseJsonValue(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function listProjectApps(projectId) {
  const pool = getDbPool();
  const available = listAvailableApps();
  const [rows] = await pool.query(
    `SELECT app_id, enabled, settings_json
     FROM project_apps
     WHERE project_id = ?`,
    [projectId]
  );
  const byId = new Map(rows.map((r) => [r.app_id, r]));
  return available.map((a) => {
    const r = byId.get(a.id) || null;
    return {
      ...a,
      enabled: Boolean(r?.enabled),
      settings: parseJsonValue(r?.settings_json, {}) || {},
    };
  });
}

export async function setProjectAppEnabled(projectId, appId, enabled) {
  const pool = getDbPool();
  const en = enabled ? 1 : 0;
  await pool.query(
    `
    INSERT INTO project_apps (project_id, app_id, enabled)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE enabled = VALUES(enabled)
    `,
    [projectId, appId, en]
  );
  return true;
}

export async function getEnabledAppIds(projectId) {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT app_id FROM project_apps WHERE project_id = ? AND enabled = 1`,
    [projectId]
  );
  return rows.map((r) => String(r.app_id)).filter(Boolean);
}

