import { unstable_noStore as noStore } from 'next/cache';
import { getDbPool } from '@/lib/db';
import { parsePublishedSnapshot } from '@/lib/publishedSnapshot';
import { emptyFrozenGlobalSections } from '@/lib/globalSectionSnapshot';
import { getGlobalComponentsByIds } from '@/services/builder/globalComponentsService';
import { expandLinkedGlobalComponents } from '@/lib/globalComponentExpand';
import { expandCms } from '@/lib/cms/cmsExpand';
import * as cmsService from '@/services/builder/cmsService';
import { publicPagePath } from '@/lib/publicSiteUrls';

/**
 * Data sources (audit):
 * - PUBLIC/LIVE (`getPublishedPageForPublic`): `pages.published_json` first; legacy fallback
 *   `pages.published_version_id` → `page_versions.snapshot_json`.
 *   Page nodes + frozen `globalSections` (header/footer) come from the published snapshot.
 *   If an older publish omitted `globalSections` but the project still has globals configured, we fall back
 *   to `projects.config_json.globalSections` so live matches builder preview (see merge below).
 *   `projectConfig` is also used for siteTheme/SEO.
 * - BUILDER PREVIEW (`getDraftPageForBuilder`): draft nodes + live `projects.config_json.globalSections`.
 * - PUBLISH (`publishDraftToSnapshot`): copies draft nodes + freezes globalSections from project config into snapshot.
 */

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

async function buildPublishedPageFromJsonRow(row, pageContext = null) {
  const pool = getDbPool();
  let snapshotPayload = null;
  try {
    snapshotPayload =
      typeof row.published_json === 'object' ? row.published_json : JSON.parse(row.published_json);
  } catch {
    snapshotPayload = null;
  }
  if (!snapshotPayload) return null;

  let snapshotJson = Array.isArray(snapshotPayload?.nodes)
    ? snapshotPayload.nodes
    : Array.isArray(snapshotPayload)
      ? snapshotPayload
      : null;
  let publishedGlobalSections = emptyFrozenGlobalSections();
  if (snapshotPayload && typeof snapshotPayload === 'object' && snapshotPayload.globalSections) {
    publishedGlobalSections = snapshotPayload.globalSections || emptyFrozenGlobalSections();
  }

  const projectConfig = parseJsonValue(row.config_json, {}) || {};
  const pageSeo = parseJsonValue(row.seo_json, {}) || {};
  const [pageRows] = await pool.query(
    `SELECT slug, title
     FROM pages
     WHERE project_id = ?
     ORDER BY created_at ASC, id ASC`,
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
    snapshotJson = await expandCms(snapshotJson, { projectId: row.project_id, cmsService, pageContext });
  }

  return {
    id: row.id,
    name: row.title,
    slug: row.slug,
    projectId: row.project_id,
    projectSlug: row.project_slug,
    publishedVersionId: null,
    seo: pageSeo,
    snapshot_json: snapshotJson,
    publishedGlobalSections,
    projectConfig,
    projectPages: pageRows.map((page) => ({
      slug: page.slug,
      title: page.title,
      href: publicPagePath(row.project_slug, page.slug, { publicSite: true }),
    })),
  };
}

async function getPublishedPageRaw(projectSlug, pageSlug, pageContext = null) {
  const pool = getDbPool();
  const [jsonRows] = await pool.query(
    `
    SELECT
      p.id,
      p.title,
      p.slug,
      p.project_id,
      p.published_json,
      p.seo_json,
      pr.slug AS project_slug,
      pr.config_json
    FROM pages p
    JOIN projects pr ON pr.id = p.project_id
    WHERE pr.slug = ?
      AND p.slug = ?
      AND p.status = 'published'
      AND p.published_json IS NOT NULL
    LIMIT 1
    `,
    [projectSlug, pageSlug]
  );

  if (jsonRows.length) {
    const row = jsonRows[0];
    return buildPublishedPageFromJsonRow(row, pageContext);
  }

  const [rows] = await pool.query(
    `
    SELECT
      p.id,
      p.title,
      p.slug,
      p.project_id,
      p.published_version_id,
      p.seo_json,
      pr.slug AS project_slug,
      pr.config_json,
      pv.snapshot_json,
      pv.status AS published_version_status
    FROM pages p
    JOIN projects pr ON pr.id = p.project_id
    INNER JOIN page_versions pv ON pv.id = p.published_version_id
    WHERE pr.slug = ?
      AND p.slug = ?
      AND p.published_version_id IS NOT NULL
      AND pv.id = p.published_version_id
      AND pv.status = 'published'
    LIMIT 1
    `,
    [projectSlug, pageSlug]
  );

  if (!rows.length) return null;
  const row = rows[0];

  let snapshotJson = null;
  let publishedGlobalSections = emptyFrozenGlobalSections();
  if (row.snapshot_json != null) {
    try {
      const parsed = parsePublishedSnapshot(row.snapshot_json);
      if (parsed.ok) {
        snapshotJson = parsed.nodes;
        publishedGlobalSections = parsed.globalSections || emptyFrozenGlobalSections();
      }
    } catch {
      snapshotJson = null;
    }
  }

  const projectConfig = parseJsonValue(row.config_json, {}) || {};
  const pageSeo = parseJsonValue(row.seo_json, {}) || {};
  const [pageRows] = await pool.query(
    `SELECT slug, title
     FROM pages
     WHERE project_id = ?
     ORDER BY created_at ASC, id ASC`,
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
    snapshotJson = await expandCms(snapshotJson, { projectId: row.project_id, cmsService, pageContext });
  }

  return {
    id: row.id,
    name: row.title,
    slug: row.slug,
    projectId: row.project_id,
    projectSlug: row.project_slug,
    publishedVersionId: row.published_version_id,
    seo: pageSeo,
    snapshot_json: snapshotJson,
    publishedGlobalSections,
    projectConfig,
    projectPages: pageRows.map((page) => ({
      slug: page.slug,
      title: page.title,
      href: publicPagePath(row.project_slug, page.slug, { publicSite: true }),
    })),
  };
}

/** Public/live routes only — frozen published snapshot; no draft or mutable global fallback. */
export async function getPublishedPageForPublic(projectSlug, pageSlug, pageContext = null) {
  noStore();
  return getPublishedPageRaw(projectSlug, pageSlug, pageContext);
}

/** @deprecated Prefer `getPublishedPageForPublic` for public/live routes. */
export async function getPublishedPage(projectSlug, pageSlug, pageContext = null) {
  return getPublishedPageForPublic(projectSlug, pageSlug, pageContext);
}
