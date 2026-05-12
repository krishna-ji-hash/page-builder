import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTypographicStackRowToColumnDeviceStyle } from '../lib/stackLayoutCoercion.js';
import { mergeDeviceStyleWithTypeDefaults } from '../lib/nodeLayoutDefaults.js';

test('coerce heading + text stack from row to column', () => {
  const tree = {
    nodeType: 'stack',
    children: [{ nodeType: 'heading' }, { nodeType: 'text' }],
  };
  const out = applyTypographicStackRowToColumnDeviceStyle(tree, {
    layout: { display: 'flex', flexDirection: 'row', gap: 12 },
  });
  assert.equal(out.layout.flexDirection, 'column');
});

test('mergeDeviceStyleWithTypeDefaults applies typographic stack coercion', () => {
  const tree = { nodeType: 'stack', children: [{ nodeType: 'heading' }, { nodeType: 'text' }] };
  const merged = mergeDeviceStyleWithTypeDefaults(
    'stack',
    { layout: { display: 'flex', flexDirection: 'row', gap: 12 } },
    { treeNode: tree }
  );
  assert.equal(merged.layout.flexDirection, 'column');
});

test('respect props.direction horizontal — no coercion', () => {
  const tree = {
    nodeType: 'stack',
    props: { direction: 'horizontal' },
    children: [{ nodeType: 'heading' }, { nodeType: 'text' }],
  };
  const out = applyTypographicStackRowToColumnDeviceStyle(tree, {
    layout: { flexDirection: 'row' },
  });
  assert.equal(out.layout.flexDirection, 'row');
});

test('does not coerce two text siblings', () => {
  const tree = {
    nodeType: 'stack',
    children: [{ nodeType: 'text' }, { nodeType: 'text' }],
  };
  const out = applyTypographicStackRowToColumnDeviceStyle(tree, {
    layout: { flexDirection: 'row' },
  });
  assert.equal(out.layout.flexDirection, 'row');
});
