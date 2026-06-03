import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveEditableInsertTarget,
  INSERT_TARGET_MESSAGES,
  canQuickAddFromSelection,
} from '../lib/resolveEditableInsertTarget.js';

const tree = [
  {
    id: 1,
    nodeType: 'row',
    props: { meta: {} },
    children: [
      {
        id: 2,
        nodeType: 'column',
        children: [
          {
            id: 3,
            nodeType: 'stack',
            children: [
              { id: 4, nodeType: 'heading', props: { text: 'Hi' } },
              { id: 5, nodeType: 'tabs', props: { tabs: [] } },
            ],
          },
        ],
      },
    ],
  },
];

test('stack selection appends at end', () => {
  const r = resolveEditableInsertTarget(tree, 3);
  assert.equal(r.ok, true);
  assert.equal(r.parentId, 3);
  assert.equal(r.insertIndex, 2);
});

test('widget after sibling in same stack', () => {
  const r = resolveEditableInsertTarget(tree, 4);
  assert.equal(r.ok, true);
  assert.equal(r.parentId, 3);
  assert.equal(r.insertIndex, 1);
});

test('compound widget inserts after sibling in parent stack', () => {
  const r = resolveEditableInsertTarget(tree, 5);
  assert.equal(r.ok, true);
  assert.equal(r.parentId, 3);
  assert.equal(r.insertIndex, 2);
});

test('canQuickAddFromSelection for compound tabs matches resolver', () => {
  assert.equal(canQuickAddFromSelection(tree, { id: 5, nodeType: 'tabs' }), true);
});

test('row resolves to first stack with append', () => {
  const r = resolveEditableInsertTarget(tree, 1);
  assert.equal(r.ok, true);
  assert.equal(r.parentId, 3);
  assert.equal(r.insertIndex, 2);
});

test('column without stack requests createMissingStack', () => {
  const colOnly = [
    {
      id: 10,
      nodeType: 'row',
      children: [{ id: 11, nodeType: 'column', children: [] }],
    },
  ];
  const r = resolveEditableInsertTarget(colOnly, 11);
  assert.equal(r.ok, true);
  assert.equal(r.createMissingStack, true);
  assert.equal(r.stackParentId, 11);
});

test('locked section returns locked', () => {
  const locked = [
    {
      id: 20,
      nodeType: 'row',
      props: { meta: { sectionLocked: true } },
      children: [{ id: 21, nodeType: 'column', children: [{ id: 22, nodeType: 'stack', children: [] }] }],
    },
  ];
  const r = resolveEditableInsertTarget(locked, 22);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'locked');
});

test('canQuickAddFromSelection for heading inside stack', () => {
  const node = { id: 4, nodeType: 'heading' };
  assert.equal(canQuickAddFromSelection(tree, node), true);
});
