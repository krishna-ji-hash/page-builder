import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSeoMetadata, normalizeProjectSeo, normalizePageSeo } from '../lib/seo/seoEngine.js';
import { generateSchemaJsonLd } from '../lib/seo/seoSchemaGenerator.js';
import { runSeoAudit } from '../lib/seo/seoAuditEngine.js';
import { renderSitemapXml } from '../lib/seo/sitemapBuilder.js';

test('resolveSeoMetadata binds {{item.title}} in page seo.title', () => {
  const { metadata } = resolveSeoMetadata({
    projectConfig: {
      seo: { siteTitle: 'Battle Shop', titleTemplate: '{{title}} | {{siteTitle}}' },
    },
    pageName: 'Product detail',
    currentPath: '/battle-ecommerce/product/desk-lamp',
    pageSeo: { title: '{{item.title}} — Battle Shop' },
    cmsContext: { item: { title: 'Desk Lamp' }, sys: { slug: 'desk-lamp' } },
  });
  assert.equal(metadata.title, 'Desk Lamp — Battle Shop');
});

test('page SEO overrides project defaults for description', () => {
  const { metadata } = resolveSeoMetadata({
    projectConfig: { seo: { defaultDescription: 'Project default' } },
    pageName: 'About',
    pageSeo: { description: 'Page specific' },
  });
  assert.equal(metadata.description, 'Page specific');
});

test('cms item seo overrides page seo for title', () => {
  const { metadata } = resolveSeoMetadata({
    projectConfig: { seo: { siteTitle: 'Dispatch' } },
    pageName: 'Blog post',
    pageSeo: { title: 'Template title' },
    cmsItemSeo: { title: 'Custom post title' },
    cmsContext: { item: { title: 'Item title' } },
  });
  assert.equal(metadata.title, 'Custom post title');
});

test('auto schema generates BlogPosting when schemaType set', () => {
  const { schemaJsonLd } = resolveSeoMetadata({
    projectConfig: { seo: { siteTitle: 'Blog Co', defaultAuthor: 'Jane' } },
    pageName: 'Post',
    pageSeo: { title: 'Hello world', description: 'A post', schemaType: 'BlogPosting' },
    currentPath: '/site/blog/hello',
  });
  assert.equal(schemaJsonLd['@type'], 'BlogPosting');
  assert.equal(schemaJsonLd.headline, 'Hello world');
});

test('project seo includes extended identity fields', () => {
  const seo = normalizeProjectSeo({
    seo: {
      siteName: 'Acme',
      siteTagline: 'We ship',
      companyName: 'Acme Inc',
      defaultKeywords: ['logistics', 'dispatch'],
      twitterSite: '@acme',
    },
  });
  assert.equal(seo.siteName, 'Acme');
  assert.equal(seo.companyName, 'Acme Inc');
  assert.deepEqual(seo.defaultKeywords, ['logistics', 'dispatch']);
  assert.equal(seo.twitterSite, '@acme');
});

test('page seo normalizes keywords and focus keyword', () => {
  const seo = normalizePageSeo({ keywords: 'a, b', focusKeyword: 'dispatch' });
  assert.deepEqual(seo.keywords, ['a', 'b']);
  assert.equal(seo.focusKeyword, 'dispatch');
});

test('generateSchemaJsonLd Organization', () => {
  const schema = generateSchemaJsonLd({
    schemaType: 'Organization',
    projectSeo: normalizeProjectSeo({ seo: { companyName: 'Acme', canonicalDomain: 'https://acme.com' } }),
  });
  assert.equal(schema['@type'], 'Organization');
  assert.equal(schema.name, 'Acme');
});

test('runSeoAudit penalizes missing title and description', () => {
  const audit = runSeoAudit({ pageName: 'Home', pageSeo: {}, projectSeo: {} });
  assert.ok(audit.score < 100);
  assert.ok(audit.issues.some((i) => i.id === 'missing-title'));
  assert.ok(audit.issues.some((i) => i.id === 'missing-description'));
});

test('renderSitemapXml produces valid urlset', () => {
  const xml = renderSitemapXml([{ loc: 'https://example.com/', lastmod: '2026-01-01T00:00:00.000Z' }]);
  assert.match(xml, /<urlset/);
  assert.match(xml, /https:\/\/example\.com\//);
});
