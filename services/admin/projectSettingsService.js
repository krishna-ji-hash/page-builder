import { getDbPool } from '@/lib/db';
import { listCollections } from '@/services/builder/cmsService';

function parseJson(value, fallback = {}) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** Project metadata + counts for the admin settings workspace. */
export async function getProjectSettingsSummary(projectId) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');

  const pool = getDbPool();
  const [projectRows] = await pool.query(
    `SELECT id, name, title, slug, type, config_json, created_at, updated_at
     FROM projects
     WHERE id = ?
     LIMIT 1`,
    [pid]
  );
  const row = projectRows[0];
  if (!row) return null;

  const [[pageRows], [domainRows], [mediaRows], [formRows]] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published
       FROM pages
       WHERE project_id = ?`,
      [pid]
    ),
    pool.query(`SELECT COUNT(*) AS total FROM project_domains WHERE project_id = ?`, [pid]),
    pool.query(`SELECT COUNT(*) AS total FROM media_assets WHERE project_id = ?`, [pid]),
    pool.query(`SELECT COUNT(*) AS total FROM form_submissions WHERE project_id = ?`, [pid]),
  ]);

  const collections = await listCollections(pid);
  const config = parseJson(row.config_json, {});
  const siteTheme = config?.siteTheme && typeof config.siteTheme === 'object' ? config.siteTheme : {};

  return {
    project: {
      id: row.id,
      name: row.name || row.title || `Project #${row.id}`,
      slug: row.slug,
      type: row.type || 'website',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    stats: {
      pages: Number(pageRows[0]?.total || 0),
      publishedPages: Number(pageRows[0]?.published || 0),
      domains: Number(domainRows[0]?.total || 0),
      media: Number(mediaRows[0]?.total || 0),
      cmsCollections: collections.length,
      formSubmissions: Number(formRows[0]?.total || 0),
      themeRevision: typeof siteTheme.revision === 'number' ? siteTheme.revision : 0,
      themePreset: siteTheme.presetId === 'dark' ? 'dark' : 'light',
    },
  };
}
