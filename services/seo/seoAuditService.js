import { getDbPool } from '@/lib/db';
import { publicPagePath } from '@/lib/publicSiteUrls';
import { normalizePageSeo, normalizeProjectSeo } from '@/lib/seo/seoEngine';
import { runSeoAudit } from '@/lib/seo/seoAuditEngine';
import {
  collectInternalLinks,
  extractFirstHeading,
  extractFirstParagraph,
} from '@/lib/seo/seoPageHelpers';
import { runProjectSeoAudit } from '@/services/seo/seoSuiteService';
import { patchProjectPageSeo } from '@/services/seo/seoDashboardService';

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function clampMeta(text, max) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export async function runExtendedSeoAudit(projectId) {
  const base = await runProjectSeoAudit(projectId);
  const pid = Number(projectId);
  const pool = getDbPool();

  const [projRows] = await pool.query(`SELECT slug, config_json FROM projects WHERE id = ?`, [pid]);
  const projectSlug = projRows[0]?.slug;
  const projectConfig = parseJson(projRows[0]?.config_json, {}) || {};
  const projectSeo = normalizeProjectSeo(projectConfig);

  const [pageRows] = await pool.query(
    `SELECT p.id, p.title, p.slug, p.seo_json, p.published_version_id, pv.snapshot_json
     FROM pages p
     LEFT JOIN page_versions pv ON pv.id = p.published_version_id
     WHERE p.project_id = ?`,
    [pid]
  );

  const titleMap = new Map();
  const descMap = new Map();
  const issues = [];
  const passed = [];

  const knownPaths = new Set(pageRows.map((r) => publicPagePath(projectSlug, r.slug)));

  for (const row of pageRows) {
    const pageSeo = normalizePageSeo(parseJson(row.seo_json, {}) || {});
    const tree = parseJson(row.snapshot_json, {})?.nodes || null;
    const title = pageSeo.title || row.title;
    const desc = pageSeo.description || '';

    if (title) {
      const key = title.toLowerCase();
      if (titleMap.has(key)) {
        issues.push({
          id: `dup-title-${row.id}`,
          severity: 'warning',
          category: 'seo',
          label: `Duplicate title with "${titleMap.get(key)}": ${row.slug}`,
          pageId: row.id,
          fixType: 'review-duplicate-title',
        });
      } else titleMap.set(key, row.slug);
    }
    if (desc) {
      const key = desc.toLowerCase();
      if (descMap.has(key)) {
        issues.push({
          id: `dup-desc-${row.id}`,
          severity: 'warning',
          category: 'seo',
          label: `Duplicate description with "${descMap.get(key)}": ${row.slug}`,
          pageId: row.id,
        });
      } else descMap.set(key, row.slug);
    }

    if (pageSeo.sitemapExclude && row.published_version_id) {
      issues.push({
        id: `sitemap-excluded-${row.id}`,
        severity: 'warning',
        category: 'seo',
        label: `Excluded from sitemap: ${row.slug}`,
        pageId: row.id,
      });
    }

    if (Array.isArray(tree)) {
      const links = collectInternalLinks(tree);
      for (const href of links) {
        const normalized = href.split('?')[0].split('#')[0];
        if (normalized && !knownPaths.has(normalized) && !normalized.startsWith('http')) {
          issues.push({
            id: `broken-link-${row.id}-${normalized}`,
            severity: 'critical',
            category: 'seo',
            label: `Broken internal link on ${row.slug}: ${href}`,
            pageId: row.id,
          });
        }
      }
    } else if (!row.published_version_id) {
      passed.push({ id: `draft-${row.id}`, label: `Draft page skipped for tree audit: ${row.slug}` });
    }
  }

  const pageAudits = base.pages || [];
  const allIssues = [
    ...issues,
    ...pageAudits.flatMap((p) =>
      (p.issues || []).map((i, index) => ({
        ...i,
        id: `${i.id}__${String(p.pageName || 'page').replace(/\s+/g, '-')}-${index}`,
        pageName: p.pageName,
        source: 'page',
      }))
    ),
    ...(base.blogs || []).flatMap((b) =>
      (b.issues || []).map((i, index) => ({
        ...i,
        id: `${i.id}__${String(b.pageName || 'blog').replace(/\s+/g, '-')}-${index}`,
        pageName: b.pageName,
        source: 'blog',
      }))
    ),
  ];

  const critical = allIssues.filter((i) => i.severity === 'critical').length;
  const warning = allIssues.filter((i) => i.severity === 'warning').length;

  return {
    ...base,
    extended: true,
    issues: allIssues,
    summary: { critical, warning, passed: passed.length },
    quickFixes: buildQuickFixSuggestions(pageRows, projectConfig, projectSlug, projectSeo),
  };
}

