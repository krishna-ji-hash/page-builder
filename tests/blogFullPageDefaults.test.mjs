import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveBlogFullPageProps,
  appendBlogPost,
  removeBlogPostAt,
  applyBlogFullPageContentPatch,
  defaultBlogPostHref,
  DEFAULT_BLOG_POSTS,
} from '../lib/blogFullPageDefaults.js';

test('resolveBlogFullPageProps normalizes posts and categories', () => {
  const resolved = resolveBlogFullPageProps({ posts: [{ id: 'x', category: 'tracking', title: 'T', description: 'D' }] });
  assert.equal(resolved.posts.length, 1);
  assert.equal(resolved.posts[0].category, 'tracking');
  assert.ok(resolved.categories.some((c) => c.id === 'all'));
});

test('appendBlogPost adds to category', () => {
  const next = appendBlogPost(DEFAULT_BLOG_POSTS, 'billing');
  assert.equal(next.length, DEFAULT_BLOG_POSTS.length + 1);
  assert.equal(next[next.length - 1].category, 'billing');
});

test('removeBlogPostAt keeps at least one post', () => {
  const one = [DEFAULT_BLOG_POSTS[0]];
  assert.equal(removeBlogPostAt(one, 0).length, 1);
});

test('applyBlogFullPageContentPatch updates featured title', () => {
  const patch = applyBlogFullPageContentPatch({}, 'featured.title', 'New Featured');
  assert.equal(patch.featured.title, 'New Featured');
});

test('normalizeBlogPost generates slug href and body from description', () => {
  const resolved = resolveBlogFullPageProps({
    posts: [{ id: 'x', category: 'tracking', title: 'Hello World', description: 'Intro text', href: '#' }],
  });
  assert.equal(resolved.posts[0].slug, 'hello-world');
  assert.equal(resolved.posts[0].href, '/blog/hello-world');
  assert.match(resolved.posts[0].body, /Intro text/);
});

test('applyBlogFullPageContentPatch updates post body by id', () => {
  const patch = applyBlogFullPageContentPatch(
    { posts: [{ id: 'post-1', title: 'T', description: 'D', category: 'tracking' }] },
    'postBody:post-1',
    'Full article copy'
  );
  assert.equal(patch.posts[0].body, 'Full article copy');
});

test('defaultBlogPostHref keeps custom link', () => {
  assert.equal(defaultBlogPostHref({ href: '/custom', title: 'T' }), '/custom');
});

test('empty heroNote fields stay empty (card hidden)', () => {
  const resolved = resolveBlogFullPageProps({ heroNoteTitle: '', heroNoteText: '' });
  assert.equal(resolved.heroNoteTitle, '');
  assert.equal(resolved.heroNoteText, '');
});

test('missing heroNote fields use defaults', () => {
  const resolved = resolveBlogFullPageProps({});
  assert.equal(resolved.heroNoteTitle, 'New Guide Published');
});

test('default posts link to /blog/[slug] detail routes', () => {
  const resolved = resolveBlogFullPageProps({});
  assert.ok(resolved.posts.length >= 6);
  assert.ok(resolved.posts.every((post) => post.href.startsWith('/blog/')));
  assert.equal(resolved.posts[0].slug, 'what-is-logistics-aggregator');
});
