import { unstable_noStore as noStore } from 'next/cache';
import { getDbPool } from '@/lib/db';
import { parsePublishedSnapshot } from '@/lib/publishedSnapshot';
import { getGlobalComponentsByIds } from '@/services/builder/globalComponentsService';
import { expandLinkedGlobalComponents } from '@/lib/globalComponentExpand';
import { expandCms } from '@/lib/cms/cmsExpand';
import * as cmsService from '@/services/builder/cmsService';

function parseJsonValue(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function getPublishedPageRaw(projectSlug, pageSlug, pageContext = null) {
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

  // Expand linked global components before rendering (renderTree unchanged).
  if (Array.isArray(snapshotJson) && snapshotJson.length) {
    const ids = [];
    const walk = (nodes) => {
      for (const n of nodes || []) {
        const meta = n?.props?.meta || n?.meta || null;
        if (meta?.globalMode === 'linked' && meta?.globalComponentId) ids.push(Number(meta.globalComponentId));
        if (Array.isArray(n?.children) && n.children.length) walk(n.children);
      }
    };
    walk(snapshotJson);
    const uniq = Array.from(new Set(ids.filter((n) => Number.isInteger(n) && n > 0)));
    if (uniq.length) {
      const comps = await getGlobalComponentsByIds(row.project_id, uniq);
      const map = new Map(comps.map((c) => [c.id, c.snapshot]));
      snapshotJson = expandLinkedGlobalComponents(snapshotJson, (id) => map.get(id) || null);
    }
  }

  // Expand CMS repeaters/bindings before rendering (renderTree unchanged).
  if (Array.isArray(snapshotJson) && snapshotJson.length) {
    snapshotJson = await expandCms(snapshotJson, { projectId: row.project_id, cmsService, pageContext });
  }

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

export async function getPublishedPage(projectSlug, pageSlug, pageContext = null) {
  noStore();
  return getPublishedPageRaw(projectSlug, pageSlug, pageContext);
}
