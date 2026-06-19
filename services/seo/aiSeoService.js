import { getDbPool } from '@/lib/db';
import { publicPagePath } from '@/lib/publicSiteUrls';
import { isGeminiConfigured, geminiGenerateJson } from '@/lib/ai/gemini.js';
import {
  heuristicGenerateTitle,
  heuristicGenerateDescription,
  heuristicGenerateKeywords,
  heuristicGenerateFaqSchema,
  heuristicGenerateSchema,
  buildPageContext,
} from '@/lib/seo/aiSeoHeuristics.js';
import { DISPATCH_PRESET_IDS, getDispatchPreset } from '@/lib/seo/aiSeoPresets.js';
import { normalizePageSeo, normalizeProjectSeo } from '@/lib/seo/seoEngine.js';
import { runEnterpriseSeoSuite } from '@/services/seo/enterpriseSeoService.js';
import { patchProjectPageSeo } from '@/services/seo/seoDashboardService.js';
import { applySeoQuickFix } from '@/services/seo/seoAuditService.js';
import { collectImageNodes } from '@/lib/seo/seoPageHelpers.js';
import { ensureAbsoluteUrl, resolveSiteOrigin } from '@/lib/seo/absoluteUrl.js';

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function resolveOgImageForPage(loaded) {
  const pageOg = String(loaded.pageSeo?.ogImage || '').trim();
  if (pageOg) return pageOg;
  const projectOg = String(loaded.projectSeo?.defaultOgImage || '').trim();
  if (projectOg) return projectOg;
  const images = collectImageNodes(loaded.tree || []);
  const fromPage = images.map((img) => String(img.src || '').trim()).find(Boolean);
  return fromPage || null;
}

async function loadPageContext(projectId, pageId) {
  const pid = Number(projectId);
  const id = Number(pageId);
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT p.id, p.title, p.slug, p.seo_json, pv.snapshot_json, pr.slug AS project_slug, pr.config_json
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
    pagePath: publicPagePath(row.project_slug, row.slug),
    projectSeo,
    pageSeo,
    tree,
    projectConfig,
  };
}

async function aiGenerateWithGemini(type, ctx, options = {}) {
  const preset = options.presetId ? getDispatchPreset(options.presetId) : null;
  const presetHint = preset
    ? `Industry preset: ${options.presetId}. Use terms like: ${[...preset.focusKeywords, ...preset.secondary].join(', ')}.`
    : '';

  const basePrompt = `You are an expert SEO copywriter for a logistics/shipping SaaS (Dispatch).
Page: ${ctx.pageName} (/${ctx.pageSlug})
Site: ${ctx.siteName}
H1: ${ctx.h1 || '(none)'}
Content excerpt: ${ctx.bodyExcerpt || '(empty)'}
${presetHint}

Return JSON only.`;

  switch (type) {
    case 'title': {
      const data = await geminiGenerateJson({
        systemInstruction: 'Write concise SEO titles 50-65 characters. Return {"title":"..."}',
        prompt: `${basePrompt}\nGenerate one SEO title.`,
        json: true,
      });
      return { title: String(data.title || '').trim() };
    }
    case 'description': {
      const data = await geminiGenerateJson({
        systemInstruction: 'Write meta descriptions exactly 120-160 characters. Return {"description":"..."}',
        prompt: `${basePrompt}\nGenerate meta description 120-160 chars.`,
        json: true,
      });
      return { description: String(data.description || '').trim() };
    }
    case 'keywords': {
      const data = await geminiGenerateJson({
        systemInstruction:
          'Return {"focusKeyword":"...","secondaryKeywords":["..."],"longTailKeywords":["..."]}',
        prompt: `${basePrompt}\nGenerate focus, secondary (4-6), and long-tail (4-6) keywords.`,
        json: true,
      });
      return {
        focusKeyword: String(data.focusKeyword || '').trim(),
        secondaryKeywords: Array.isArray(data.secondaryKeywords) ? data.secondaryKeywords.map(String) : [],
        longTailKeywords: Array.isArray(data.longTailKeywords) ? data.longTailKeywords.map(String) : [],
      };
    }
    case 'faq': {
      const data = await geminiGenerateJson({
        systemInstruction:
          'Return FAQ JSON-LD schema.org FAQPage as {"schema":{...}} with 3-5 Q&A from page content.',
        prompt: `${basePrompt}\nGenerate FAQPage schema from content.`,
        json: true,
      });
      return { schema: data.schema || data };
    }
    case 'schema': {
      const schemaType = options.schemaType || 'WebPage';
      const data = await geminiGenerateJson({
        systemInstruction: `Return schema.org JSON-LD with tokens {{title}}, {{description}}, {{url}}, {{siteTitle}}. Format: {"schema":{...}}`,
        prompt: `${basePrompt}\nGenerate ${schemaType} schema.`,
        json: true,
      });
      return { schemaType, schema: data.schema || data };
    }
    default:
      throw new Error(`Unknown AI generate type: ${type}`);
  }
}

