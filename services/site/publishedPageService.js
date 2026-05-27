import { unstable_noStore as noStore } from 'next/cache';
import { getDbPool } from '@/lib/db';
import { parsePublishedSnapshot } from '@/lib/publishedSnapshot';
import { emptyFrozenGlobalSections } from '@/lib/globalSectionSnapshot';
import { getGlobalComponentsByIds } from '@/services/builder/globalComponentsService';
import { expandLinkedGlobalComponents } from '@/lib/globalComponentExpand';
import { expandCms } from '@/lib/cms/cmsExpand';
import * as cmsService from '@/services/builder/cmsService';

/**
 * Data sources (audit):
 * - PUBLIC/LIVE (`getPublishedPageForPublic`): `pages.published_version_id` → `page_versions.snapshot_json` only.
 *   Page nodes + frozen `globalSections` (header/footer) come from published snapshot — never `projects.config_json.globalSections`.
 *   `projectConfig` on live is used for siteTheme/SEO only, not mutable global header/footer.
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

  publishedGlobalSections = {
    header: await expandFrozenGlobalSection(publishedGlobalSections.header, row.project_id),
    footer: await expandFrozenGlobalSection(publishedGlobalSections.footer, row.project_id),
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
      href: `/${row.project_slug}/${page.slug}`,
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
