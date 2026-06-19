import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePageSeo } from '../lib/seo/seoEngine.js';
import { sanitizeCustomHeadTags } from '../lib/seo/sanitizeHeadTags.js';
import { runPageSeoModalAudit } from '../lib/seo/pageSeoModalAudit.js';
import { buildSchemaTemplateFromFields } from '../lib/seo/schemaFieldDefs.js';

test('normalizePageSeo preserves extended builder modal fields', () => {
  const seo = normalizePageSeo({
    secondaryKeywords: 'a, b',
    author: 'Jane',
    breadcrumbTitle: 'About us',
    languageOverride: 'hi',
    maxImagePreview: 'large',
    noarchive: true,
    customHeadTags: '<meta name="x" content="y" />',
    schemaFieldValues: { name: '{{title}}' },
  });
  assert.deepEqual(seo.secondaryKeywords, ['a', 'b']);
  assert.equal(seo.author, 'Jane');
  assert.equal(seo.breadcrumbTitle, 'About us');
  assert.equal(seo.languageOverride, 'hi');
  assert.equal(seo.maxImagePreview, 'large');
  assert.equal(seo.noarchive, true);
  assert.ok(seo.customHeadTags.includes('meta'));
});

test('sanitizeCustomHeadTags strips script tags', () => {
  const out = sanitizeCustomHeadTags('<script>alert(1)</script><meta name="ok" content="1" />');
  assert.ok(!out.includes('script'));
  assert.ok(out.includes('meta'));
});

test('runPageSeoModalAudit flags missing title and scores page', () => {
  const audit = runPageSeoModalAudit({
    pageSeo: {},
    projectSeo: {},
    tree: [{ nodeType: 'heading', props: { text: 'Hello' } }],
  });
  assert.ok(audit.score < 100);
  assert.ok(audit.critical.some((i) => i.id === 'missing-title'));
  assert.ok(audit.passed.some((i) => i.id === 'h1-ok'));
});

test('buildSchemaTemplateFromFields WebPage uses tokens', () => {
  const tpl = buildSchemaTemplateFromFields('WebPage', {});
  assert.equal(tpl['@type'], 'WebPage');
  assert.equal(tpl.name, '{{title}}');
});