function heuristicGenerate(type, ctx, options = {}) {
  const args = {
    pageName: ctx.pageName,
    pageSlug: ctx.pageSlug,
    siteName: ctx.siteName,
    tree: ctx.tree,
    focusKeyword: ctx.focusKeyword,
    presetId: options.presetId,
  };

  switch (type) {
    case 'title':
      return { title: heuristicGenerateTitle(args) };
    case 'description':
      return { description: heuristicGenerateDescription(args) };
    case 'keywords': {
      const kw = heuristicGenerateKeywords(args);
      return kw;
    }
    case 'faq':
      return { schema: heuristicGenerateFaqSchema({ pageName: ctx.pageName, tree: ctx.tree }) };
    case 'schema': {
      const schemaType = options.schemaType || 'WebPage';
      return {
        schemaType,
        schema: heuristicGenerateSchema({ schemaType, pageName: ctx.pageName }),
      };
    }
    default:
      throw new Error(`Unknown generate type: ${type}`);
  }
}

export async function generateAiSeoContent(projectId, pageId, type, options = {}) {
  const loaded = await loadPageContext(projectId, pageId);
  const ctx = buildPageContext({
    pageName: loaded.pageName,
    pageSlug: loaded.pageSlug,
    siteName: loaded.projectSeo.siteTitle,
    tree: loaded.tree,
    projectSeo: loaded.projectSeo,
    pageSeo: loaded.pageSeo,
  });

  let result;
  let source = 'heuristic';

  if (isGeminiConfigured()) {
    try {
      result = await aiGenerateWithGemini(type, ctx, options);
      source = 'gemini';
    } catch {
      result = heuristicGenerate(type, ctx, options);
      source = 'heuristic-fallback';
    }
  } else {
    result = heuristicGenerate(type, ctx, options);
  }

  return { type, source, geminiAvailable: isGeminiConfigured(), pageId, ...result };
}

export async function applyAiSeoFix(projectId, pageId, fixType, options = {}) {
  const loaded = await loadPageContext(projectId, pageId);
  const patch = {};
  const presetId = options.presetId || (loaded.pageSeo.focusKeyword ? null : 'shipping');
  const schemaType = options.schemaType || loaded.pageSeo.schemaType || 'WebPage';

  switch (fixType) {
    case 'missing-title':
    case 'title': {
      const gen = await generateAiSeoContent(projectId, pageId, 'title', { presetId });
      if (!String(gen.title || '').trim()) {
        throw new Error('Could not generate title — add page content or set a title manually.');
      }
      patch.title = gen.title;
      break;
    }
    case 'missing-description':
    case 'description': {
      const gen = await generateAiSeoContent(projectId, pageId, 'description', { presetId });
      if (!String(gen.description || '').trim()) {
        throw new Error('Could not generate description — add paragraph text on the page first.');
      }
      patch.description = gen.description;
      break;
    }
    case 'missing-canonical':
    case 'canonical':
      patch.canonicalUrl = ensureAbsoluteUrl(
        resolveSiteOrigin(loaded.projectSeo),
        loaded.pageSeo.canonicalUrl || loaded.pagePath
      );
      break;
    case 'missing-schema':
    case 'schema': {
      const gen = await generateAiSeoContent(projectId, pageId, 'schema', { schemaType });
      if (!gen.schema || typeof gen.schema !== 'object') {
        throw new Error('Could not generate schema template.');
      }
      patch.schemaType = gen.schemaType || schemaType;
      patch.schemaTemplate = gen.schema;
      break;
    }
    case 'missing-og-image':
    case 'og-image': {
      const ogImage = resolveOgImageForPage(loaded);
      if (!ogImage) {
        throw new Error(
          'No OG image available. Set Default OG image in SEO → Project Defaults, or add an image widget on this page.'
        );
      }
      patch.ogImage = ogImage;
      break;
    }
    case 'keywords': {
      const gen = await generateAiSeoContent(projectId, pageId, 'keywords', { presetId });
      if (!String(gen.focusKeyword || '').trim()) {
        throw new Error('Could not generate keywords.');
      }
      patch.focusKeyword = gen.focusKeyword;
      patch.secondaryKeywords = gen.secondaryKeywords || [];
      if (Array.isArray(gen.longTailKeywords) && gen.longTailKeywords.length) {
        const merged = [...new Set([...(gen.secondaryKeywords || []), ...gen.longTailKeywords])];
        patch.secondaryKeywords = merged;
      }
      break;
    }
    case 'faq': {
      const gen = await generateAiSeoContent(projectId, pageId, 'faq', { presetId });
      if (!gen.schema || typeof gen.schema !== 'object') {
        throw new Error('Could not generate FAQ schema.');
      }
      patch.schemaType = 'FAQ';
      patch.schemaTemplate = gen.schema;
      break;
    }
    default:
      return applySeoQuickFix(projectId, { pageId, type: fixType });
  }

  if (!Object.keys(patch).length) throw new Error('No fix applied');
  const seo = await patchProjectPageSeo(projectId, pageId, patch);
  return { fixType, pageId, seo, patch, source: isGeminiConfigured() ? 'ai' : 'heuristic' };
}

