import { getDbPool } from '@/lib/db';
import { buildFormSubmissionsCsv } from '@/lib/admin/formSubmissionsCsv';
import { listCollections } from '@/services/builder/cmsService';
import { listGlobalComponents, getGlobalComponent } from '@/services/builder/globalComponentsService';
import { listFormSubmissions } from '@/services/forms/formSubmissionsService';
import { listProjectDomains } from '@/services/platform/domainService';

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeProjectId(projectId) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  return pid;
}

async function loadProjectRow(projectId) {
  const [rows] = await getDbPool().query(
    `SELECT id, name, title, slug, type, config_json, created_at, updated_at
     FROM projects
     WHERE id = ?
     LIMIT 1`,
    [projectId]
  );
  return rows[0] || null;
}

async function loadProjectPages(projectId) {
  const [rows] = await getDbPool().query(
    `SELECT id, project_id, title, slug, status, published_version_id, seo_json, created_at, updated_at
     FROM pages
     WHERE project_id = ?
     ORDER BY created_at ASC, id ASC`,
    [projectId]
  );
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    slug: row.slug,
    status: row.status || 'draft',
    publishedVersionId: row.published_version_id,
    seo: parseJson(row.seo_json, {}) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function loadGlobalComponentSnapshots(projectId) {
  const list = await listGlobalComponents(projectId);
  const snapshots = [];
  for (const item of list) {
    const full = await getGlobalComponent(projectId, item.id);
    if (!full) continue;
    snapshots.push({
      id: full.id,
      type: full.type,
      name: full.name,
      currentRevision: full.currentRevision,
      snapshot: full.snapshot || { nodes: [] },
      linkedPagesCount: full.linkedPagesCount,
      createdAt: full.createdAt,
      updatedAt: full.updatedAt,
    });
  }
  return snapshots;
}

export async function exportProjectJson(projectId) {
  const pid = normalizeProjectId(projectId);
  const projectRow = await loadProjectRow(pid);
  if (!projectRow) return null;

  const pages = await loadProjectPages(pid);
  const domains = await listProjectDomains(pid).catch(() => []);
  const globalComponents = await loadGlobalComponentSnapshots(pid).catch(() => []);

  const configJson = parseJson(projectRow.config_json, {}) || {};
  return {
    exportedAt: new Date().toISOString(),
    exportVersion: 1,
    project: {
      id: projectRow.id,
      name: projectRow.name || projectRow.title,
      slug: projectRow.slug,
      type: projectRow.type || 'website',
      configJson,
      seo: configJson.seo && typeof configJson.seo === 'object' ? configJson.seo : {},
      createdAt: projectRow.created_at,
      updatedAt: projectRow.updated_at,
    },
    pages,
    domains: domains.map((d) => ({
      id: d.id,
      domain: d.domain,
      verified: d.verified,
      isPrimary: d.isPrimary,
      sslStatus: d.sslStatus,
    })),
    globalComponents,
  };
}

export async function exportPageSnapshotsJson(projectId) {
  const pid = normalizeProjectId(projectId);
  const projectRow = await loadProjectRow(pid);
  if (!projectRow) return null;

  const pages = await loadProjectPages(pid);
  const pageIds = pages.map((p) => p.id);
  if (!pageIds.length) {
    return {
      exportedAt: new Date().toISOString(),
      exportVersion: 1,
      projectSlug: projectRow.slug,
      pages: [],
    };
  }

  const [versionRows] = await getDbPool().query(
    `SELECT pv.id, pv.page_id, pv.version_number, pv.status, pv.snapshot_json, pv.created_at,
            p.slug AS page_slug, p.title AS page_title
     FROM page_versions pv
     INNER JOIN pages p ON p.id = pv.page_id
     WHERE p.project_id = ?
     ORDER BY p.id ASC, pv.version_number ASC, pv.id ASC`,
    [pid]
  );

  const byPage = new Map();
  for (const page of pages) {
    byPage.set(page.id, {
      pageId: page.id,
      title: page.title,
      slug: page.slug,
      status: page.status,
      publishedVersionId: page.publishedVersionId,
      versions: [],
    });
  }

  for (const row of versionRows) {
    const entry = byPage.get(row.page_id);
    if (!entry) continue;
    entry.versions.push({
      id: row.id,
      versionNumber: row.version_number,
      status: row.status,
      createdAt: row.created_at,
      snapshot: parseJson(row.snapshot_json, { nodes: [] }) || { nodes: [] },
    });
  }

  return {
    exportedAt: new Date().toISOString(),
    exportVersion: 1,
    projectSlug: projectRow.slug,
    pages: Array.from(byPage.values()),
  };
}

async function loadAllCmsItems(projectId, collectionId) {
  const [rows] = await getDbPool().query(
    `SELECT id, collection_id, title, slug, status, data_json, published_at, created_at, updated_at
     FROM cms_items
     WHERE collection_id = ?
     ORDER BY id ASC`,
    [collectionId]
  );
  return rows.map((row) => ({
    id: row.id,
    collectionId: row.collection_id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    data: parseJson(row.data_json, {}) || {},
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function exportCmsJson(projectId) {
  const pid = normalizeProjectId(projectId);
  const projectRow = await loadProjectRow(pid);
  if (!projectRow) return null;

  const collections = await listCollections(pid);
  const bundles = [];
  for (const collection of collections) {
    const items = await loadAllCmsItems(pid, collection.id);
    bundles.push({
      ...collection,
      items,
    });
  }

  return {
    exportedAt: new Date().toISOString(),
    exportVersion: 1,
    projectSlug: projectRow.slug,
    collections: bundles,
  };
}

export async function exportProjectFormsCsv(projectId, { limit = 5000 } = {}) {
  const pid = normalizeProjectId(projectId);
  const projectRow = await loadProjectRow(pid);
  if (!projectRow) return null;

  const lim = Math.min(Math.max(Number(limit) || 5000, 1), 10_000);
  const rows = await listFormSubmissions({ projectId: pid, pageId: null, formNodeId: null, limit: lim });
  return {
    projectSlug: projectRow.slug,
    csv: buildFormSubmissionsCsv(rows),
    count: rows.length,
  };
}
