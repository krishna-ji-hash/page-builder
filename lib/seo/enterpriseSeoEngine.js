import { runSeoAudit } from './seoAuditEngine.js';
import {
  walkTreeNodes,
  extractFirstHeading,
  extractFirstParagraph,
  extractBodyText,
  collectImageNodes,
  collectAllInternalLinks,
  analyzeHeadingHierarchy,
  countWords,
  keywordDensity,
} from './seoPageHelpers.js';

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function safeLower(v) {
  return str(v).toLowerCase();
}

function includesKeyword(text, keyword) {
  const k = safeLower(keyword).trim();
  const t = safeLower(text);
  return Boolean(k && t.includes(k));
}

function slugifyKeyword(keyword) {
  return safeLower(keyword).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function issue(id, severity, category, label, extra = {}) {
  return { id, severity, category, label, ...extra };
}

const SCORE_WEIGHTS = { critical: 12, warning: 6, passed: 0 };

/**
 * Keyword Intelligence — focus/secondary placement, density, URL/H1/first-paragraph checks.
 */
export function runKeywordIntelligence({ pageSeo = {}, tree, pageSlug = '', pagePath = '' }) {
  const focus = str(pageSeo.focusKeyword).trim();
  const secondary = Array.isArray(pageSeo.secondaryKeywords) ? pageSeo.secondaryKeywords : [];
  const allKeywords = [focus, ...secondary].map((k) => str(k).trim()).filter(Boolean);
  const bodyText = extractBodyText(tree);
  const h1 = extractFirstHeading(tree);
  const firstPara = extractFirstParagraph(tree);
  const title = str(pageSeo.title);
  const description = str(pageSeo.description);
  const urlTarget = pagePath || pageSlug;

  const checks = [];
  const issues = [];

  if (!focus) {
    issues.push(issue('kw-missing-focus', 'warning', 'keywords', 'No focus keyword set'));
  } else {
    checks.push({
      id: 'focus-set',
      label: 'Focus keyword defined',
      status: 'passed',
      value: focus,
    });

    const placements = [
      { id: 'kw-in-title', label: 'Keyword in SEO title', ok: includesKeyword(title, focus), target: title },
      { id: 'kw-in-desc', label: 'Keyword in meta description', ok: includesKeyword(description, focus), target: description },
      { id: 'kw-in-h1', label: 'Keyword in H1', ok: includesKeyword(h1, focus), target: h1 },
      { id: 'kw-in-first-para', label: 'Keyword in first paragraph', ok: includesKeyword(firstPara, focus), target: firstPara },
      { id: 'kw-in-url', label: 'Keyword in URL slug', ok: includesKeyword(urlTarget, focus) || includesKeyword(slugifyKeyword(focus), urlTarget), target: urlTarget },
    ];

    for (const p of placements) {
      checks.push({ ...p, status: p.ok ? 'passed' : 'warning' });
      if (!p.ok) {
        issues.push(issue(p.id, 'warning', 'keywords', `Focus keyword missing: ${p.label}`));
      }
    }

    const density = keywordDensity(bodyText, focus);
    checks.push({
      id: 'kw-density',
      label: 'Focus keyword density',
      status: density.density > 3 ? 'warning' : density.occurrences > 0 ? 'passed' : 'warning',
      value: `${density.density}% (${density.occurrences}×)`,
      density: density.density,
      occurrences: density.occurrences,
    });
    if (density.occurrences === 0 && bodyText.length > 80) {
      issues.push(issue('kw-not-in-body', 'warning', 'keywords', 'Focus keyword not found in page body'));
    }
    if (density.density > 3.5) {
      issues.push(issue('kw-stuffing', 'warning', 'keywords', `Keyword density high (${density.density}%)`));
    }
  }

  for (const kw of secondary) {
    if (!includesKeyword(title, kw) && !includesKeyword(description, kw) && !includesKeyword(bodyText, kw)) {
      issues.push(issue(`kw-secondary-missing-${kw}`, 'warning', 'keywords', `Secondary keyword not used: ${kw}`));
    }
  }

  return {
    focusKeyword: focus,
    secondaryKeywords: secondary,
    allKeywords,
    checks,
    issues,
    density: focus ? keywordDensity(bodyText, focus) : null,
  };
}

/**
 * Content Audit — word count, reading time, headings, paragraph length, duplicates.
 */
export function runContentAudit({ tree, pageSeo = {}, duplicateTitles = [], duplicateDescriptions = [] }) {
  const bodyText = extractBodyText(tree);
  const words = countWords(bodyText);
  const readingTimeMin = Math.max(1, Math.ceil(words / 200));
  const headings = analyzeHeadingHierarchy(tree);
  const issues = [];
  const checks = [];

  checks.push({
    id: 'word-count',
    label: 'Word count',
    status: words === 0 ? 'critical' : words < 120 ? 'warning' : 'passed',
    value: words,
  });
  checks.push({
    id: 'reading-time',
    label: 'Reading time',
    status: 'passed',
    value: `${readingTimeMin} min`,
  });

  if (words === 0) issues.push(issue('content-empty', 'critical', 'content', 'No text content on page'));
  else if (words < 120) issues.push(issue('content-thin', 'warning', 'content', `Thin content (${words} words)`));

  if (headings.h1Count === 0) {
    issues.push(issue('content-no-h1', 'critical', 'content', 'Missing H1'));
    checks.push({ id: 'h1', label: 'H1 present', status: 'critical', value: 0 });
  } else {
    checks.push({
      id: 'h1',
      label: 'H1 count',
      status: headings.h1Count > 1 ? 'warning' : 'passed',
      value: headings.h1Count,
    });
    if (headings.h1Count > 1) {
      issues.push(issue('content-multi-h1', 'warning', 'content', `Multiple H1 headings (${headings.h1Count})`));
    }
  }

  if (headings.skippedLevels.length) {
    issues.push(
      issue('content-heading-skip', 'warning', 'content', `Heading hierarchy skip: ${headings.skippedLevels.join(', ')}`)
    );
  }

  checks.push({
    id: 'heading-structure',
    label: 'Heading structure',
    status: headings.skippedLevels.length ? 'warning' : 'passed',
    value: headings.outline.slice(0, 8).map((h) => `H${h.level}`).join(' → ') || '—',
    outline: headings.outline,
  });

  for (const para of headings.longParagraphs.slice(0, 5)) {
    issues.push(
      issue(`content-long-para-${para.nodeId}`, 'warning', 'content', `Long paragraph (${para.words} words)`)
    );
  }

  if (duplicateTitles.length) {
    issues.push(issue('content-dup-title', 'warning', 'content', `Duplicate title: ${duplicateTitles.join(', ')}`));
  }
  if (duplicateDescriptions.length) {
    issues.push(issue('content-dup-desc', 'warning', 'content', `Duplicate description: ${duplicateDescriptions.join(', ')}`));
  }

  return {
    wordCount: words,
    readingTimeMinutes: readingTimeMin,
    headings,
    checks,
    issues,
  };
}

/**
 * Image SEO — alt, title, large image heuristics.
 */
export function runImageSeoAudit({ tree }) {
  const images = collectImageNodes(tree);
  const issues = [];
  const missingAlt = images.filter((img) => !img.alt);
  const missingTitle = images.filter((img) => !img.title);
  const largeImages = images.filter((img) => img.large);

  if (missingAlt.length) {
    issues.push(
      issue('img-missing-alt', 'warning', 'images', `Missing alt text (${missingAlt.length}/${images.length})`, {
        nodes: missingAlt,
      })
    );
  }
  if (missingTitle.length) {
    issues.push(issue('img-missing-title', 'warning', 'images', `Missing title attribute (${missingTitle.length})`));
  }
  if (largeImages.length) {
    issues.push(issue('img-large', 'warning', 'images', `Possibly large images (${largeImages.length})`));
  }

  return {
    total: images.length,
    missingAlt: missingAlt.length,
    missingTitle: missingTitle.length,
    largeCount: largeImages.length,
    images,
    missingAltNodes: missingAlt,
    issues,
    checks: [
      { id: 'img-total', label: 'Total images', status: 'passed', value: images.length },
      {
        id: 'img-alt',
        label: 'Alt text coverage',
        status: missingAlt.length ? 'warning' : 'passed',
        value: images.length ? `${images.length - missingAlt.length}/${images.length}` : '—',
      },
    ],
  };
}

/**
 * Internal linking — outbound, broken, orphans, suggestions.
 */
export function runInternalLinkAudit({
  pageId,
  pageSlug,
  pagePath,
  tree,
  allPages = [],
  inboundMap = {},
}) {
  const outbound = collectAllInternalLinks(tree);
  const knownPaths = new Set(allPages.map((p) => p.path));
  const broken = [];
  const suggestions = [];

  for (const link of outbound) {
    const normalized = link.path.split('?')[0].split('#')[0];
    if (normalized && !knownPaths.has(normalized) && !normalized.startsWith('http')) {
      broken.push({ href: link.href, path: normalized, anchor: link.anchor });
    }
  }

  const inbound = inboundMap[pagePath] || [];
  const isOrphan = inbound.length === 0 && pageSlug !== 'home' && allPages.length > 1;

  const related = allPages
    .filter((p) => p.id !== pageId && p.path !== pagePath)
    .filter((p) => {
      const slugWords = safeLower(pageSlug).split(/[-_]+/);
      const otherWords = safeLower(p.slug).split(/[-_]+/);
      return slugWords.some((w) => w.length > 3 && otherWords.includes(w));
    })
    .slice(0, 5)
    .map((p) => ({ slug: p.slug, path: p.path, title: p.title }));

  if (isOrphan) {
    suggestions.push({ type: 'orphan', label: 'No inbound internal links — add links from related pages', related });
  }
  for (const p of related) {
    if (!outbound.some((l) => l.path === p.path)) {
      suggestions.push({
        type: 'link-suggestion',
        label: `Link to related page: ${p.title}`,
        targetPath: p.path,
        targetSlug: p.slug,
      });
    }
  }

  const issues = [];
  for (const b of broken) {
    issues.push(
      issue(`link-broken-${b.path}`, 'critical', 'links', `Broken internal link: ${b.href}`, { anchor: b.anchor })
    );
  }
  if (isOrphan) {
    issues.push(issue('link-orphan', 'warning', 'links', 'Orphan page (no inbound internal links)'));
  }

  return {
    outboundCount: outbound.length,
    inboundCount: inbound.length,
    inboundFrom: inbound,
    broken,
    isOrphan,
    suggestions: suggestions.slice(0, 8),
    issues,
    checks: [
      { id: 'outbound', label: 'Outbound internal links', status: 'passed', value: outbound.length },
      {
        id: 'inbound',
        label: 'Inbound internal links',
        status: isOrphan ? 'warning' : 'passed',
        value: inbound.length,
      },
      {
        id: 'broken',
        label: 'Broken links',
        status: broken.length ? 'critical' : 'passed',
        value: broken.length,
      },
    ],
  };
}

/**
 * Enterprise page score — merges base SEO audit + module issues.
 */
export function computeEnterprisePageScore({ baseAudit, moduleIssues = [] }) {
  const merged = [...(baseAudit?.issues || []), ...moduleIssues];
  const seen = new Set();
  const unique = [];
  for (const i of merged) {
    const key = i.id;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(i);
  }

  const critical = unique.filter((i) => i.severity === 'critical');
  const warning = unique.filter((i) => i.severity === 'warning');
  const passed = unique.filter((i) => i.severity === 'passed');

  const penalty = unique.reduce((sum, i) => sum + (SCORE_WEIGHTS[i.severity] ?? 0), 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    score,
    summary: { critical: critical.length, warning: warning.length, passed: passed.length },
    issues: unique,
    critical,
    warning,
    passed: passed.length,
  };
}

/**
 * Full enterprise page report.
 */
export function runEnterprisePageReport({
  pageId,
  pageName,
  pageSlug,
  pagePath,
  pageSeo,
  projectSeo,
  tree,
  allPages = [],
  inboundMap = {},
  duplicateTitles = [],
  duplicateDescriptions = [],
}) {
  const baseAudit = runSeoAudit({ pageName, pageSeo, projectSeo, tree });
  const keywords = runKeywordIntelligence({ pageSeo, tree, pageSlug, pagePath });
  const content = runContentAudit({ tree, pageSeo, duplicateTitles, duplicateDescriptions });
  const images = runImageSeoAudit({ tree });
  const links = runInternalLinkAudit({
    pageId,
    pageSlug,
    pagePath,
    tree,
    allPages,
    inboundMap,
  });

  const moduleIssues = [...keywords.issues, ...content.issues, ...images.issues, ...links.issues];
  const scoring = computeEnterprisePageScore({ baseAudit, moduleIssues });

  return {
    pageId,
    pageName,
    pageSlug,
    pagePath,
    score: scoring.score,
    summary: scoring.summary,
    issues: scoring.issues,
    modules: {
      keywords,
      content,
      images,
      links,
      base: baseAudit,
    },
  };
}

/**
 * Project-wide aggregation + dashboard widgets.
 */
export function aggregateEnterpriseProjectReport(pageReports = [], projectMeta = {}) {
  const pages = Array.isArray(pageReports) ? pageReports : [];
  if (!pages.length) {
    return {
      projectScore: 0,
      summary: { critical: 0, warning: 0, passed: 0 },
      widgets: {},
      pages: [],
      topIssues: [],
    };
  }

  const projectScore = Math.round(pages.reduce((s, p) => s + (p.score || 0), 0) / pages.length);
  const summary = pages.reduce(
    (acc, p) => ({
      critical: acc.critical + (p.summary?.critical || 0),
      warning: acc.warning + (p.summary?.warning || 0),
      passed: acc.passed + (p.summary?.passed || 0),
    }),
    { critical: 0, warning: 0, passed: 0 }
  );

  const issueCounts = new Map();
  for (const p of pages) {
    for (const i of p.issues || []) {
      if (i.severity === 'passed') continue;
      const key = i.id.replace(/-\d+$/, '').replace(/__.*$/, '');
      issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
    }
  }

  const topIssues = [...issueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  const indexedPages = pages.filter((p) => !p.modules?.base?.issues?.some((i) => i.id === 'noindex')).length;
  const missingMetadata = pages.filter((p) =>
    p.issues?.some((i) => i.id === 'missing-title' || i.id === 'missing-description')
  ).length;
  const missingSchema = pages.filter((p) => p.issues?.some((i) => i.id === 'missing-schema')).length;
  const missingAlt = pages.reduce((s, p) => s + (p.modules?.images?.missingAlt || 0), 0);
  const orphanPages = pages.filter((p) => p.modules?.links?.isOrphan).length;
  const brokenLinks = pages.reduce((s, p) => s + (p.modules?.links?.broken?.length || 0), 0);

  return {
    ...projectMeta,
    projectScore,
    summary,
    pages,
    topIssues,
    widgets: {
      indexedPages,
      totalPages: pages.length,
      missingMetadata,
      missingSchema,
      missingAlt,
      orphanPages,
      brokenLinks,
      averageWordCount: Math.round(
        pages.reduce((s, p) => s + (p.modules?.content?.wordCount || 0), 0) / pages.length
      ),
    },
  };
}
