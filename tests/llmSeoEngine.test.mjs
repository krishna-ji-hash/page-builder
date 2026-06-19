import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runGeoAnalysis,
  runAeoAnalysis,
  runEntityEngine,
  runCitationReadiness,
  computeAiSearchReadiness,
  computeLlmVisibilityScore,
  runLlmPageReport,
  aggregateLlmProjectReport,
  llmScoreGrade,
  runLlmAudit,
} from '../lib/seo/llmSeoEngine.js';

const sampleTree = [
  {
    id: 1,
    nodeType: 'heading',
    props: { text: 'What is multi-carrier shipping?', level: 1 },
    children: [],
  },
  {
    id: 2,
    nodeType: 'paragraph',
    props: {
      text: 'Dispatch is a logistics platform for ecommerce shipping, fulfillment, and tracking. According to a 2024 study, 68% of brands reduce RTO with better NDR management versus manual courier booking.',
    },
    children: [],
  },
  {
    id: 3,
    nodeType: 'accordion',
    props: {
      items: [
        { question: 'How does Dispatch work?', answer: 'Dispatch connects your store to multiple carriers for rate shopping, labels, and shipment tracking in one dashboard.' },
        { question: 'What is COD verification?', answer: 'COD verification helps reduce failed deliveries by validating customer intent before dispatch.' },
        { question: 'Do you support NDR?', answer: 'Yes — NDR workflows help recover failed deliveries and lower return-to-origin rates.' },
      ],
    },
    children: [],
  },
];

const pageSeo = {
  title: 'Dispatch Shipping',
  schemaType: 'FAQ',
  focusKeyword: 'shipping',
  author: 'Dispatch Team',
};

const projectSeo = {
  siteTitle: 'Dispatch',
  companyName: 'Dispatch',
};

test('GEO analysis scores FAQ and schema coverage', () => {
  const geo = runGeoAnalysis({ pageSeo, projectSeo, tree: sampleTree });
  assert.ok(geo.score >= 70);
  assert.ok(geo.faqItems.length >= 3);
  assert.ok(geo.checks.some((c) => c.id === 'geo-faq' && c.status === 'passed'));
  assert.ok(geo.checks.some((c) => c.id === 'geo-schema' && c.status === 'passed'));
});

test('AEO analysis detects questions, definitions, and comparisons', () => {
  const aeo = runAeoAnalysis({ tree: sampleTree });
  assert.ok(aeo.summary.questions >= 3);
  assert.ok(aeo.summary.comparisons >= 1);
  assert.ok(aeo.directAnswers.length >= 2);
});

test('entity engine tracks brand and industry entities', () => {
  const entity = runEntityEngine({ pageSeo, projectSeo, tree: sampleTree });
  assert.ok(entity.brand.some((b) => b.inBody));
  assert.ok(entity.industry.length >= 2);
});

test('citation readiness detects stats and research signals', () => {
  const citation = runCitationReadiness({ tree: sampleTree, pageSeo });
  assert.equal(citation.readiness.hasStats, true);
  assert.equal(citation.readiness.hasResearch, true);
  assert.equal(citation.readiness.hasAuthor, true);
});

test('AI search readiness returns scores for all platforms', () => {
  const geo = runGeoAnalysis({ pageSeo, projectSeo, tree: sampleTree });
  const aeo = runAeoAnalysis({ tree: sampleTree });
  const entity = runEntityEngine({ pageSeo, projectSeo, tree: sampleTree });
  const citation = runCitationReadiness({ tree: sampleTree, pageSeo });
  const readiness = computeAiSearchReadiness({ geo, aeo, entity, citation, pageSeo });
  for (const p of ['chatgpt', 'gemini', 'claude', 'perplexity', 'copilot']) {
    assert.ok(readiness[p] >= 0 && readiness[p] <= 100, `${p} score in range`);
  }
});

test('LLM page report aggregates visibility score', () => {
  const report = runLlmPageReport({
    pageId: 1,
    pageName: 'Home',
    pageSlug: 'home',
    pagePath: '/d/home',
    pageSeo,
    projectSeo,
    tree: sampleTree,
  });
  assert.ok(report.llmScore >= 0 && report.llmScore <= 100);
  assert.ok(report.aiReadiness.average > 0);
  assert.ok(report.modules.geo);
  assert.ok(report.modules.aeo);
});

test('project aggregation averages scores across pages', () => {
  const page = runLlmPageReport({
    pageId: 1,
    pageName: 'Home',
    pageSlug: 'home',
    pagePath: '/d/home',
    pageSeo,
    projectSeo,
    tree: sampleTree,
  });
  const weak = runLlmPageReport({
    pageId: 2,
    pageName: 'Empty',
    pageSlug: 'empty',
    pagePath: '/d/empty',
    pageSeo: {},
    projectSeo,
    tree: [],
  });
  const project = aggregateLlmProjectReport([page, weak], { projectId: 1 });
  assert.ok(project.projectLlmScore > 0);
  assert.ok(project.aiReadiness.chatgpt >= 0);
  assert.equal(project.pages.length, 2);
});

test('LLM visibility score averages module scores', () => {
  const geo = runGeoAnalysis({ pageSeo, projectSeo, tree: sampleTree });
  const aeo = runAeoAnalysis({ tree: sampleTree });
  const entity = runEntityEngine({ pageSeo, projectSeo, tree: sampleTree });
  const citation = runCitationReadiness({ tree: sampleTree, pageSeo });
  const score = computeLlmVisibilityScore({ geo, aeo, entity, citation });
  assert.ok(score >= 0 && score <= 100);
});

test('llm score grade maps bands', () => {
  assert.equal(llmScoreGrade(90).id, 'excellent');
  assert.equal(llmScoreGrade(75).id, 'good');
  assert.equal(llmScoreGrade(55).id, 'fair');
  assert.equal(llmScoreGrade(30).id, 'poor');
});

test('LLM audit deduplicates repeated issues', () => {
  const geo = runGeoAnalysis({ pageSeo: {}, projectSeo, tree: [] });
  const aeo = runAeoAnalysis({ tree: [] });
  const entity = runEntityEngine({ pageSeo: {}, projectSeo, tree: [] });
  const citation = runCitationReadiness({ tree: [], pageSeo: {} });
  const audit = runLlmAudit({ geo, aeo, entity, citation, pageSeo: {} });
  const ids = audit.issues.map((i) => i.id);
  assert.equal(ids.length, new Set(ids).size);
});
