import test from 'node:test';
import assert from 'node:assert/strict';
import { rootSemanticTag } from '../lib/rootSemanticTag.js';

test('rootSemanticTag: middle rows are section, not positional header/footer', () => {
  const roots = [
    { nodeType: 'row', props: { meta: {} } },
    { nodeType: 'row', props: { meta: { sectionTemplate: 'platformHero' } } },
    { nodeType: 'row', props: { meta: {} } },
  ];
  assert.equal(rootSemanticTag(roots, 0), 'section');
  assert.equal(rootSemanticTag(roots, 1), 'section');
  assert.equal(rootSemanticTag(roots, 2), 'section');
});

test('rootSemanticTag: explicit header/footer meta still wins', () => {
  const roots = [
    { nodeType: 'row', props: { meta: { isHeader: true } } },
    { nodeType: 'row', props: {} },
    { nodeType: 'row', props: { meta: { isFooter: true } } },
  ];
  assert.equal(rootSemanticTag(roots, 0), 'header');
  assert.equal(rootSemanticTag(roots, 1), 'section');
  assert.equal(rootSemanticTag(roots, 2), 'footer');
});