export async function runBulkAiOptimization(projectId, operation, options = {}) {
  const suite = await runEnterpriseSeoSuite(projectId);
  const pages = suite.pages || [];
  const results = [];

  for (const page of pages) {
    const issues = page.issues || [];
    const fixTypes = [];

    if (operation === 'titles' || operation === 'all') {
      if (issues.some((i) => i.id === 'missing-title')) fixTypes.push('title');
    }
    if (operation === 'descriptions' || operation === 'all') {
      if (issues.some((i) => i.id === 'missing-description' || i.id === 'missing-desc')) {
        fixTypes.push('description');
      }
    }
    if (operation === 'schemas' || operation === 'all') {
      if (issues.some((i) => i.id === 'missing-schema')) fixTypes.push('schema');
    }

    for (const fixType of fixTypes) {
      try {
        const r = await applyAiSeoFix(projectId, page.pageId, fixType, {
          presetId: options?.presetId,
          schemaType: options?.schemaType,
        });
        results.push({ pageId: page.pageId, pageSlug: page.pageSlug, ok: true, fixType, source: r.source });
      } catch (e) {
        results.push({
          pageId: page.pageId,
          pageSlug: page.pageSlug,
          ok: false,
          fixType,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  return {
    operation,
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    results,
    geminiAvailable: isGeminiConfigured(),
  };
}

export async function getAiContentSuggestions(projectId, pageId = null) {
  const suite = await runEnterpriseSeoSuite(projectId);
  const page = pageId
    ? (suite.pages || []).find((p) => p.pageId === Number(pageId))
    : suite.pages?.[0];

  if (!page) {
    return { suggestions: [], presets: DISPATCH_PRESET_IDS, geminiAvailable: isGeminiConfigured() };
  }

  const kw = page.modules?.keywords;
  const links = page.modules?.links;
  const presetId = kw?.focusKeyword?.toLowerCase().includes('ship') ? 'shipping' : 'logistics';
  const preset = getDispatchPreset(presetId);

  const suggestions = {
    relatedKeywords: [
      ...(preset?.secondary || []),
      ...(kw?.secondaryKeywords || []),
      ...(preset?.longTail || []).slice(0, 3),
    ].filter((v, i, a) => a.indexOf(v) === i),
    internalLinkSuggestions: (links?.suggestions || []).map((s) => s.label),
    faqSuggestions: [
      'How does multi-carrier shipping work?',
      'What is NDR and how to reduce RTO?',
      'How to integrate Shopify with Dispatch?',
    ],
    blogTopics: [
      `${preset?.label || 'Shipping'} guide for ecommerce brands`,
      'How to reduce RTO with NDR automation',
      'COD vs prepaid: conversion strategies',
      'Warehouse fulfillment checklist 2026',
    ],
    presetId,
    presets: DISPATCH_PRESET_IDS,
  };

  if (isGeminiConfigured() && page.modules?.content?.bodyExcerpt !== undefined) {
    try {
      const loaded = await loadPageContext(projectId, page.pageId);
      const ctx = buildPageContext({
        pageName: loaded.pageName,
        pageSlug: loaded.pageSlug,
        siteName: loaded.projectSeo.siteTitle,
        tree: loaded.tree,
        projectSeo: loaded.projectSeo,
        pageSeo: loaded.pageSeo,
      });
      const data = await geminiGenerateJson({
        prompt: `Page: ${ctx.pageName}. Content: ${ctx.bodyExcerpt}. Suggest SEO improvements.`,
        systemInstruction:
          'Return {"relatedKeywords":[],"internalLinkSuggestions":[],"faqSuggestions":[],"blogTopics":[]} — 4 items each max, logistics/shipping context.',
        json: true,
      });
      if (Array.isArray(data.relatedKeywords) && data.relatedKeywords.length) {
        suggestions.relatedKeywords = data.relatedKeywords;
      }
      if (Array.isArray(data.internalLinkSuggestions)) suggestions.internalLinkSuggestions = data.internalLinkSuggestions;
      if (Array.isArray(data.faqSuggestions)) suggestions.faqSuggestions = data.faqSuggestions;
      if (Array.isArray(data.blogTopics)) suggestions.blogTopics = data.blogTopics;
      suggestions.source = 'gemini';
    } catch {
      suggestions.source = 'heuristic';
    }
  } else {
    suggestions.source = 'heuristic';
  }

  return {
    pageId: page.pageId,
    pageSlug: page.pageSlug,
    geminiAvailable: isGeminiConfigured(),
    ...suggestions,
  };
}

export function getAiSeoStatus() {
  return {
    geminiConfigured: isGeminiConfigured(),
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    presets: DISPATCH_PRESET_IDS,
  };
}
