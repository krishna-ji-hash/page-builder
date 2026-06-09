import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runTreeAudits,
  scoreFromWarnings,
  buildOptimizationSuggestions,
} from '../lib/audits/auditEngine.js';
import {
  dedupeWarnings,
  computeAuditScores,
  buildAuditReport,
  summarizeWarningCounts,
} from '../lib/audits/auditReport.js';
import {
  resolveAuditDevice,
  warningsFromOverflowDiagnostics,
  parsePx,
  classifyOverflow,
} from '../lib/audits/domAuditEngine.js';
import {
  buildReduceAnimationIntensityStyleJson,
  collectAnimatedNodeIds,
} from '../lib/audits/auditQuickFix.js';

test('scoreFromWarnings penalizes critical more than suggestion', () => {
  const critical = scoreFromWarnings([{ severity: 'critical' }]);
  const suggestion = scoreFromWarnings([{ severity: 'suggestion' }]);
  assert.ok(critical < suggestion);
  assert.equal(critical, 82);
  assert.equal(suggestion, 94);
});

test('runTreeAudits detects heading hierarchy skip', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'heading',
      props: { tag: 'h1' },
      children: [],
    },
    {
      id: 2,
      nodeType: 'heading',
      props: { tag: 'h4' },
      children: [],
    },
  ];
  const { warnings } = runTreeAudits({ tree, pageSeo: { title: 'Test page title here', description: 'A long enough meta description for the audit engine to pass basic checks.' } });
  assert.ok(warnings.some((w) => w.id === 'a11y-heading-skip-2'));
});

test('runTreeAudits flags tab hero panel missing alt', () => {
  const tree = [
    {
      id: 10,
      nodeType: 'tab_hero',
      props: {
        panels: [{ imageSrc: 'https://example.com/a.jpg', imageAlt: '' }],
      },
      children: [],
    },
  ];
  const { warnings } = runTreeAudits({
    tree,
    pageSeo: { title: 'Test page title here', description: 'A long enough meta description for the audit engine to pass basic checks.' },
  });
  const altWarn = warnings.find((w) => w.id === 'a11y-img-alt-missing');
  assert.ok(altWarn);
  assert.ok(altWarn.nodes.some((n) => n.nodeId === 10));
});

test('buildAuditReport merges scores and counts', () => {
  const report = buildAuditReport({
    pageId: 5,
    device: 'desktop',
    effectiveDevice: 'mobile',
    warnings: [
      { id: 'a', kind: 'responsive', severity: 'critical', label: 'Overflow' },
      { id: 'b', kind: 'a11y', severity: 'suggestion', label: 'Tap' },
      { id: 'a', kind: 'responsive', severity: 'critical', label: 'dup' },
    ],
  });
  assert.equal(report.pageId, 5);
  assert.equal(report.effectiveDevice, 'mobile');
  assert.equal(report.counts.total, 2);
  assert.equal(report.counts.critical, 1);
  assert.ok(report.scores.responsive < 100);
  assert.equal(report.issues.length, 2);
});

test('warningsFromOverflowDiagnostics maps live overflow to responsive warnings', () => {
  const out = warningsFromOverflowDiagnostics({ 42: { horizontal: true, flexWrapUnexpected: true } }, 'mobile');
  assert.equal(out.length, 2);
  assert.equal(out[0].nodeId, 42);
  assert.equal(out[0].severity, 'critical');
  assert.equal(out[0].quickFix.type, 'width100');
});

test('resolveAuditDevice respects mobile artboard class', () => {
  const root = {
    closest(sel) {
      return sel === '.bld-canvas--mobile' ? {} : null;
    },
  };
  assert.equal(resolveAuditDevice('desktop', root), 'mobile');
  assert.equal(resolveAuditDevice('tablet', root), 'tablet');
});

test('parsePx and classifyOverflow helpers', () => {
  assert.equal(parsePx('18px'), 18);
  assert.equal(parsePx('bad'), 0);
  const rect = { left: 0, right: 100, top: 0, bottom: 50 };
  const outside = classifyOverflow({ getBoundingClientRect: () => ({ left: 110, right: 120, top: 0, bottom: 10 }) }, rect);
  assert.equal(outside.outsideX, true);
});

test('buildReduceAnimationIntensityStyleJson halves duration', () => {
  const next = buildReduceAnimationIntensityStyleJson({
    desktop: {
      interactions: {
        animation: { preset: 'fade-in', duration: 1, delay: 0.4 },
      },
    },
  });
  assert.equal(next.desktop.interactions.animation.duration, 0.5);
  assert.equal(next.desktop.interactions.animation.delay, 0.2);
});

test('collectAnimatedNodeIds finds nodes with active presets', () => {
  const ids = collectAnimatedNodeIds([
    { id: 1, style_json: { desktop: { interactions: { animation: { preset: 'none' } } } }, children: [] },
    { id: 2, style_json: { mobile: { interactions: { animation: { preset: 'fade-in' } } } }, children: [] },
  ]);
  assert.deepEqual(ids, [2]);
});

test('buildOptimizationSuggestions includes animation guidance', () => {
  const suggestions = buildOptimizationSuggestions([
    { id: 'perf-tree-animation-count', kind: 'performance' },
  ]);
  assert.ok(suggestions.some((s) => /animated/i.test(s.label)));
});

test('summarizeWarningCounts tallies severities', () => {
  const counts = summarizeWarningCounts([
    { severity: 'critical' },
    { severity: 'warning' },
    { severity: 'suggestion' },
    { severity: 'suggestion' },
  ]);
  assert.deepEqual(counts, { total: 4, critical: 1, warning: 1, suggestion: 2 });
});

test('computeAuditScores returns all category scores', () => {
  const scores = computeAuditScores([
    { kind: 'seo', severity: 'warning' },
    { kind: 'cls', severity: 'suggestion' },
  ]);
  assert.equal(typeof scores.seo, 'number');
  assert.equal(typeof scores.cls, 'number');
  assert.equal(typeof scores.responsive, 'number');
});
