import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeFaqFullPageItem,
  resolveFaqFullPageProps,
  patchFaqFullPageItems,
  appendFaqFullPageItem,
  removeFaqFullPageItemAt,
  applyFaqFullPageContentPatch,
  DEFAULT_FAQ_FULL_PAGE_ITEMS,
} from '../lib/faqFullPageDefaults.js';
test('resolveFaqFullPageProps normalizes items with categories', () => {
  const resolved = resolveFaqFullPageProps({
    items: [{ id: 'x', category: 'tracking', question: 'Q?', answer: 'A.' }],
  });
  assert.equal(resolved.items.length, 1);
  assert.equal(resolved.items[0].category, 'tracking');
  assert.equal(resolved.openItemId, 'x');
});

test('resolveFaqFullPageProps falls back to defaults when empty', () => {
  const resolved = resolveFaqFullPageProps({ items: [] });
  assert.equal(resolved.items.length, DEFAULT_FAQ_FULL_PAGE_ITEMS.length);
});

test('patchFaqFullPageItems updates question and category', () => {
  const items = DEFAULT_FAQ_FULL_PAGE_ITEMS.map((item, i) => normalizeFaqFullPageItem(item, i));
  const next = patchFaqFullPageItems(items, 0, { question: 'Updated?', category: 'billing' });
  assert.equal(next[0].question, 'Updated?');
  assert.equal(next[0].category, 'billing');
});

test('appendFaqFullPageItem adds to selected category tab', () => {
  const items = DEFAULT_FAQ_FULL_PAGE_ITEMS.map((item, i) => normalizeFaqFullPageItem(item, i));
  const next = appendFaqFullPageItem(items, 'courier');
  assert.equal(next.length, items.length + 1);
  assert.equal(next[next.length - 1].category, 'courier');
  assert.equal(next[next.length - 1].question, 'New question');
});

test('removeFaqFullPageItemAt keeps at least one item', () => {
  const items = DEFAULT_FAQ_FULL_PAGE_ITEMS.map((item, i) => normalizeFaqFullPageItem(item, i));
  const one = [items[0]];
  assert.deepEqual(removeFaqFullPageItemAt(one, 0), one);
  const next = removeFaqFullPageItemAt(items, 0);
  assert.equal(next.length, items.length - 1);
});

test('applyFaqFullPageContentPatch updates tab label and CTA feature', () => {
  const catPatch = applyFaqFullPageContentPatch({}, 'categoryLabel:support', 'Help Desk');
  assert.ok(catPatch.categories?.some((c) => c.id === 'support' && c.label === 'Help Desk'));
  const featPatch = applyFaqFullPageContentPatch({}, 'ctaFeatureLabel:quick', 'Fast Reply');
  assert.ok(featPatch.ctaFeatures?.some((f) => f.id === 'quick' && f.label === 'Fast Reply'));
});