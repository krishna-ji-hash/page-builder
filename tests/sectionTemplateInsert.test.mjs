import test from 'node:test';
import assert from 'node:assert/strict';
import {
  columnHasOnlyPlaceholderStacks,
  flattenTemplateIntoColumnBulkNodes,
  isPlaceholderEmptyStack,
  resolveSectionTemplateInsertContext,
} from '../lib/sectionTemplateInsert.js';

const tree = [
  {
    id: 1,
    nodeType: 'row',
    displayName: 'Section',
    children: [
      {
        id: 2,
        nodeType: 'column',
        displayName: 'Column 1',
        children: [{ id: 3, nodeType: 'stack', displayName: 'Stack 1', children: [] }],
      },
    ],
  },
];

test('resolveSectionTemplateInsertContext — column selection', () => {
  const ctx = resolveSectionTemplateInsertContext(tree, 2);
  assert.equal(ctx.mode, 'column');
  assert.equal(ctx.columnId, 2);
  assert.equal(ctx.rowId, 1);
  assert.equal(ctx.positionIndex, 1);
});

test('resolveSectionTemplateInsertContext — stack inside column', () => {
  const ctx = resolveSectionTemplateInsertContext(tree, 3);
  assert.equal(ctx.mode, 'column');
  assert.equal(ctx.columnId, 2);
});

test('resolveSectionTemplateInsertContext — no target uses page root', () => {
  assert.deepEqual(resolveSectionTemplateInsertContext(tree, null), { mode: 'page-root' });
});

test('isPlaceholderEmptyStack', () => {
  assert.equal(isPlaceholderEmptyStack({ nodeType: 'stack', displayName: 'Stack 1', children: [] }), true);
  assert.equal(
    isPlaceholderEmptyStack({ nodeType: 'stack', displayName: 'Timeline content', children: [] }),
    false
  );
});

test('columnHasOnlyPlaceholderStacks', () => {
  assert.equal(
    columnHasOnlyPlaceholderStacks({
      nodeType: 'column',
      children: [{ nodeType: 'stack', displayName: 'Stack 1', children: [] }],
    }),
    true
  );
  assert.equal(
    columnHasOnlyPlaceholderStacks({
      nodeType: 'column',
      children: [{ nodeType: 'stack', displayName: 'Content', children: [{ id: 1, nodeType: 'heading' }] }],
    }),
    false
  );
});

test('flattenTemplateIntoColumnBulkNodes', () => {
  const templateRoot = {
    nodeType: 'row',
    displayName: 'Timeline',
    props: { meta: { sectionTemplate: 'timeline' } },
    children: [
      {
        nodeType: 'column',
        displayName: 'Timeline column',
        children: [
          {
            nodeType: 'stack',
            displayName: 'Timeline content',
            props: { meta: { tplRole: 'section-inner' } },
            children: [
              {
                nodeType: 'heading',
                displayName: 'Title',
                props: { text: 'How delivery unfolds' },
              },
            ],
          },
        ],
      },
    ],
  };
  const nodes = flattenTemplateIntoColumnBulkNodes(templateRoot, 99, 0);
  assert.ok(nodes.length >= 2);
  assert.equal(nodes[0].parentNodeId, 99);
  assert.equal(nodes[0].nodeType, 'stack');
  assert.equal(nodes[1].parentRef, nodes[0].tempId);
  assert.equal(nodes[1].nodeType, 'heading');
});
