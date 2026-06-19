import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureAbsoluteUrl, resolveSiteOrigin } from '../lib/seo/absoluteUrl.js';
import { enrichSchemaJsonLd } from '../lib/seo/schemaJsonLdUtils.js';
import { resolvePlaceholderNavHref } from '../lib/seo/navLinkResolver.js';
import { resolveSeoMetadata } from '../lib/seo/seoEngine.js';

test('ensureAbsoluteUrl builds https canonical from domain + path', () => {
  assert.equal(ensureAbsoluteUrl('https://dispatch.in', '/bulk-shipping'), 'https://dispatch.in/bulk-shipping');
  assert.equal(ensureAbsoluteUrl('https://dispatch.in', 'https://dispatch.in/home'), 'https://dispatch.in/home');
});

test('resolveSeoMetadata emits absolute canonical og url and images', () => {
  const { metadata, schemaJsonLd } = resolveSeoMetadata({
    projectConfig: {
      seo: {
        siteTitle: 'Dispatch',
        canonicalDomain: 'https://dispatch.in',
        defaultOgImage: '/og/default.png',
      },
    },
    pageName: 'bulk-shipping',
    currentPath: '/bulk-shipping',
    pageSeo: { schemaType: 'WebPage' },
  });
  assert.equal(metadata.alternates?.canonical, 'https://dispatch.in/bulk-shipping');
  assert.equal(metadata.openGraph?.url, 'https://dispatch.in/bulk-shipping');
  assert.equal(metadata.openGraph?.images?.[0], 'https://dispatch.in/og/default.png');
  assert.equal(metadata.twitter?.images?.[0], 'https://dispatch.in/og/default.png');
  assert.ok(schemaJsonLd.url);
  assert.ok(schemaJsonLd.description);
});

test('resolveSeoMetadata replaces slug-style title with readable title', () => {
  const { metadata } = resolveSeoMetadata({
    projectConfig: { seo: { siteTitle: 'Dispatch Solutions' } },
    pageName: 'bulk-shipping',
    currentPath: '/bulk-shipping',
    pageSeo: {},
  });
  assert.match(metadata.title, /Bulk Shipping/i);
  assert.doesNotMatch(metadata.title, /^bulk-shipping$/);
});

test('enrichSchemaJsonLd fills missing url and description', () => {
  const out = enrichSchemaJsonLd(
    { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Test' },
    { description: 'Hello', url: 'https://example.com/page' }
  );
  assert.equal(out.description, 'Hello');
  assert.equal(out.url, 'https://example.com/page');
});

test('resolvePlaceholderNavHref maps common labels to pages', () => {
  assert.equal(resolvePlaceholderNavHref('Pricing', 'dispatch', ['home', 'pricing']), '/pricing');
  assert.equal(resolvePlaceholderNavHref('Bulk Shipping', 'dispatch', ['bulk-shipping']), '/bulk-shipping');
});
