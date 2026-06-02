import assert from 'node:assert/strict';
import test from 'node:test';
import { segmentRootNodes } from '../lib/liveHeaderStack.js';

test('segmentRootNodes groups consecutive header rows', () => {
  const nodes = [
    { id: 1, nodeType: 'row', props: { meta: { isHeader: true } } },
    { id: 2, nodeType: 'row', props: { meta: { isHeader: true } } },
    { id: 3, nodeType: 'row', props: { meta: {} } },
  ];
  const segments = segmentRootNodes(nodes);
  assert.equal(segments.length, 2);
  assert.equal(segments[0].type, 'header-stack');
  assert.equal(segments[0].items.length, 2);
  assert.equal(segments[1].type, 'single');
  assert.equal(segments[1].items[0].node.id, 3);
});

test('single header row stays single segment', () => {
  const nodes = [{ id: 1, nodeType: 'row', props: { meta: { isHeader: true } } }];
  const segments = segmentRootNodes(nodes);
  assert.equal(segments.length, 1);
  assert.equal(segments[0].type, 'single');
});
