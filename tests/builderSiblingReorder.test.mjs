import assert from 'node:assert/strict';
import test from 'node:test';
import { computeMoveDown, computeMoveUp } from '../lib/builderTree.js';

const tree = [
  {
    id: 1,
    nodeType: 'stack',
    children: [
      { id: 10, nodeType: 'heading' },
      { id: 11, nodeType: 'heading' },
      { id: 12, nodeType: 'heading' },
    ],
  },
];

test('computeMoveUp/MoveDown reorder among stack siblings by index', () => {
  assert.deepEqual(computeMoveUp(tree, 11), { nodeId: 11, newParentId: 1, newIndex: 0 });
  assert.deepEqual(computeMoveDown(tree, 11), { nodeId: 11, newParentId: 1, newIndex: 2 });
});
