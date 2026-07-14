import {
  walkTreeNodes,
  extractBodyText,
  analyzeHeadingHierarchy,
  countWords,
} from './seoPageHelpers.js';

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function issue(id, severity, category, label, extra = {}) {
  return { id, severity, category, label, ...extra };
}

const SCORE_WEIGHTS = { critical: 10, warning: 4, passed: 0 };

export const LLM_ISSUE_LABELS = {
  'geo-missing-faq': 'Missing FAQ coverage',
  'geo-missing-schema': 'Missing structured data',
  'geo-weak-brand': 'Brand not in page body',
  'geo-weak-answers': 'Weak answer blocks',
  'geo-missing-entities': 'Low industry entity coverage',
  'geo-no-citations': 'No citation signals',
  'aeo-no-questions': 'No question or FAQ blocks',
  'aeo-no-direct-answers': 'No direct answers',
  'aeo-no-comparisons': 'No comparison content',
  'entity-missing-brand': 'Brand entity missing',
  'entity-missing-service': 'No service entities',
  'entity-missing-industry': 'Few industry entities',
  'cite-no-stats': 'No statistics',
  'cite-no-sources': 'No source references',
  'cite-no-dates': 'No date signals',
  'cite-no-research': 'No research references',
  'cite-no-author': 'No author/publisher',
  'llm-missing-schema': 'Missing schema',
  'llm-missing-faq': 'Missing FAQ',
  'llm-missing-entities': 'Missing industry entities',
};

export function llmScoreGrade(score) {
  const n = Number(score) || 0;
  if (n >= 85) return { id: 'excellent', label: 'Excellent', tone: 'good' };
  if (n >= 70) return { id: 'good', label: 'Good', tone: 'good' };
  if (n >= 50) return { id: 'fair', label: 'Needs work', tone: 'warn' };
  return { id: 'poor', label: 'Low visibility', tone: 'bad' };
}

