import { unstable_noStore as noStore } from 'next/cache';
import { getDbPool } from '@/lib/db';
import { parsePublishedSnapshot } from '@/lib/publishedSnapshot';
import { emptyFrozenGlobalSections } from '@/lib/globalSectionSnapshot';
import { getGlobalComponentsByIds } from '@/services/builder/globalComponentsService';
import { expandLinkedGlobalComponents } from '@/lib/globalComponentExpand';
import { expandCms } from '@/lib/cms/cmsExpand';
import * as cmsService from '@/services/builder/cmsService';
import { publicPagePath } from '@/lib/publicSiteUrls';

function parseJsonValue(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function collectLinkedGlobalComponentIds(nodes, ids) {
  for (const n of nodes || []) {
    const meta = n?.props?.meta || n?.meta || null;
    if (meta?.globalMode === 'linked' && meta?.globalComponentId) {
      ids.push(Number(meta.globalComponentId));
    }
    if (Array.isArray(n?.children) && n.children.length) {
      collectLinkedGlobalComponentIds(n.children, ids);
    }
  }
}

async function expandNodesWithLinkedGlobals(nodes, projectId) {
  if (!Array.isArray(nodes) || !nodes.length) return nodes;
  const ids = [];
  collectLinkedGlobalComponentIds(nodes, ids);
  const uniq = Array.from(new Set(ids.filter((n) => Number.isInteger(n) && n > 0)));
  if (!uniq.length) return nodes;
  const comps = await getGlobalComponentsByIds(projectId, uniq);
  const map = new Map(comps.map((c) => [c.id, c.snapshot]));
  return expandLinkedGlobalComponents(nodes, (id) => map.get(id) || null);
}

async function expandFrozenGlobalSection(section, projectId) {
  if (!section || typeof section !== 'object') return null;
  const expanded = await expandNodesWithLinkedGlobals([section], projectId);
  return expanded[0] || null;
}

/**
 * Load immutable page_versions snapshot for read-only visual preview.
 * Same data contract as published live (frozen nodes + globalSections).
 */
export async function getVersionPreviewPageState(versionId, pageContext = null) {
  noStore();
  const vid = Number(versionId);
  if (!Number.isInteger(vid) || vid <= 0) return null;

  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT
       pv.id AS version_id,
       pv.page_id,
       pv.version_number,
       pv.status AS version_status,
       pv.snapshot_json,
       pv.created_at AS version_created_at,
       p.title,
       p.slug,
       p.project_id,
       p.published_version_id,
       p.seo_json,
       pr.slug AS project_slug,
       pr.config_json
     FROM page_versions pv
     INNER JOIN pages p ON p.id = pv.page_id
     INNER JOIN projects pr ON pr.id = p.project_id
     WHERE pv.id = ?
       AND pv.status IN ('published', 'archived')
     LIMIT 1`,
    [vid]
  );

  if (!rows.length) return null;
  const row = rows[0];

  let snapshotJson = null;
  let publishedGlobalSections = emptyFrozenGlobalSections();
  if (row.snapshot_json != null) {
    const parsed = parsePublishedSnapshot(row.snapshot_json);
    if (parsed.ok) {
      snapshotJson = parsed.nodes;
      publishedGlobalSections = parsed.globalSections || emptyFrozenGlobalSections();
    }
  }

  const projectConfig = parseJsonValue(row.config_json, {}) || {};
  const pageSeo = parseJsonValue(row.seo_json, {}) || {};

  const [pageRows] = await pool.query(
    `SELECT slug, title FROM pages WHERE project_id = ? ORDER BY created_at ASC, id ASC`,
    [row.project_id]
  );

  if (Array.isArray(snapshotJson) && snapshotJson.length) {
    snapshotJson = await expandNodesWithLinkedGlobals(snapshotJson, row.project_id);
  }

  const configGlobals =
    projectConfig && typeof projectConfig === 'object' && projectConfig.globalSections
      ? projectConfig.globalSections
      : {};
  const headerSource =
    publishedGlobalSections.header ||
    (configGlobals.header && typeof configGlobals.header === 'object' ? configGlobals.header : null);
  const footerSource =
    publishedGlobalSections.footer ||
    (configGlobals.footer && typeof configGlobals.footer === 'object' ? configGlobals.footer : null);

  publishedGlobalSections = {
    header: await expandFrozenGlobalSection(headerSource, row.project_id),
    footer: await expandFrozenGlobalSection(footerSource, row.project_id),
  };

  if (Array.isArray(snapshotJson) && snapshotJson.length) {
    snapshotJson = await expandCms(snapshotJson, {
      projectId: row.project_id,
      cmsService,
      pageContext,
    });
  }

  return {
    version: {
      id: row.version_id,
      pageId: row.page_id,
      versionNumber: row.version_number,
      status: row.version_status,
      createdAt: row.version_created_at,
      isLive: Number(row.published_version_id) === Number(row.version_id),
    },
    page: {
      id: row.page_id,
      title: row.title,
      slug: row.slug,
      projectId: row.project_id,
      projectSlug: row.project_slug,
      seo: pageSeo,
      projectConfig,
    },
    snapshot_json: snapshotJson,
    publishedGlobalSections,
    projectPages: pageRows.map((page) => ({
      slug: page.slug,
      title: page.title,
      href: publicPagePath(row.project_slug, page.slug, { publicSite: true }),
    })),
  };
}
