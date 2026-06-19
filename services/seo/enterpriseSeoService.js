import { getDbPool } from '@/lib/db';
import { publicPagePath } from '@/lib/publicSiteUrls';
import { normalizePageSeo, normalizeProjectSeo } from '@/lib/seo/seoEngine';
import {
  aggregateEnterpriseProjectReport,
  runEnterprisePageReport,
} from '@/lib/seo/enterpriseSeoEngine';
import { collectAllInternalLinks } from '@/lib/seo/seoPageHelpers';
import { getProjectSeo } from '@/services/builder/seoService';

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function buildInboundLinkMap(pageRows, projectSlug) {
  const inbound = {};
  const pageByPath = new Map();

  for (const row of pageRows) {
    const path = publicPagePath(projectSlug, row.slug);
    pageByPath.set(path, { id: row.id, slug: row.slug, title: row.title, path });
    inbound[path] = [];
  }

  for (const row of pageRows) {
    const snapshot = parseJson(row.snapshot_json, {}) || {};
    const tree = Array.isArray(snapshot.nodes) ? snapshot.nodes : null;
    if (!tree) continue;
    const fromPath = publicPagePath(projectSlug, row.slug);
    const links = collectAllInternalLinks(tree);
    for (const link of links) {
      const target = link.path.split('?')[0].split('#')[0];
      if (inbound[target] && target !== fromPath) {
        inbound[target].push({ from: fromPath, fromSlug: row.slug, anchor: link.anchor });
      }
    }
  }

  return { inbound, pageByPath };
}

function findDuplicates(pageRows) {
  const titleMap = new Map();
  const descMap = new Map();

  for (const row of pageRows) {
    const pageSeo = normalizePageSeo(parseJson(row.seo_json, {}) || {});
    const title = (pageSeo.title || row.title || '').toLowerCase().trim();
    const desc = (pageSeo.description || '').toLowerCase().trim();
    if (title) {
      if (!titleMap.has(title)) titleMap.set(title, []);
      titleMap.get(title).push(row.slug);
    }
    if (desc) {
      if (!descMap.has(desc)) descMap.set(desc, []);
      descMap.get(desc).push(row.slug);
    }
  }

  const dupTitles = new Map();
  const dupDescs = new Map();
  for (const [k, slugs] of titleMap) {
    if (slugs.length > 1) dupTitles.set(k, slugs);
  }
  for (const [k, slugs] of descMap) {
    if (slugs.length > 1) dupDescs.set(k, slugs);
  }
  return { dupTitles, dupDescs };
}

export async function runEnterpriseSeoSuite(projectId) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');

  const pool = getDbPool();
  const { config } = await getProjectSeo(pid);
  const projectSeo = normalizeProjectSeo(config);

  const [projRows] = await pool.query(`SELECT id, slug, name, title FROM projects WHERE id = ? LIMIT 1`, [pid]);
  if (!projRows.length) throw new Error('Project not found');
  const project = projRows[0];
  const projectSlug = project.slug;

  const [pageRows] = await pool.query(
    `SELECT p.id, p.title, p.slug, p.seo_json, p.status, p.published_version_id, pv.snapshot_json
     FROM pages p
     LEFT JOIN page_versions pv ON pv.id = p.published_version_id
     WHERE p.project_id = ?
     ORDER BY p.updated_at DESC`,
    [pid]
  );

  const allPages = pageRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    path: publicPagePath(projectSlug, row.slug),
    published: Boolean(row.published_version_id),
  }));

  const { inbound } = buildInboundLinkMap(pageRows, projectSlug);
  const { dupTitles, dupDescs } = findDuplicates(pageRows);

  const pageReports = pageRows.map((row) => {
    const pageSeo = normalizePageSeo(parseJson(row.seo_json, {}) || {});
    const snapshot = parseJson(row.snapshot_json, {}) || {};
    const tree = Array.isArray(snapshot.nodes) ? snapshot.nodes : null;
    const pagePath = publicPagePath(projectSlug, row.slug);
    const titleKey = (pageSeo.title || row.title || '').toLowerCase().trim();
    const descKey = (pageSeo.description || '').toLowerCase().trim();
    const duplicateTitles = dupTitles.get(titleKey)?.filter((s) => s !== row.slug) || [];
    const duplicateDescriptions = dupDescs.get(descKey)?.filter((s) => s !== row.slug) || [];

    return runEnterprisePageReport({
      pageId: row.id,
      pageName: row.title || row.slug,
      pageSlug: row.slug,
      pagePath,
      pageSeo,
      projectSeo,
      tree,
      allPages,
      inboundMap: inbound,
      duplicateTitles,
      duplicateDescriptions,
    });
  });

  return aggregateEnterpriseProjectReport(pageReports, {
    projectId: pid,
    projectSlug,
    projectName: project.name || project.title || projectSlug,
  });
}
