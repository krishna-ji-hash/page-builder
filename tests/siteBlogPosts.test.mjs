import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSiteBlogPost,
  getAllSiteBlogPosts,
  siteBlogPostHref,
  siteBlogPostsForBuilderWidget,
  resolveSiteBlogPost,
} from '../lib/siteBlogPosts.js';

test('getSiteBlogPost returns post by slug', () => {
  const post = getSiteBlogPost('what-is-logistics-aggregator');
  assert.ok(post);
  assert.equal(post.title, 'What is a Logistics Aggregator and How Does It Work?');
});

test('getSiteBlogPost returns null for unknown slug', () => {
  assert.equal(getSiteBlogPost('missing-slug'), null);
});

test('siteBlogPostHref builds flat blog URLs', () => {
  assert.equal(siteBlogPostHref('cod-remittance-ecommerce-shipping'), '/blog/cod-remittance-ecommerce-shipping');
});

test('resolveSiteBlogPost matches title-based slug from listing links', () => {
  const post = resolveSiteBlogPost('what-is-a-logistics-aggregator-and-how-does-it-work');
  assert.ok(post);
  assert.equal(post.slug, 'what-is-logistics-aggregator');
});

test('siteBlogPostsForBuilderWidget maps href and slug for builder', () => {
  const posts = siteBlogPostsForBuilderWidget();
  assert.equal(posts.length, getAllSiteBlogPosts().length);
  assert.equal(posts[0].href, siteBlogPostHref(posts[0].slug));
  assert.ok(posts.every((post) => post.href.startsWith('/blog/')));
  assert.ok(posts.every((post) => post.publishedDate));
});
