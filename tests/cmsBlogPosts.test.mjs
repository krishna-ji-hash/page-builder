import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cmsItemToDetailPost,
  cmsItemToWidgetPost,
  mergeCmsPostsIntoBlogListingTree,
} from '../lib/cmsBlogPostUtils.js';

test('cmsItemToDetailPost maps CMS row to live detail shape', () => {
  const detail = cmsItemToDetailPost({
    id: 12,
    slug: 'my-article',
    title: 'My Article',
    publishedAt: '2026-07-13T10:00:00.000Z',
    data: {
      excerpt: 'Summary text',
      content: 'Intro heading\n\nBody copy here.',
      featuredImage: 'https://example.com/hero.jpg',
      category: 'Shipping Guide',
      readTime: '4 min read',
    },
  });

  assert.equal(detail.slug, 'my-article');
  assert.equal(detail.title, 'My Article');
  assert.equal(detail.description, 'Summary text');
  assert.equal(detail.category, 'Shipping Guide');
  assert.equal(detail.content.length >= 1, true);
});

test('cmsItemToWidgetPost preserves explicit publishedDate', () => {
  const widget = cmsItemToWidgetPost({
    id: 3,
    slug: 'dated-post',
    title: 'Dated Post',
    data: {
      content: 'Body',
      publishedDate: 'Jun 1, 2026',
    },
  });
  assert.equal(widget.publishedDate, 'Jun 1, 2026');
});

test('mergeCmsPostsIntoBlogListingTree prefers CMS posts on slug conflict', () => {
  const nodes = [
    {
      nodeType: 'blog_full_page',
      props: {
        posts: [
          {
            id: 'old-1',
            slug: 'shared-slug',
            title: 'Old title',
            description: 'Old',
            body: 'Old body',
            category: 'shipping-guide',
            image: '',
          },
        ],
      },
    },
  ];

  const cmsPosts = [
    {
      id: 'cms-9',
      slug: 'shared-slug',
      title: 'CMS title',
      description: 'CMS summary',
      body: 'CMS body',
      category: 'Shipping Guide',
      image: 'https://example.com/cms.jpg',
      readTime: '3 min read',
      publishedDate: 'Jul 13, 2026',
      href: '/blog/shared-slug',
    },
  ];

  const merged = mergeCmsPostsIntoBlogListingTree(nodes, cmsPosts);
  assert.equal(merged[0].props.posts.length, 1);
  assert.equal(merged[0].props.posts[0].title, 'CMS title');
});
