import { getDbPool } from '@/lib/db';
import { parsePublishedSnapshot } from '@/lib/publishedSnapshot';
import { findPageHeaderRow } from '@/lib/globalHeaderNavSync';
import { getDraftPageForBuilder } from '@/services/builder/builderService';

function parseJsonValue(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * @param {string} projectSlug
 * @param {string} [homeSlug='home']
 */
export async function getPublishedHomeHeaderRow(projectSlug, homeSlug = 'home') {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `
    SELECT pv.snapshot_json
    FROM pages p
    JOIN projects pr ON pr.id = p.project_id
    INNER JOIN page_versions pv ON pv.id = p.published_version_id
    WHERE pr.slug = ?
      AND p.slug = ?
      AND p.published_version_id IS NOT NULL
      AND pv.status = 'published'
    LIMIT 1
    `,
    [projectSlug, homeSlug]
  );
  if (!rows.length) return null;
  const parsed = parsePublishedSnapshot(rows[0].snapshot_json);
  if (!parsed.ok || !Array.isArray(parsed.nodes)) return null;
  return findPageHeaderRow(parsed.nodes);
}

/**
 * Draft home header for builder preview (latest home page edits).
 * @param {number} projectId
 * @param {string} [homeSlug='home']
 */
export async function getDraftHomeHeaderRow(projectId, homeSlug = 'home') {
  const pool = getDbPool();
  const [pageRows] = await pool.query(
    `SELECT p.id FROM pages p WHERE p.project_id = ? AND p.slug = ? LIMIT 1`,
    [projectId, homeSlug]
  );
  if (!pageRows.length) return null;
  const state = await getDraftPageForBuilder(pageRows[0].id);
  return findPageHeaderRow(state?.tree);
}
