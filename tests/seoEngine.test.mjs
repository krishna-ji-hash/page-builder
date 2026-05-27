import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSeoMetadata } from '../lib/seo/seoEngine.js';

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
