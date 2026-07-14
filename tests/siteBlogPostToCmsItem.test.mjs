import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllSiteBlogPosts } from '../lib/siteBlogPosts.js';
import { siteBlogPostToCmsItemPayload } from '../lib/siteBlogPostToCmsItem.js';

test('siteBlogPostToCmsItemPayload maps all canonical posts', () => {
  const posts = getAllSiteBlogPosts();
  assert.equal(posts.length, 6);
  const payload = siteBlogPostToCmsItemPayload(posts[0]);
  assert.equal(payload.status, 'published');
  assert.equal(payload.slug, 'what-is-logistics-aggregator');
  assert.match(payload.data.content, /logistics aggregator/i);
  assert.equal(payload.data.contentBlocks.length, 3);
  assert.equal(payload.seo.schemaType, 'BlogPosting');
});
