import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blogPostToDetailPost, blogPostToWidgetPost } from '../lib/blogCmsMappers.js';

test('blogPostToDetailPost maps published post shape', () => {
  const detail = blogPostToDetailPost({
    id: 1,
    slug: 'what-is-logistics-aggregator',
    title: 'What is a Logistics Aggregator and How Does It Work?',
    excerpt: 'Summary',
    featuredImage: 'https://example.com/img.jpg',
    category: { id: 1, name: 'Shipping Guide', slug: 'shipping-guide' },
    author: {
      name: 'Dispatch Team',
      designation: 'Logistics Experts',
      bio: 'Bio',
      avatar: '',
    },
    tags: [{ id: 1, name: 'Logistics', slug: 'logistics' }],
    contentJson: [{ heading: 'A', text: 'B' }],
    contentHtml: '<p>B</p>',
    faqs: [{ question: 'Q', answer: 'A' }],
    keyTakeaways: ['Tip'],
    status: 'published',
    publishedAt: '2026-05-20T10:00:00.000Z',
    readTime: '5 min read',
    seoTitle: 'SEO',
    seoDescription: 'Meta',
    canonicalUrl: '',
    ogImage: '',
    robots: 'index',
  });

  assert.equal(detail.slug, 'what-is-logistics-aggregator');
  assert.equal(detail.category, 'Shipping Guide');
  assert.equal(detail.author.name, 'Dispatch Team');
  assert.equal(detail.faqs.length, 1);
  assert.equal(detail.keyTakeaways[0], 'Tip');
  assert.equal(detail.href, '/blog/what-is-logistics-aggregator');

  const widget = blogPostToWidgetPost({
    id: 1,
    slug: detail.slug,
    title: detail.title,
    excerpt: detail.description,
    featuredImage: detail.image,
    category: { name: detail.category },
    contentJson: detail.content,
    readTime: detail.readTime,
    publishedAt: '2026-05-20T10:00:00.000Z',
    tags: [],
    faqs: [],
    keyTakeaways: [],
    status: 'published',
  });
  assert.equal(widget.id, 'blog-1');
  assert.ok(widget.href.includes('/blog/'));
});
