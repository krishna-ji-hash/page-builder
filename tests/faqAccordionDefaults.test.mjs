import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendFaqItem,
  normalizeFaqItems,
  patchFaqItems,
  resolveFaqAccordionProps,
} from '../lib/faqAccordionDefaults.js';

test('normalizeFaqItems returns Dispatch Solutions defaults when empty', () => {
  const items = normalizeFaqItems(null);
  assert.equal(items.length, 4);
  assert.ok(items[0].question.includes('Dispatch Solutions'));
});

test('resolveFaqAccordionProps accepts openItemId', () => {
  const items = normalizeFaqItems([]);
  const { openItemId } = resolveFaqAccordionProps({ items, openItemId: items[1].id });
  assert.equal(openItemId, items[1].id);
});

test('patchFaqItems updates answer', () => {
  const items = normalizeFaqItems([]);
  const next = patchFaqItems(items, 0, { answer: 'Updated answer' });
  assert.equal(next[0].answer, 'Updated answer');
});

test('appendFaqItem adds a fifth question', () => {
  const items = normalizeFaqItems([]);
  const next = appendFaqItem(items);
  assert.equal(next.length, 5);
  assert.equal(next[4].question, 'New question');
});
