import test from 'node:test';
import assert from 'node:assert/strict';
import { blogDetailSectionId, resolveLiveHeaderScrollOffset } from '../lib/blogDetailTocScroll.js';

test('blogDetailSectionId builds stable anchor ids', () => {
  assert.equal(blogDetailSectionId(0), 'blog-section-0');
  assert.equal(blogDetailSectionId(3), 'blog-section-3');
});

test('resolveLiveHeaderScrollOffset returns sensible fallback without DOM', () => {
  assert.equal(resolveLiveHeaderScrollOffset(null), 96);
});