function clampScore(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function partialScore(value, target, weight) {
  if (!target) return 0;
  return clampScore((Math.min(value, target) / target) * weight);
}

const DEFINITION_RE = /\b(is a|are a|refers to|means|defined as)\b/i;
const COMPARISON_RE = /\b(vs\.?|versus|compared to|better than|difference between|unlike)\b/i;
const STAT_RE = /\b\d+(\.\d+)?%|\b\d{1,3}(,\d{3})+\b|\b\d+\s*(million|billion|lakh|crore)\b/i;
const DATE_RE = /\b(20\d{2}|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;
const SOURCE_RE = /\b(according to|research|study|report|survey|source:|https?:\/\/|www\.)\b/i;
const QUESTION_RE = /\?$/;

const INDUSTRY_ENTITIES = [
  'logistics',
  'shipping',
  'courier',
  'fulfillment',
  'warehouse',
  'ecommerce',
  'ndr',
  'cod',
  'tracking',
  'supply chain',
  'last mile',
  '3pl',
];

const SERVICE_ENTITIES = [
  'multi-carrier shipping',
  'order fulfillment',
  'shipment tracking',
  'rate calculator',
  'label printing',
  'cod verification',
  'ndr management',
];

function hasSchema(pageSeo) {
  return Boolean(pageSeo?.schemaType || pageSeo?.schemaTemplate || pageSeo?.schemaJsonLd);
}

function hasFaqSchema(pageSeo) {
  const type = str(pageSeo?.schemaType).toUpperCase();
  if (type === 'FAQ') return true;
  const tpl = pageSeo?.schemaTemplate;
  const raw = typeof tpl === 'string' ? tpl : JSON.stringify(tpl || {});
  return /FAQPage/i.test(raw);
}

function collectFaqFromTree(tree) {
  const items = [];
  walkTreeNodes(tree, (node) => {
    if (node?.nodeType === 'accordion' || node?.nodeType === 'faq_full_page') {
      const list = Array.isArray(node.props?.items) ? node.props.items : [];
      for (const item of list) {
        const q = str(item?.question || item?.label).trim();
        const a = str(item?.answer || item?.body || item?.text).trim();
        if (q) items.push({ question: q, answer: a });
      }
    }
  });
  return items;
}

function collectTextBlocks(tree) {
  const blocks = [];
  walkTreeNodes(tree, (node) => {
    const type = node?.nodeType;
    let text = '';
    if (type === 'heading') text = str(node.props?.text);
    else if (type === 'text' || type === 'paragraph') text = str(node.props?.text);
    else if (type === 'rich_text' || type === 'richText') {
      text = str(node.props?.content || node.props?.text).replace(/<[^>]+>/g, ' ');
    }
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length > 15) {
      blocks.push({ nodeId: node.id, type, text, words: countWords(text) });
    }
  });
  return blocks;
}

function scoreFromIssues(issues) {
  const list = Array.isArray(issues) ? issues : [];
  const penalty = list.reduce((sum, i) => sum + (SCORE_WEIGHTS[i.severity] ?? 0), 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function runGeoAnalysis({ pageSeo = {}, projectSeo = {}, tree }) {
  const body = extractBodyText(tree);
  const faqItems = collectFaqFromTree(tree);
  const blocks = collectTextBlocks(tree);
  const checks = [];
  const issues = [];

  const faqCount = faqItems.length;
  const faqCoverage = faqCount >= 3 || hasFaqSchema(pageSeo);
  const faqPartial = faqCount >= 1 && faqCount < 3;
  checks.push({
    id: 'geo-faq',
    label: 'FAQ coverage (3+ items or FAQ schema)',
    status: faqCoverage ? 'passed' : faqPartial ? 'warning' : 'critical',
    count: faqCount,
  });
  if (!faqCoverage && !faqPartial) {
    issues.push(issue('geo-missing-faq', 'critical', 'geo', LLM_ISSUE_LABELS['geo-missing-faq']));
  } else if (faqPartial && !hasFaqSchema(pageSeo)) {
    issues.push(issue('geo-missing-faq', 'warning', 'geo', 'Add more FAQ items (need 3+ for full GEO coverage)'));
  }

  const schemaCoverage = hasSchema(pageSeo);
  checks.push({ id: 'geo-schema', label: 'Structured data (schema)', status: schemaCoverage ? 'passed' : 'critical' });
  if (!schemaCoverage) issues.push(issue('geo-missing-schema', 'critical', 'geo', 'Missing structured data schema'));

  const brand = str(projectSeo.siteTitle || projectSeo.companyName || projectSeo.siteName);
  const brandInBody = brand && body.toLowerCase().includes(brand.toLowerCase());
  checks.push({ id: 'geo-brand', label: 'Brand mentioned in content', status: brandInBody ? 'passed' : 'warning' });
  if (!brandInBody) issues.push(issue('geo-weak-brand', 'warning', 'geo', 'Brand name not prominent in page body'));

  const answerBlocks = blocks.filter((b) => b.words >= 25 && b.words <= 120);
  const answerCoverage = answerBlocks.length >= 2;
  checks.push({
    id: 'geo-answers',
    label: 'Concise answer blocks (25–120 words)',
    status: answerCoverage ? 'passed' : 'warning',
    count: answerBlocks.length,
  });
  if (!answerCoverage) issues.push(issue('geo-weak-answers', 'warning', 'geo', 'Weak answer block coverage'));

  const entityHits = INDUSTRY_ENTITIES.filter((e) => body.toLowerCase().includes(e));
  const entityCoverage = entityHits.length >= 2;
  checks.push({
    id: 'geo-entities',
    label: 'Industry entity coverage',
    status: entityCoverage ? 'passed' : 'warning',
    entities: entityHits,
  });
  if (!entityCoverage) issues.push(issue('geo-missing-entities', 'warning', 'geo', 'Low industry entity coverage'));

  const citationSignals =
    (STAT_RE.test(body) ? 1 : 0) + (SOURCE_RE.test(body) ? 1 : 0) + (DATE_RE.test(body) ? 1 : 0);
  const citationCoverage = citationSignals >= 1;
  checks.push({
    id: 'geo-citations',
    label: 'Citation signals (stats/sources/dates)',
    status: citationCoverage ? 'passed' : 'warning',
  });
  if (!citationCoverage) issues.push(issue('geo-no-citations', 'warning', 'geo', 'No statistics, sources, or dates for citations'));

  const score = scoreFromIssues(issues);
  return { score, checks, issues, faqItems, answerBlocks: answerBlocks.length, entityHits, citationSignals };
}

export function runAeoAnalysis({ tree }) {
  const blocks = collectTextBlocks(tree);
  const outline = analyzeHeadingHierarchy(tree).outline;
  const faqItems = collectFaqFromTree(tree);
  const body = extractBodyText(tree);

  const questionBlocks = outline.filter((h) => QUESTION_RE.test(h.text));
  const definitionParagraphs = blocks.filter((b) => DEFINITION_RE.test(b.text));
  const comparisonBlocks = blocks.filter((b) => COMPARISON_RE.test(b.text));
  const directAnswers = faqItems.filter((f) => f.answer && f.answer.length >= 40);

  const issues = [];
  if (!faqItems.length && !questionBlocks.length) {
    issues.push(issue('aeo-no-questions', 'critical', 'aeo', 'No question blocks or FAQ accordion'));
  }
  if (!directAnswers.length && !definitionParagraphs.length) {
    issues.push(issue('aeo-no-direct-answers', 'warning', 'aeo', 'No direct answer or definition paragraphs'));
  }
  if (!comparisonBlocks.length) {
    issues.push(issue('aeo-no-comparisons', 'warning', 'aeo', 'No comparison content'));
  }

  const score = scoreFromIssues(issues);
  return {
    score,
    issues,
    questionBlocks,
    faqBlocks: faqItems,
    directAnswers,
    definitionParagraphs,
    comparisonBlocks,
    summary: {
      questions: questionBlocks.length + faqItems.length,
      definitions: definitionParagraphs.length,
      comparisons: comparisonBlocks.length,
      directAnswers: directAnswers.length,
      wordCount: countWords(body),
    },
  };
}

export function runEntityEngine({ pageSeo = {}, projectSeo = {}, tree }) {
  const body = extractBodyText(tree).toLowerCase();
  const title = str(pageSeo.title || projectSeo.siteTitle).toLowerCase();

  const brandEntities = [projectSeo.companyName, projectSeo.siteTitle, projectSeo.siteName]
    .map((v) => str(v).trim())
    .filter(Boolean);

  const brand = brandEntities.map((name) => ({
    name,
    inTitle: title.includes(name.toLowerCase()),
    inBody: body.includes(name.toLowerCase()),
  }));

  const serviceEntities = SERVICE_ENTITIES.map((name) => ({
    name,
    present: body.includes(name.toLowerCase()) || str(pageSeo.focusKeyword).toLowerCase().includes(name),
  })).filter((e) => e.present);

  const focusKw = str(pageSeo.focusKeyword).toLowerCase().trim();
  const industryEntities = INDUSTRY_ENTITIES.map((name) => ({
    name,
    present: body.includes(name) || (focusKw && (name.includes(focusKw) || focusKw.includes(name))),
  })).filter((e) => e.present);
  if (focusKw && focusKw.length > 2 && !industryEntities.some((e) => e.name === focusKw)) {
    industryEntities.push({ name: focusKw, present: body.includes(focusKw) });
  }

  const productEntities = [];
  walkTreeNodes(tree, (node) => {
    if (node?.nodeType === 'heading' && /product|plan|pricing|api/i.test(str(node.props?.text))) {
      productEntities.push({ name: str(node.props.text), nodeId: node.id });
    }
  });

  const issues = [];
  if (!brand.some((b) => b.inBody)) issues.push(issue('entity-missing-brand', 'critical', 'entities', 'Brand entity not in body'));
  if (serviceEntities.length < 1) issues.push(issue('entity-missing-service', 'warning', 'entities', 'No service entities detected'));
  if (industryEntities.length < 2) issues.push(issue('entity-missing-industry', 'warning', 'entities', 'Few industry entities'));

  return {
    score: scoreFromIssues(issues),
    issues,
    brand,
    service: serviceEntities,
    product: productEntities,
    industry: industryEntities,
  };
}

export function runCitationReadiness({ tree, pageSeo = {} }) {
  const body = extractBodyText(tree);
  const blocks = collectTextBlocks(tree);

  const statistics = blocks.filter((b) => STAT_RE.test(b.text));
  const sources = blocks.filter((b) => SOURCE_RE.test(b.text));
  const dates = blocks.filter((b) => DATE_RE.test(b.text));
  const research = blocks.filter((b) => /\b(study|research|report|survey|according to)\b/i.test(b.text));

  const issues = [];
  if (!statistics.length) issues.push(issue('cite-no-stats', 'warning', 'citations', 'No statistics for AI citation'));
  if (!sources.length) issues.push(issue('cite-no-sources', 'warning', 'citations', 'No source references'));
  if (!dates.length) issues.push(issue('cite-no-dates', 'warning', 'citations', 'No dates for freshness signals'));
  if (!research.length) issues.push(issue('cite-no-research', 'warning', 'citations', 'No research references'));

  const author = str(pageSeo.author || pageSeo.publisher);
  if (!author) issues.push(issue('cite-no-author', 'warning', 'citations', 'No author/publisher for E-E-A-T'));

  return {
    score: scoreFromIssues(issues),
    issues,
    statistics: statistics.map((b) => b.text.slice(0, 120)),
    sources: sources.map((b) => b.text.slice(0, 120)),
    dates: dates.map((b) => b.text.slice(0, 80)),
    research: research.map((b) => b.text.slice(0, 120)),
    readiness: {
      hasStats: statistics.length > 0,
      hasSources: sources.length > 0,
      hasDates: dates.length > 0,
      hasResearch: research.length > 0,
      hasAuthor: Boolean(author),
    },
  };
}

export function computeAiSearchReadiness({ geo = {}, aeo = {}, entity = {}, citation = {}, pageSeo = {} }) {
  const faqN = geo.faqItems?.length || 0;
  const faqScore = partialScore(faqN, 3, 28) + (hasFaqSchema(pageSeo) ? 8 : 0);
  const schemaScore = hasSchema(pageSeo) ? 22 : 0;
  const answerScore = partialScore(aeo.directAnswers?.length || 0, 2, 22);
  const defScore = partialScore(aeo.definitionParagraphs?.length || 0, 2, 16);
  const entityScore = partialScore(entity.industry?.length || 0, 3, 18);
  const brandBoost = entity.brand?.some((b) => b.inBody) ? 12 : 0;
  const statScore = citation.readiness?.hasStats ? 14 : partialScore(citation.statistics?.length || 0, 1, 6);
  const sourceScore = citation.readiness?.hasSources ? 22 : 0;
  const researchScore = citation.readiness?.hasResearch ? 10 : 0;
  const dateScore = citation.readiness?.hasDates ? 8 : 0;
  const compareScore = partialScore(aeo.comparisonBlocks?.length || 0, 1, 14);
  const authorScore = citation.readiness?.hasAuthor ? 8 : 0;

  return {
    chatgpt: clampScore(faqScore + answerScore + schemaScore + entityScore * 0.85),
    gemini: clampScore(schemaScore + entityScore + statScore + brandBoost + dateScore),
    claude: clampScore(answerScore + defScore + statScore + researchScore + authorScore + 10),
    perplexity: clampScore(sourceScore + statScore * 1.2 + researchScore + faqScore * 0.6 + dateScore),
    copilot: clampScore(schemaScore + faqScore * 0.8 + compareScore + entityScore),
    average: 0,
  };
}

export function runLlmAudit({ geo, aeo, entity, citation, pageSeo }) {
  const seen = new Set();
  const critical = [];
  const warnings = [];

  const push = (list, item) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    list.push(item);
  };

  for (const i of [
    ...(geo?.issues || []),
    ...(aeo?.issues || []),
    ...(entity?.issues || []),
    ...(citation?.issues || []),
  ]) {
    if (i.severity === 'critical') push(critical, i);
    else if (i.severity === 'warning') push(warnings, i);
  }

  if (!hasSchema(pageSeo)) {
    push(critical, issue('llm-missing-schema', 'critical', 'llm-audit', LLM_ISSUE_LABELS['llm-missing-schema']));
  }
  const faqOk = (geo?.faqItems?.length || 0) >= 3 || hasFaqSchema(pageSeo);
  if (!faqOk && !(geo?.faqItems?.length >= 1)) {
    push(critical, issue('llm-missing-faq', 'critical', 'llm-audit', LLM_ISSUE_LABELS['llm-missing-faq']));
  } else if (!faqOk) {
    push(warnings, issue('llm-missing-faq', 'warning', 'llm-audit', 'FAQ present but below 3 items — expand for LLM visibility'));
  }
  if ((entity?.industry?.length || 0) < 1) {
    push(critical, issue('llm-missing-entities', 'critical', 'llm-audit', LLM_ISSUE_LABELS['llm-missing-entities']));
  }

  return { critical, warnings, issues: [...critical, ...warnings] };
}

export function computeLlmVisibilityScore({ geo, aeo, entity, citation }) {
  const scores = [geo?.score, aeo?.score, entity?.score, citation?.score].filter((n) => Number.isFinite(n));
  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function runLlmPageReport({ pageId, pageName, pageSlug, pagePath, pageSeo, projectSeo, tree }) {
  const geo = runGeoAnalysis({ pageSeo, projectSeo, tree });
  const aeo = runAeoAnalysis({ tree });
  const entity = runEntityEngine({ pageSeo, projectSeo, tree });
  const citation = runCitationReadiness({ tree, pageSeo });
  const aiReadiness = computeAiSearchReadiness({ geo, aeo, entity, citation, pageSeo });
  const readinessValues = [
    aiReadiness.chatgpt,
    aiReadiness.gemini,
    aiReadiness.claude,
    aiReadiness.perplexity,
    aiReadiness.copilot,
  ];
  aiReadiness.average = Math.round(readinessValues.reduce((a, b) => a + b, 0) / readinessValues.length);

  const llmScore = computeLlmVisibilityScore({ geo, aeo, entity, citation });
  const audit = runLlmAudit({ geo, aeo, entity, citation, pageSeo });
  const grade = llmScoreGrade(llmScore);

  return {
    pageId,
    pageName,
    pageSlug,
    pagePath,
    llmScore,
    grade,
    aiReadiness,
    audit,
    modules: { geo, aeo, entity, citation },
    issues: audit.issues,
    summary: {
      critical: audit.critical.length,
      warning: audit.warnings.length,
    },
  };
}

export function aggregateLlmProjectReport(pageReports = [], projectMeta = {}) {
  const pages = Array.isArray(pageReports) ? pageReports : [];
  if (!pages.length) {
    return {
      projectLlmScore: 0,
      aiReadiness: {},
      pages: [],
      topIssues: [],
      ...projectMeta,
    };
  }

  const projectLlmScore = Math.round(pages.reduce((s, p) => s + (p.llmScore || 0), 0) / pages.length);
  const platforms = ['chatgpt', 'gemini', 'claude', 'perplexity', 'copilot'];
  const aiReadiness = {};
  for (const p of platforms) {
    aiReadiness[p] = Math.round(pages.reduce((s, page) => s + (page.aiReadiness?.[p] || 0), 0) / pages.length);
  }
  aiReadiness.average = Math.round(
    pages.reduce((s, page) => s + (page.aiReadiness?.average || 0), 0) / pages.length
  );

  const issueCounts = new Map();
  for (const page of pages) {
    for (const i of page.issues || []) {
      issueCounts.set(i.id, (issueCounts.get(i.id) || 0) + 1);
    }
  }
  const topIssues = [...issueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count, label: LLM_ISSUE_LABELS[id] || id }));

  return {
    ...projectMeta,
    projectLlmScore,
    projectGrade: llmScoreGrade(projectLlmScore),
    aiReadiness,
    pages,
    topIssues,
    summary: pages.reduce(
      (acc, p) => ({
        critical: acc.critical + (p.summary?.critical || 0),
        warning: acc.warning + (p.summary?.warning || 0),
      }),
      { critical: 0, warning: 0 }
    ),
  };
}
