import { SEO_AUDIT_CATEGORIES, SEO_AUDIT_SEVERITY } from './seoConstants.js';

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function walkNodes(nodes, visit) {
  for (const n of nodes || []) {
    if (!n) continue;
    visit(n);
    if (Array.isArray(n.children) && n.children.length) walkNodes(n.children, visit);
  }
}

function wordCountFromTree(nodes) {
  let words = 0;
  walkNodes(nodes, (node) => {
    if (node?.nodeType === 'text' || node?.nodeType === 'paragraph' || node?.nodeType === 'richText') {
      const t = str(node.props?.text || node.props?.content || '');
      words += t.split(/\s+/).filter(Boolean).length;
    }
  });
  return words;
}

/**
 * Enterprise SEO audit — 0–100 score with categorized issues.
 * Tree audits are optional (builder/publish); metadata-only audits work without tree.
 */
export function runSeoAudit({
  pageName = '',
  pageSeo = {},
  projectSeo = {},
  tree = null,
  links = [],
} = {}) {
  const issues = [];

  const title = str(pageSeo.title);
  const description = str(pageSeo.description);
  const focusKeyword = str(pageSeo.focusKeyword);
  const ogImage = str(pageSeo.ogImage || projectSeo.defaultOgImage);
  const canonical = str(pageSeo.canonicalUrl || projectSeo.canonicalDomain);
  const hasSchema = Boolean(pageSeo.schemaTemplate || pageSeo.schemaJsonLd || pageSeo.schemaType);

  const add = (id, severity, category, label) => {
    issues.push({ id, severity, category, label });
  };

  if (!title) add('missing-title', 'critical', 'seo', 'Missing meta title');
  else if (title.length < 15) add('title-short', 'warning', 'seo', 'Meta title is short');
  else if (title.length > 70) add('title-long', 'warning', 'seo', 'Meta title is long');

  if (!description) add('missing-description', 'critical', 'seo', 'Missing meta description');
  else if (description.length < 50) add('description-short', 'warning', 'seo', 'Meta description is short');
  else if (description.length > 160) add('description-long', 'warning', 'seo', 'Meta description is long');

  if (focusKeyword && title && !title.toLowerCase().includes(focusKeyword.toLowerCase())) {
    add('focus-keyword-title', 'warning', 'seo', 'Focus keyword not in title');
  }
  if (focusKeyword && description && !description.toLowerCase().includes(focusKeyword.toLowerCase())) {
    add('focus-keyword-desc', 'warning', 'seo', 'Focus keyword not in description');
  }

  if (!canonical) add('missing-canonical', 'warning', 'seo', 'Missing canonical URL or domain');
  if (!ogImage) add('missing-og-image', 'warning', 'seo', 'Missing OG image');
  if (!hasSchema) add('missing-schema', 'warning', 'seo', 'Missing structured data (schema)');

  if (pageSeo.noindex) add('noindex', 'warning', 'seo', 'Page set to noindex');
  if (projectSeo.indexingEnabled === false) add('project-noindex', 'critical', 'seo', 'Project indexing disabled');

  if (Array.isArray(tree)) {
    let headingCount = 0;
    let imageCount = 0;
    let missingAlt = 0;
    walkNodes(tree, (node) => {
      if (node?.nodeType === 'heading') headingCount += 1;
      if (node?.nodeType === 'image') {
        imageCount += 1;
        if (!str(node.props?.alt)) missingAlt += 1;
      }
    });

    if (headingCount === 0) add('missing-h1', 'critical', 'content', 'Missing H1 heading');
    if (headingCount > 1) add('multiple-h1', 'warning', 'content', `Multiple H1 headings (${headingCount})`);

    const words = wordCountFromTree(tree);
    if (words === 0) add('empty-content', 'critical', 'content', 'Page has no text content');
    else if (words < 120) add('thin-content', 'warning', 'content', `Thin content (${words} words)`);

    if (missingAlt > 0) add('missing-alt', 'warning', 'accessibility', `Images missing alt text (${missingAlt})`);
    if (imageCount > 8) add('many-images', 'warning', 'performance', `Many images (${imageCount}) — check optimization`);
  }

  for (const link of links || []) {
    if (link?.broken) add(`broken-link-${link.href}`, 'critical', 'seo', `Broken internal link: ${link.href}`);
  }

  const weights = { critical: 12, warning: 6 };
  const penalty = issues.reduce((sum, i) => sum + (weights[i.severity] || 0), 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  const byCategory = Object.fromEntries(SEO_AUDIT_CATEGORIES.map((c) => [c, { critical: 0, warning: 0, passed: 0 }]));
  for (const cat of SEO_AUDIT_CATEGORIES) {
    const catIssues = issues.filter((i) => i.category === cat);
    byCategory[cat].critical = catIssues.filter((i) => i.severity === 'critical').length;
    byCategory[cat].warning = catIssues.filter((i) => i.severity === 'warning').length;
  }

  const passed = Math.max(0, 12 - issues.length);

  return {
    score,
    pageName,
    issues,
    summary: {
      critical: issues.filter((i) => i.severity === 'critical').length,
      warning: issues.filter((i) => i.severity === 'warning').length,
      passed,
    },
    categories: byCategory,
  };
}

export function aggregateProjectSeoAudit(pageAudits = []) {
  const audits = Array.isArray(pageAudits) ? pageAudits : [];
  if (!audits.length) {
    return { score: 0, pages: 0, summary: { critical: 0, warning: 0, passed: 0 }, pageAudits: [] };
  }
  const score = Math.round(audits.reduce((s, a) => s + (a.score || 0), 0) / audits.length);
  const summary = audits.reduce(
    (acc, a) => ({
      critical: acc.critical + (a.summary?.critical || 0),
      warning: acc.warning + (a.summary?.warning || 0),
      passed: acc.passed + (a.summary?.passed || 0),
    }),
    { critical: 0, warning: 0, passed: 0 }
  );
  return { score, pages: audits.length, summary, pageAudits: audits };
}
