import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureHeaderActionsVisibleCss,
  headerActionsDataAttrsForNode,
  headerBarClassesForNode,
  headerColumnHasMultipleStacks,
  isFlattenedHeaderStack,
  isHeaderActionsColumnNode,
  isSiteHeaderRowForCompact,
  repairHeaderRowsInTree,
  stripHeaderActionsVisibilityFromStyleJson,
} from '../lib/headerCompactLayout.js';
import { getDeviceStyle } from '../lib/styleToCss.js';

test('isSiteHeaderRowForCompact detects header by name + menu', () => {
  const row = {
    nodeType: 'row',
    displayName: 'Header',
    children: [{ nodeType: 'column', children: [{ nodeType: 'menu' }] }],
  };
  assert.equal(isSiteHeaderRowForCompact(row), true);
});

test('isFlattenedHeaderStack', () => {
  assert.equal(
    isFlattenedHeaderStack({
      nodeType: 'stack',
      children: [{ nodeType: 'image' }, { nodeType: 'menu' }, { nodeType: 'button' }],
    }),
    true
  );
});

test('headerColumnHasMultipleStacks', () => {
  assert.equal(
    headerColumnHasMultipleStacks({
      nodeType: 'column',
      children: [
        { nodeType: 'stack', children: [{ nodeType: 'image' }] },
        { nodeType: 'stack', children: [{ nodeType: 'menu' }] },
      ],
    }),
    true
  );
});

test('stripHeaderActionsVisibilityFromStyleJson removes display none', () => {
  const out = stripHeaderActionsVisibilityFromStyleJson({
    desktop: { layout: { display: 'none', flexDirection: 'row' } },
    mobile: { layout: { display: 'none' } },
  });
  assert.equal(out.desktop.layout.display, undefined);
  assert.equal(out.desktop.layout.flexDirection, 'row');
  assert.equal(out.mobile.layout.display, undefined);
});

test('ensureHeaderActionsVisibleCss restores flex', () => {
  assert.deepEqual(ensureHeaderActionsVisibleCss({ display: 'none' }), { display: 'flex' });
});

test('headerBarClassesForNode assigns unique site-header-* classes', () => {
  const row = {
    nodeType: 'row',
    displayName: 'Header',
    props: { meta: { isHeader: true, headerLayout: 'spread' } },
    children: [{ nodeType: 'menu' }],
  };
  assert.match(headerBarClassesForNode(row, { device: 'desktop' }), /site-header-bar site-header-bar--desktop/);
  const actions = {
    nodeType: 'column',
    displayName: 'Actions',
    children: [{ nodeType: 'stack', children: [{ nodeType: 'button' }] }],
  };
  assert.equal(headerBarClassesForNode(actions, { device: 'desktop', insideSiteHeaderRow: true }), 'site-header-actions');
  assert.match(headerBarClassesForNode(row, { device: 'mobile' }), /site-header-bar--compact/);
});

test('isHeaderActionsColumnNode', () => {
  assert.equal(
    isHeaderActionsColumnNode({
      nodeType: 'column',
      children: [{ nodeType: 'stack', children: [{ nodeType: 'button' }] }],
    }),
    true
  );
});

test('repairHeaderRowsInTree sets mobile row layout', () => {
  const tree = repairHeaderRowsInTree([
    {
      nodeType: 'row',
      displayName: 'Header',
      style_json: { desktop: { layout: { flexDirection: 'row' } }, mobile: { layout: { flexDirection: 'column' } } },
      children: [{ nodeType: 'menu' }],
    },
  ]);
  const mobile = getDeviceStyle(tree[0].style_json, 'mobile');
  assert.equal(mobile.layout.flexDirection, 'row');
  assert.equal(tree[0].props.meta.isHeader, true);
});
