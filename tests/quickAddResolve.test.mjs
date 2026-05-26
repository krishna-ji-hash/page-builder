import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findFirstUnlockedStackId,
  isStackLeafWidgetType,
  resolveQuickAddStackParentId,
} from '../lib/quickAddResolve.js';

test('isStackLeafWidgetType includes advanced elements', () => {
  assert.equal(isStackLeafWidgetType('heading'), true);
  assert.equal(isStackLeafWidgetType('container_box'), true);
  assert.equal(isStackLeafWidgetType('grid_block'), true);
  assert.equal(isStackLeafWidgetType('row'), false);
});

test('resolveQuickAddStackParentId finds ancestor stack', () => {
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
  assert.equal(resolveQuickAddStackParentId(tree, 4), 3);
});

test('findFirstUnlockedStackId skips locked sections', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      props: { meta: { sectionLocked: true } },
      children: [
        {
          id: 2,
          nodeType: 'column',
          children: [{ id: 3, nodeType: 'stack', children: [] }],
        },
      ],
    },
    {
      id: 10,
      nodeType: 'row',
      props: { meta: { sectionLocked: false } },
      children: [
        {
          id: 11,
          nodeType: 'column',
          children: [{ id: 12, nodeType: 'stack', children: [] }],
        },
      ],
    },
  ];
  assert.equal(findFirstUnlockedStackId(tree), 12);
});
