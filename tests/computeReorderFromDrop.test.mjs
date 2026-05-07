import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeMoveDown,
  computeMoveUp,
  computeReorderFromDrop,
  getSiblingContext,
} from '../lib/builderTree.js';

const tree = [
  {
    id: 1,
    nodeType: 'row',
    positionIndex: 0,
    children: [
      {
        id: 2,
        nodeType: 'column',
        parentNodeId: 1,
        positionIndex: 0,
        children: [
          {
            id: 3,
            nodeType: 'stack',
            parentNodeId: 2,
            positionIndex: 0,
            children: [
              { id: 4, nodeType: 'heading', parentNodeId: 3, positionIndex: 0, children: [] },
              { id: 5, nodeType: 'text', parentNodeId: 3, positionIndex: 1, children: [] },
            ],
          },
        ],
      },
    ],
  },
  { id: 10, nodeType: 'row', positionIndex: 1, children: [] },
];

test('before target uses sibling index after excluding dragged node', () => {
  const payload = computeReorderFromDrop(tree, 5, 'before-4');
  assert.deepEqual(payload, { newParentId: 3, newIndex: 0 });
});

test('root append places at end among root rows', () => {
  const payload = computeReorderFromDrop(tree, 1, 'root-drop-append');
  assert.deepEqual(payload, { newParentId: null, newIndex: 1 });
});

test('inside parent appends as last child', () => {
  const payload = computeReorderFromDrop(tree, 4, 'inside-3');
  assert.deepEqual(payload, { newParentId: 3, newIndex: 1 });
});

test('returns null for unknown droppable id', () => {
  assert.equal(computeReorderFromDrop(tree, 4, 'unknown'), null);
});

test('getSiblingContext finds nested siblings', () => {
  const ctx = getSiblingContext(tree, 5);
  assert.ok(ctx);
  assert.equal(ctx.parentId, 3);
  assert.deepEqual(ctx.siblingIds, [4, 5]);
  assert.equal(ctx.index, 1);
});

test('computeMoveUp / computeMoveDown', () => {
  assert.deepEqual(computeMoveUp(tree, 5), { nodeId: 5, newParentId: 3, newIndex: 0 });
  assert.equal(computeMoveUp(tree, 4), null);
  assert.deepEqual(computeMoveDown(tree, 4), { nodeId: 4, newParentId: 3, newIndex: 1 });
  assert.equal(computeMoveDown(tree, 5), null);
});
