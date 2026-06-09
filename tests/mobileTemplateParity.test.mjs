import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTION_TEMPLATES } from '../lib/sectionTemplates.js';
import {
  MOBILE_PARITY_TEMPLATE_GROUPS,
  MOBILE_PARITY_SURFACES,
  validateSectionTemplateMobileParity,
  validateMobileParityGroups,
  summarizeMobileParityReport,
  auditTemplateMobileCssParity,
} from '../lib/audits/mobileTemplateParity.js';
import { PARITY_SURFACE_SELECTOR } from '../lib/paritySurface.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('MOBILE_PARITY_SURFACES lists builder, preview, and live', () => {
  assert.equal(MOBILE_PARITY_SURFACES.length, 3);
  assert.ok(MOBILE_PARITY_SURFACES.some((s) => s.includes('builder')));
  assert.ok(MOBILE_PARITY_SURFACES.some((s) => s.includes('preview')));
  assert.ok(MOBILE_PARITY_SURFACES.some((s) => s.includes('live')));
});

test('getInTouch template exists in SECTION_TEMPLATES', () => {
  assert.ok(Array.isArray(SECTION_TEMPLATES.getInTouch));
  assert.ok(SECTION_TEMPLATES.getInTouch.length > 0);
});

test('priority section templates pass mobile parity after responsive defaults', () => {
  const priority = [
    'headerSpread',
    'hero',
    'tabHero',
    'featureTabs',
    'features',
    'cards',
    'pricing',
    'faq',
    'contactForm',
    'getInTouch',
    'footer',
    'splitHeroCarousel',
  ];
  const failures = [];
  for (const id of priority) {
    const result = validateSectionTemplateMobileParity(id, SECTION_TEMPLATES);
    const critical = (result.issues || []).filter((i) => i.severity === 'critical');
    if (critical.length) failures.push({ id, critical });
  }
  assert.deepEqual(
    failures,
    [],
    `Critical mobile parity failures: ${failures.map((f) => `${f.id} (${f.critical.map((c) => c.code).join(', ')})`).join('; ')}`
  );
});

test('mobile parity groups report has no critical getInTouch/header/carousel breaks', () => {
  const report = validateMobileParityGroups(SECTION_TEMPLATES);
  const summary = summarizeMobileParityReport(report);
  const critical = summary.allIssues.filter((i) => i.severity === 'critical');
  const allowedCodes = new Set(['heading-mobile-type']);
  const unexpected = critical.filter((i) => !allowedCodes.has(i.code));
  assert.deepEqual(
    unexpected.map((i) => `${i.group || ''}:${i.templateId}:${i.code}`),
    [],
    `Unexpected critical issues: ${unexpected.map((i) => i.message).join(' | ')}`
  );
});

test('PDP widgets have mobile width 100% defaults', () => {
  const pdp = validateMobileParityGroups(SECTION_TEMPLATES).pdp;
  assert.equal(pdp.broken.length, 0, pdp.broken.map((i) => i.message).join('; '));
});

test('shared template CSS mobile rules use parity surface', () => {
  const files = [
    'styles/shared/get-in-touch.css',
    'styles/shared/tab-hero.css',
    'styles/shared/section-template-parity.css',
  ];
  for (const rel of files) {
    const css = readFileSync(path.join(root, rel), 'utf8');
    if (css.includes('@media') && css.includes('data-section-template')) {
      assert.ok(
        css.includes(PARITY_SURFACE_SELECTOR) || css.includes(':is(.live-doc'),
        `${rel} should target parity surface for section templates`
      );
    }
    const hits = auditTemplateMobileCssParity(css, rel);
    assert.equal(hits.length, 0, `${rel} has overflow hidden hacks: ${hits.map((h) => h.text).join(', ')}`);
  }
});
