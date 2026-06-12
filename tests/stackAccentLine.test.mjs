import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStackAccentBorderWidth,
  buildStackAccentStylePatch,
  readStackAccentLine,
  resolveAccentLineTarget,
  resolveStackAccentPlan,
} from '../lib/stackAccentLine.js';

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
            props: {},
            style_json: { desktop: { spacing: { padding: { top: 8, right: 12, bottom: 8, left: 0 } } } },
            children: [
              { id: 4, nodeType: 'heading' },
              { id: 5, nodeType: 'text' },
            ],
          },
        ],
      },
    ],
  },
];

test('buildStackAccentBorderWidth left accent', () => {
  assert.equal(buildStackAccentBorderWidth(4, 'left'), '0 0 0 4px');
});

test('resolveStackAccentPlan from heading selection', () => {
  const plan = resolveStackAccentPlan(tree, 4, null);
  assert.equal(plan?.kind, 'stack-accent');
  assert.equal(plan.stackId, 3);
  assert.equal(plan.accent.color, '#2563eb');
});

test('buildStackAccentStylePatch sets left border and padding gap', () => {
  const patch = buildStackAccentStylePatch(
    { color: '#2563eb', thicknessPx: 4, gapPx: 20, side: 'left' },
    tree[0].children[0].children[0].style_json.desktop
  );
  assert.equal(patch.border.width, '0 0 0 4px');
  assert.equal(patch.border.color, '#2563eb');
  assert.equal(patch.spacing.padding.left, 20);
  assert.equal(patch.spacing.padding.top, 8);
});

test('readStackAccentLine from stack meta', () => {
  const stack = {
    props: { meta: { accentLine: { enabled: true, color: '#111', thicknessPx: 3, gapPx: 16 } } },
  };
  const accent = readStackAccentLine(stack);
  assert.equal(accent.color, '#111');
  assert.equal(accent.thicknessPx, 3);
});

test('resolveAccentLineTarget from section row selects column', () => {
  const row = tree[0];
  const target = resolveAccentLineTarget(tree, row.id, row);
  assert.equal(target?.targetNodeId, 2);
  assert.equal(target?.node?.nodeType, 'column');
});

test('resolveAccentLineTarget from section row with section heading uses row', () => {
  const row = {
    ...tree[0],
    props: {
      sectionHeading: {
        enabled: true,
        heading: 'What is Bulk Shipping?',
        description: 'Bulk shipping helps businesses move goods.',
      },
    },
  };
  const treeWithHeading = [{ ...row }];
  const target = resolveAccentLineTarget(treeWithHeading, row.id, row);
  assert.equal(target?.targetNodeId, 1);
  assert.equal(target?.node?.nodeType, 'row');
});
