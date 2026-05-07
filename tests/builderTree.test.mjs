import assert from 'node:assert/strict';
import test from 'node:test';
import { autoFixTree, reconcileStructuralParents, validateTree } from '../lib/builderTree.js';

test('reconcileStructuralParents fixes stale parentNodeId from nested shape', () => {
  const row = { id: 1, nodeType: 'row', parentNodeId: 99, positionIndex: 5, children: [] };
  const col = { id: 2, nodeType: 'column', parentNodeId: 1, positionIndex: 0, children: [] };
  const stack = { id: 3, nodeType: 'stack', parentNodeId: 1, positionIndex: 0, children: [] };
  row.children = [col];
  col.children = [stack];

  const [outRow] = reconcileStructuralParents([row]);
  assert.equal(outRow.parentNodeId, null);
  assert.equal(outRow.positionIndex, 0);
  const [outCol] = outRow.children;
  assert.equal(outCol.parentNodeId, 1);
  assert.equal(outCol.positionIndex, 0);
  const [outStack] = outCol.children;
  assert.equal(outStack.parentNodeId, 2);
  assert.equal(outStack.positionIndex, 0);
});

test('validateTree accepts canonical row → column → stack → block', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      children: [
        {
          id: 2,
          nodeType: 'column',
          children: [
            {
              id: 3,
              nodeType: 'stack',
              children: [{ id: 4, nodeType: 'heading', children: [] }],
            },
          ],
        },
      ],
    },
  ];
  validateTree(reconcileStructuralParents(tree));
});

test('validateTree rejects stack under row', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      children: [{ id: 3, nodeType: 'stack', children: [] }],
    },
  ];
  assert.throws(() => validateTree(reconcileStructuralParents(tree)), /inside column/);
});

test('autoFixTree moves row-level stacks into first column', () => {
  const tree = [
    {
      id: 10,
      nodeType: 'row',
      children: [
        { id: 20, nodeType: 'column', children: [] },
        { id: 30, nodeType: 'stack', children: [{ id: 40, nodeType: 'heading', children: [] }] },
      ],
    },
  ];
  const fixed = autoFixTree(reconcileStructuralParents(tree));
  validateTree(fixed);
  const col = fixed[0].children.find((c) => c.id === 20);
  assert.equal(col.children.length, 1);
  assert.equal(col.children[0].nodeType, 'stack');
  assert.equal(col.children[0].id, 30);
});
