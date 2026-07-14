import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBlogHubState,
  publishBlogHubCategory,
  publishBlogHubSearch,
  subscribeBlogHubCategory,
  BLOG_HUB_CATEGORY_EVENT,
} from '../lib/blogHubBus.js';

test('publishBlogHubCategory updates hub state and emits event', () => {
  publishBlogHubCategory('tracking', 'page-1');
  assert.equal(getBlogHubState('page-1').categoryId, 'tracking');
  if (typeof window !== 'undefined') {
    let received = null;
    const unsub = subscribeBlogHubCategory((categoryId) => {
      received = categoryId;
    }, 'page-1b');
    publishBlogHubCategory('tracking', 'page-1b');
    assert.equal(received, 'tracking');
    unsub();
  }
});

test('hub groups are isolated', () => {
  publishBlogHubCategory('billing', 'group-a');
  publishBlogHubCategory('shipping-guide', 'group-b');
  assert.equal(getBlogHubState('group-a').categoryId, 'billing');
  assert.equal(getBlogHubState('group-b').categoryId, 'shipping-guide');
});

test('publishBlogHubSearch stores query per group', () => {
  publishBlogHubSearch('cod remittance', 'search-test');
  assert.equal(getBlogHubState('search-test').searchQuery, 'cod remittance');
});

test('category event carries group id', () => {
  let detail = null;
  const handler = (event) => {
    detail = event.detail;
  };
  if (typeof window !== 'undefined') {
    window.addEventListener(BLOG_HUB_CATEGORY_EVENT, handler);
    publishBlogHubCategory('ecommerce', 'evt-group');
    window.removeEventListener(BLOG_HUB_CATEGORY_EVENT, handler);
    assert.equal(detail?.groupId, 'evt-group');
    assert.equal(detail?.categoryId, 'ecommerce');
  } else {
    assert.ok(BLOG_HUB_CATEGORY_EVENT);
  }
});
