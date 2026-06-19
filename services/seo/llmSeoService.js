import { getDbPool } from '@/lib/db';
import { publicPagePath } from '@/lib/publicSiteUrls';
import { normalizePageSeo, normalizeProjectSeo } from '@/lib/seo/seoEngine';
import { aggregateLlmProjectReport, runLlmPageReport } from '@/lib/seo/llmSeoEngine';
import { generateLlmAnswerBlocks } from '@/lib/seo/llmAnswerGenerator';
import { isGeminiConfigured, geminiGenerateJson } from '@/lib/ai/gemini.js';
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

export async function runLlmSeoSuite(projectId) {
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
    `SELECT p.id, p.title, p.slug, p.seo_json, pv.snapshot_json
     FROM pages p
     LEFT JOIN page_versions pv ON pv.id = p.published_version_id
     WHERE p.project_id = ?
     ORDER BY p.updated_at DESC`,
    [pid]
  );

  const pageReports = pageRows.map((row) => {
    const pageSeo = normalizePageSeo(parseJson(row.seo_json, {}) || {});
    const snapshot = parseJson(row.snapshot_json, {}) || {};
    const tree = Array.isArray(snapshot.nodes) ? snapshot.nodes : null;
    return runLlmPageReport({
      pageId: row.id,
      pageName: row.title || row.slug,
      pageSlug: row.slug,
      pagePath: publicPagePath(projectSlug, row.slug),
      pageSeo,
      projectSeo,
      tree,
    });
  });

  return aggregateLlmProjectReport(pageReports, {
    projectId: pid,
    projectSlug,
    projectName: project.name || project.title || projectSlug,
    geminiAvailable: isGeminiConfigured(),
  });
}

async function loadPageContext(projectId, pageId) {
  const pid = Number(projectId);
  const id = Number(pageId);
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT p.id, p.title, p.slug, p.seo_json, pv.snapshot_json, pr.config_json
     FROM pages p
     JOIN projects pr ON pr.id = p.project_id
     LEFT JOIN page_versions pv ON pv.id = p.published_version_id
     WHERE p.id = ? AND p.project_id = ? LIMIT 1`,
    [id, pid]
  );
  if (!rows.length) throw new Error('Page not found');
  const row = rows[0];
  const projectConfig = parseJson(row.config_json, {}) || {};
  const projectSeo = normalizeProjectSeo(projectConfig);
  const pageSeo = normalizePageSeo(parseJson(row.seo_json, {}) || {});
  const snapshot = parseJson(row.snapshot_json, {}) || {};
  const tree = Array.isArray(snapshot.nodes) ? snapshot.nodes : [];
  return {
    pageId: id,
    pageName: row.title || row.slug,
    pageSlug: row.slug,
    projectSeo,
    pageSeo,
    tree,
  };
}

export async function generateLlmSeoBlocks(projectId, pageId, type) {
  const loaded = await loadPageContext(projectId, pageId);
  const args = {
    type,
    pageName: loaded.pageName,
    pageSlug: loaded.pageSlug,
    siteName: loaded.projectSeo.siteTitle,
    tree: loaded.tree,
    focusKeyword: loaded.pageSeo.focusKeyword,
  };

  if (isGeminiConfigured()) {
    try {
      const data = await geminiGenerateJson({
        systemInstruction:
          'Return JSON for LLM/GEO content. Format: {"blocks":[{"heading":"...","body":"..."}]} or FAQ: {"blocks":[{"question":"...","answer":"..."}]}',
        prompt: `Generate ${type} blocks for page "${loaded.pageName}" (${loaded.pageSlug}). Logistics/shipping context. 3-4 items.`,
        json: true,
      });
      if (Array.isArray(data.blocks) && data.blocks.length) {
        return { type, source: 'gemini', blocks: data.blocks, pageId };
      }
    } catch {
      /* fallback */
    }
  }

  const result = generateLlmAnswerBlocks(args);
  return { ...result, pageId };
}

export function getLlmSeoStatus() {
  return {
    geminiConfigured: isGeminiConfigured(),
    platforms: ['chatgpt', 'gemini', 'claude', 'perplexity', 'copilot'],
  };
}

export async function applyLlmFaqSchema(projectId, pageId, schema) {
  const { patchProjectPageSeo } = await import('@/services/seo/seoDashboardService');
  if (!schema || typeof schema !== 'object') throw new Error('Valid FAQ schema required');
  return patchProjectPageSeo(Number(projectId), Number(pageId), {
    schemaType: 'FAQ',
    schemaTemplate: schema,
  });
}
