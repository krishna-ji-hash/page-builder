import { unstable_noStore as noStore } from 'next/cache';
import { getDbPool } from '@/lib/db';
import { parsePublishedSnapshot } from '@/lib/publishedSnapshot';

function parseJsonValue(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function getPublishedPageRaw(projectSlug, pageSlug) {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `
    SELECT
      p.id,
      p.title,
      p.slug,
      p.project_id,
      p.published_version_id,
      pr.slug AS project_slug,
      pr.config_json,
      pv.snapshot_json
    FROM pages p
    JOIN projects pr ON pr.id = p.project_id
    INNER JOIN page_versions pv ON pv.id = p.published_version_id
    WHERE pr.slug = ? AND p.slug = ?
    LIMIT 1
    `,
    [projectSlug, pageSlug]
  );

  if (!rows.length) return null;
  const row = rows[0];

  let snapshotJson = null;
  if (row.snapshot_json != null) {
    try {
      const parsed = parsePublishedSnapshot(row.snapshot_json);
      snapshotJson = parsed.ok ? parsed.nodes : null;
    } catch {
      snapshotJson = null;
    }
  }

  const projectConfig = parseJsonValue(row.config_json, {}) || {};
  const [pageRows] = await pool.query(
    `SELECT slug, title
     FROM pages
     WHERE project_id = ?
     ORDER BY created_at ASC, id ASC`,
    [row.project_id]
  );

  return {
    id: row.id,
    name: row.title,
    slug: row.slug,
    projectId: row.project_id,
    projectSlug: row.project_slug,
    publishedVersionId: row.published_version_id,
    seo: {
      title: row.title,
      description: '',
    },
    snapshot_json: snapshotJson,
    projectConfig,
    projectPages: pageRows.map((page) => ({
      slug: page.slug,
      title: page.title,
      href: `/${row.project_slug}/${page.slug}`,
    })),
  };
}

export async function getPublishedPage(projectSlug, pageSlug) {
  noStore();
  return getPublishedPageRaw(projectSlug, pageSlug);
}