function buildQuickFixSuggestions(pageRows, projectConfig, projectSlug, projectSeo) {
  const fixes = [];
  for (const row of pageRows) {
    const pageSeo = normalizePageSeo(parseJson(row.seo_json, {}) || {});
    const tree = parseJson(row.snapshot_json, {})?.nodes || null;
    if (!pageSeo.title && Array.isArray(tree)) {
      const h1 = extractFirstHeading(tree);
      if (h1) {
        fixes.push({
          type: 'generate-title-from-h1',
          pageId: row.id,
          pageSlug: row.slug,
          suggested: clampMeta(h1, 70),
        });
      }
    }
    if (!pageSeo.description && Array.isArray(tree)) {
      const para = extractFirstParagraph(tree);
      if (para) {
        fixes.push({
          type: 'generate-description-from-paragraph',
          pageId: row.id,
          pageSlug: row.slug,
          suggested: clampMeta(para, 160),
        });
      }
    }
    if (!pageSeo.canonicalUrl && !projectSeo.canonicalDomain) {
      fixes.push({
        type: 'add-canonical-from-slug',
        pageId: row.id,
        pageSlug: row.slug,
        suggested: publicPagePath(projectSlug, row.slug),
      });
    }
    if (!pageSeo.ogImage && projectSeo.defaultOgImage) {
      fixes.push({
        type: 'add-default-og-image',
        pageId: row.id,
        pageSlug: row.slug,
        suggested: projectSeo.defaultOgImage,
      });
    }
    if (pageSeo.noindex || pageSeo.nofollow) {
      fixes.push({ type: 'enable-index-follow', pageId: row.id, pageSlug: row.slug });
    }
    if (!pageSeo.schemaType) {
      fixes.push({ type: 'add-webpage-schema', pageId: row.id, pageSlug: row.slug, suggested: 'WebPage' });
    }
  }
  return fixes;
}

export async function applySeoQuickFix(projectId, payload) {
  const pid = Number(projectId);
  const pageId = Number(payload?.pageId);
  const type = String(payload?.type || '');
  if (!pageId) throw new Error('pageId required');

  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT p.seo_json, p.slug, p.title, pv.snapshot_json, pr.slug AS project_slug, pr.config_json
     FROM pages p
     JOIN projects pr ON pr.id = p.project_id
     LEFT JOIN page_versions pv ON pv.id = p.published_version_id
     WHERE p.id = ? AND p.project_id = ? LIMIT 1`,
    [pageId, pid]
  );
  if (!rows.length) throw new Error('Page not found');

  const row = rows[0];
  const pageSeo = normalizePageSeo(parseJson(row.seo_json, {}) || {});
  const tree = parseJson(row.snapshot_json, {})?.nodes || null;
  const projectConfig = parseJson(row.config_json, {}) || {};
  const projectSeo = normalizeProjectSeo(projectConfig);
  const patch = {};

  switch (type) {
    case 'generate-title-from-h1': {
      const h1 = extractFirstHeading(tree);
      if (!h1) throw new Error('No H1 found on page');
      patch.title = clampMeta(h1, 70);
      break;
    }
    case 'generate-description-from-paragraph': {
      const para = extractFirstParagraph(tree);
      if (!para) throw new Error('No paragraph text found');
      patch.description = clampMeta(para, 160);
      break;
    }
    case 'add-canonical-from-slug':
      patch.canonicalUrl = publicPagePath(row.project_slug, row.slug);
      break;
    case 'add-default-og-image':
      if (!projectSeo.defaultOgImage) throw new Error('No default OG image in project SEO');
      patch.ogImage = projectSeo.defaultOgImage;
      break;
    case 'enable-index-follow':
      patch.noindex = false;
      patch.nofollow = false;
      break;
    case 'add-webpage-schema':
      patch.schemaType = payload?.schemaType || 'WebPage';
      break;
  }

  if (!Object.keys(patch).length) throw new Error('Unknown fix type');
  return patchProjectPageSeo(pid, pageId, patch);
}

export async function applyBulkSeoQuickFix(projectId, fixType) {
  const audit = await runExtendedSeoAudit(projectId);
  const matches = (audit.quickFixes || []).filter((f) => f.type === fixType);
  const results = [];
  for (const fix of matches) {
    try {
      const seo = await applySeoQuickFix(projectId, { type: fix.type, pageId: fix.pageId });
      results.push({ pageId: fix.pageId, ok: true, seo });
    } catch (e) {
      results.push({ pageId: fix.pageId, ok: false, error: e.message });
    }
  }
  return { fixType, count: results.filter((r) => r.ok).length, results };
}
