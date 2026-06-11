import assert from 'node:assert/strict';
import test from 'node:test';
import {
  effectiveDropValidationParent,
  resolveHierarchyAwareDrop,
} from '../lib/resolveHierarchyAwareDrop.js';

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
            displayName: 'Stack 1',
            children: [{ id: 4, nodeType: 'heading', children: [] }],
          },
        ],
      },
    ],
  },
];

test('effectiveDropValidationParent maps block onto column to stack', () => {
  assert.equal(effectiveDropValidationParent('column', 'heading'), 'stack');
  assert.equal(effectiveDropValidationParent('column', 'stack'), 'column');
});

test('resolveHierarchyAwareDrop maps inside-column block drop to stack', () => {
  const payload = resolveHierarchyAwareDrop(tree, 4, 'inside-2');
  assert.deepEqual(payload, { newParentId: 3, newIndex: 1 });
});

test('resolveHierarchyAwareDrop keeps valid stack drop unchanged', () => {
  const payload = resolveHierarchyAwareDrop(tree, 4, 'inside-3');
  assert.deepEqual(payload, { newParentId: 3, newIndex: 0 });
});

test('resolveHierarchyAwareDrop scaffolds stack when column is empty', () => {
  const emptyColTree = [
    {
      id: 10,
      nodeType: 'row',
      children: [
        { id: 11, nodeType: 'column', children: [] },
        {
          id: 12,
          nodeType: 'column',
          children: [
            {
              id: 13,
              nodeType: 'stack',
              children: [{ id: 99, nodeType: 'text', children: [] }],
            },
          ],
        },
      ],
    },
  ];
  const payload = resolveHierarchyAwareDrop(emptyColTree, 99, 'inside-11');
  assert.equal(payload?.needsFulfill, true);
  assert.equal(payload?.insertTarget?.createMissingStack, true);
  assert.equal(payload?.insertTarget?.stackParentId, 11);
});
