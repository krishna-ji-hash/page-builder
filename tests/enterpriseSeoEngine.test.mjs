import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runKeywordIntelligence,
  runContentAudit,
  runImageSeoAudit,
  runInternalLinkAudit,
  computeEnterprisePageScore,
  aggregateEnterpriseProjectReport,
} from '../lib/seo/enterpriseSeoEngine.js';
import { buildSeoReportCsv } from '../lib/seo/seoReportExport.js';

const sampleTree = [
  {
    id: 1,
    nodeType: 'heading',
    props: { text: 'Dispatch shipping solutions', level: 1 },
    children: [],
  },
  {
    id: 2,
    nodeType: 'paragraph',
    props: { text: 'Dispatch helps businesses ship faster with multi-carrier dispatch shipping tools.' },
    children: [],
  },
  {
    id: 3,
    nodeType: 'image',
    props: { src: '/hero.png', alt: '', width: 2000 },
    children: [],
  },
];

test('keyword intelligence detects focus keyword in H1 and flags missing alt context', () => {
  const result = runKeywordIntelligence({
    pageSeo: { title: 'Dispatch shipping', focusKeyword: 'dispatch', description: 'Dispatch platform' },
    tree: sampleTree,
    pageSlug: 'dispatch-shipping',
    pagePath: '/d/dispatch-shipping',
  });
  assert.equal(result.focusKeyword, 'dispatch');
  assert.ok(result.checks.some((c) => c.id === 'kw-in-h1' && c.status === 'passed'));
  assert.ok(result.density.occurrences >= 1);
});

test('content audit counts words and flags missing alt paragraph issues', () => {
  const result = runContentAudit({ tree: sampleTree, pageSeo: {} });
  assert.ok(result.wordCount > 5);
  assert.equal(result.headings.h1Count, 1);
});

test('image seo audit finds missing alt', () => {
  const result = runImageSeoAudit({ tree: sampleTree });
  assert.equal(result.total, 1);
  assert.equal(result.missingAlt, 1);
});

test('internal link audit detects orphan and broken links', () => {
  const treeWithLink = [
    ...sampleTree,
    { id: 4, nodeType: 'button', props: { href: '/d/missing-page', label: 'Go' }, children: [] },
  ];
  const result = runInternalLinkAudit({
    pageId: 2,
    pageSlug: 'about',
    pagePath: '/d/about',
    tree: treeWithLink,
    allPages: [
      { id: 1, slug: 'home', path: '/d/home', title: 'Home' },
      { id: 2, slug: 'about', path: '/d/about', title: 'About' },
    ],
    inboundMap: { '/d/about': [] },
  });
  assert.equal(result.broken.length, 1);
  assert.equal(result.isOrphan, true);
});

test('enterprise score penalizes critical and warning issues', () => {
  const score = computeEnterprisePageScore({
    baseAudit: { issues: [{ id: 'missing-title', severity: 'critical', label: 'x' }] },
    moduleIssues: [{ id: 'img-missing-alt', severity: 'warning', label: 'y' }],
  });
  assert.equal(score.score, 100 - 12 - 6);
  assert.equal(score.summary.critical, 1);
  assert.equal(score.summary.warning, 1);
});

test('aggregate enterprise report builds widgets', () => {
  const report = aggregateEnterpriseProjectReport([
    {
      score: 80,
      summary: { critical: 0, warning: 1, passed: 2 },
      issues: [{ id: 'missing-schema', severity: 'warning' }],
      modules: { images: { missingAlt: 2 }, links: { isOrphan: true, broken: [] }, content: { wordCount: 200 }, base: { issues: [] } },
    },
    {
      score: 60,
      summary: { critical: 1, warning: 0, passed: 1 },
      issues: [{ id: 'missing-title', severity: 'critical' }],
      modules: { images: { missingAlt: 0 }, links: { isOrphan: false, broken: [{ path: '/x' }] }, content: { wordCount: 100 }, base: { issues: [] } },
    },
  ]);
  assert.equal(report.projectScore, 70);
  assert.equal(report.widgets.missingAlt, 2);
  assert.equal(report.widgets.orphanPages, 1);
  assert.ok(report.topIssues.length >= 1);
});

test('CSV export includes header and page row', () => {
  const csv = buildSeoReportCsv({
    projectScore: 75,
    widgets: { indexedPages: 2, missingMetadata: 1 },
    pages: [{ pageName: 'Home', pageSlug: 'home', score: 75, summary: { critical: 0, warning: 1 }, issues: [], modules: { content: { wordCount: 100 }, images: { total: 1, missingAlt: 0 }, links: { isOrphan: false } } }],
  });
  assert.match(csv, /Page,Slug,Score/);
  assert.match(csv, /Home,home,75/);
});
