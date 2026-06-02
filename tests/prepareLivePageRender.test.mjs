import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPublishedLiveRenderOptions,
  prepareNodesForLiveRender,
  resolveLiveProjectTheme,
} from '../lib/prepareLivePageRender.js';
import { repairHeaderRowsInTree } from '../lib/headerCompactLayout.js';

test('resolveLiveProjectTheme aligns tokens with dark site preset', () => {
  const { siteTheme, themeTokens } = resolveLiveProjectTheme({
    siteTheme: { presetId: 'dark', colors: {}, typography: {} },
    themeTokens: { mode: 'light', schemaVersion: 1, light: {}, dark: {} },
  });
  assert.equal(siteTheme.presetId, 'dark');
  assert.equal(themeTokens.mode, 'dark');
});

test('prepareNodesForLiveRender repairs header rows', () => {
  const headerRow = {
    id: 'h1',
    nodeType: 'row',
    props: { meta: { isHeader: true, role: 'header' } },
    style_json: {},
    children: [],
  };
  const { nodes } = prepareNodesForLiveRender([headerRow], {
    siteTheme: { presetId: 'light', colors: {}, typography: {} },
  });
  const repaired = repairHeaderRowsInTree([headerRow], { presetId: 'light', colors: {}, typography: {} });
  assert.deepEqual(nodes[0].props?.meta?.role, repaired[0].props?.meta?.role);
});

test('buildPublishedLiveRenderOptions passes themeTokens and presets', () => {
  const opts = buildPublishedLiveRenderOptions(
    {
      siteTheme: { presetId: 'light', colors: {}, typography: {} },
      themeTokens: { mode: 'light', schemaVersion: 1, light: {}, dark: {} },
      animationPresets: { a: 1 },
      stylePresets: { b: 2 },
    },
    { pageSlug: 'home' }
  );
  assert.ok(opts.themeTokens);
  assert.equal(opts.pageSlug, 'home');
  assert.deepEqual(opts.animationPresets, { a: 1 });
  assert.deepEqual(opts.stylePresets, { b: 2 });
});
