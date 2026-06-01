import { getDbPool } from '@/lib/db';
import { runTreeAudits, scoreFromWarnings } from '@/lib/audits/auditEngine';
import { normalizeProjectSeo } from '@/lib/seo/seoEngine';
import { scoreDarkModeHealth, auditHardcodedColors } from '@/scripts/audit-hardcoded-colors.mjs';
import { listProjectDomains } from './domainService.js';

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function getPublishingDashboard() {
  const pool = getDbPool();
  const [projects] = await pool.query(
    `SELECT pr.id, pr.name, pr.slug, pr.config_json, pr.updated_at,
            COUNT(DISTINCT p.id) AS pages_count,
            SUM(CASE WHEN p.status = 'published' THEN 1 ELSE 0 END) AS published_count,
            SUM(CASE WHEN p.status = 'draft' THEN 1 ELSE 0 END) AS draft_count
     FROM projects pr
     LEFT JOIN pages p ON p.project_id = pr.id
     GROUP BY pr.id
     ORDER BY pr.updated_at DESC`
  );

  const [pages] = await pool.query(
    `SELECT p.id, p.project_id, p.title, p.slug, p.status, p.published_version_id, p.updated_at,
            pr.slug AS project_slug, pr.name AS project_name,
            pv.created_at AS last_publish_at
     FROM pages p
     INNER JOIN projects pr ON pr.id = p.project_id
     LEFT JOIN page_versions pv ON pv.id = p.published_version_id
     ORDER BY p.updated_at DESC`
  );

  const projectRows = [];
  for (const row of projects) {
    let domains = [];
    try {
      domains = await listProjectDomains(row.id);
    } catch {
      domains = [];
    }
    const config = parseJson(row.config_json, {});
    const seo = normalizeProjectSeo(config);
    projectRows.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      pagesCount: Number(row.pages_count || 0),
      publishedCount: Number(row.published_count || 0),
      draftCount: Number(row.draft_count || 0),
      canonicalDomain: seo.canonicalDomain,
      domainStatus: domains.some((d) => d.isPrimary && d.verified)
        ? 'verified'
        : domains.length
          ? 'pending'
          : 'none',
      domains,
      updatedAt: row.updated_at,
    });
  }

  const pageRows = await Promise.all(
    pages.map(async (row) => {
      let seoScore = null;
      let auditScore = null;
      if (row.published_version_id) {
        try {
          const [snapRows] = await pool.query(
            `SELECT snapshot_json FROM page_versions WHERE id = ? LIMIT 1`,
            [row.published_version_id]
          );
          const snap = parseJson(snapRows[0]?.snapshot_json, { nodes: [] });
          const tree = Array.isArray(snap?.nodes) ? snap.nodes : [];
          const [projRows] = await pool.query(
            `SELECT config_json FROM projects WHERE id = ? LIMIT 1`,
            [row.project_id]
          );
          const config = parseJson(projRows[0]?.config_json, {});
          const audit = runTreeAudits({ tree, projectConfig: config });
          auditScore = scoreFromWarnings(audit.warnings);
          seoScore = auditScore;
        } catch {
          /* optional scoring */
        }
      }
      return {
        id: row.id,
        projectId: row.project_id,
        projectSlug: row.project_slug,
        projectName: row.project_name,
        title: row.title,
        slug: row.slug,
        status: row.status,
        publishedVersionId: row.published_version_id,
        lastPublishAt: row.last_publish_at,
        seoScore,
        auditScore,
        updatedAt: row.updated_at,
      };
    })
  );

  const contrastFindings = auditHardcodedColors();
  const contrastHealth = scoreDarkModeHealth(contrastFindings);

  return {
    summary: {
      projects: projectRows.length,
      pages: pageRows.length,
      published: pageRows.filter((p) => p.status === 'published').length,
      drafts: pageRows.filter((p) => p.status === 'draft').length,
      platformContrastHealth: contrastHealth,
    },
    projects: projectRows,
    pages: pageRows,
  };
}
