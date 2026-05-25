import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dividerMarginForPlacement,
  normalizeDividerPlacement,
  resolveDividerInsertPlan,
} from '../lib/dividerInsert.js';

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
            children: [
              { id: 4, nodeType: 'heading' },
              { id: 5, nodeType: 'text' },
            ],
          },
        ],
      },
    ],
  },
  { id: 10, nodeType: 'row', children: [] },
];

test('normalizeDividerPlacement falls back to inside', () => {
  assert.equal(normalizeDividerPlacement('bogus'), 'inside');
  assert.equal(normalizeDividerPlacement('above'), 'above');
});

test('dividerMarginForPlacement adds axis spacing', () => {
  assert.equal(dividerMarginForPlacement('above').bottom, 16);
  assert.equal(dividerMarginForPlacement('left').right, 16);
  assert.equal(dividerMarginForPlacement('inside').top, 16);
});

test('resolveDividerInsertPlan stack-child appends by default', () => {
  const plan = resolveDividerInsertPlan(tree, 4, 'horizontal', 'inside');
  assert.equal(plan?.kind, 'stack-child');
  assert.equal(plan.stackId, 3);
  assert.equal(plan.positionIndex, 2);
});

test('resolveDividerInsertPlan before selected sibling', () => {
  const plan = resolveDividerInsertPlan(tree, 5, 'horizontal', 'before');
  assert.equal(plan?.kind, 'stack-child');
  assert.equal(plan.positionIndex, 1);
});

test('resolveDividerInsertPlan root-row below section', () => {
  const plan = resolveDividerInsertPlan(tree, 4, 'horizontal', 'below');
  assert.equal(plan?.kind, 'root-row');
  assert.equal(plan.positionIndex, 1);
});

test('resolveDividerInsertPlan row-column right', () => {
  const plan = resolveDividerInsertPlan(tree, 4, 'vertical', 'right');
  assert.equal(plan?.kind, 'row-column');
  assert.equal(plan.rowId, 1);
  assert.equal(plan.columnIndex, 1);
});
