import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHostPageMetadata } from '../lib/site/pageSeoMetadata.ts';

const project = { name: 'Dispatch', slug: 'dispatch', domain: 'dispatch.local', homeSlug: 'home' };

test('uses seoTitle over page title', () => {
  const meta = buildHostPageMetadata(project, {
    title: 'Home',
    slug: 'home',
    seoTitle: 'Custom SEO Title',
    seoDescription: 'Desc',
    seoKeywords: 'a, b',
    ogImage: 'https://cdn.example/og.jpg',
    robotsIndex: true,
    robotsFollow: true,
    canonicalUrl: 'https://dispatch.local/',
  });
  assert.equal(meta.title, 'Custom SEO Title');
  assert.equal(meta.description, 'Desc');
  assert.deepEqual(meta.keywords, ['a', 'b']);
  assert.equal(meta.robots?.index, true);
  assert.equal(meta.robots?.follow, true);
  assert.equal(meta.alternates?.canonical, 'https://dispatch.local/');
  assert.equal(meta.openGraph?.images?.[0]?.url, 'https://cdn.example/og.jpg');
});

test('falls back to page title and noindex when disabled', () => {
  const meta = buildHostPageMetadata(project, {
    title: 'About',
    slug: 'about',
    seoTitle: null,
    seoDescription: null,
    seoKeywords: null,
    ogImage: null,
    robotsIndex: false,
    robotsFollow: false,
    canonicalUrl: null,
  });
  assert.equal(meta.title, 'About');
  assert.equal(meta.robots?.index, false);
  assert.equal(meta.robots?.follow, false);
});
