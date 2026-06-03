import assert from 'node:assert/strict';
import test from 'node:test';
import {
  featureTabsChromeToCssVars,
  featureTabsInspectorFormFromProps,
  normalizeFeatureTabsChrome,
  patchFeatureTabsChromeFromKey,
} from '../lib/featureTabsChrome.js';
import { addBulletToActiveTab, newFeatureTabFromList, normalizeFeatureTabs } from '../lib/featureTabsDefaults.js';

test('normalizeFeatureTabsChrome clamps block width', () => {
  const c = normalizeFeatureTabsChrome({ blockMaxWidthPct: 200, panelBorderWidthPx: 99 });
  assert.equal(c.blockMaxWidthPct, 100);
  assert.equal(c.panelBorderWidthPx, 8);
});

test('featureTabsChromeToCssVars emits panel and tab vars', () => {
  const vars = featureTabsChromeToCssVars({
    barBackgroundColor: '#f1f5f9',
    activeTabColor: '#0f172a',
    activeTabUnderlineColor: '#2563eb',
    panelBackgroundColor: '#fff',
    panelBorderColor: '#e2e8f0',
    panelBorderWidthPx: 2,
    panelBorderRadiusPx: 12,
    blockMaxWidthPct: 90,
  });
  assert.equal(vars['--ft-bar-bg'], '#f1f5f9');
  assert.equal(vars['--ft-tab-active-color'], '#0f172a');
  assert.equal(vars['--ft-panel-border-width'], '2px');
  assert.equal(vars['--ft-block-max-width-pct'], '90');
});

test('patchFeatureTabsChromeFromKey updates chrome fields', () => {
  const next = patchFeatureTabsChromeFromKey('featureTabsPanelRadiusPx', 16, {});
  assert.equal(next.panelBorderRadiusPx, 16);
});

test('featureTabsInspectorFormFromProps includes chrome fields', () => {
  const form = featureTabsInspectorFormFromProps(
    { chrome: { barBackgroundColor: '#abc' }, tabAlign: 'left' },
    (_, v) => v
  );
  assert.equal(form.featureTabsBarBg, '#abc');
  assert.equal(form.featureTabsTabAlign, 'left');
});

test('newFeatureTabFromList and addBulletToActiveTab', () => {
  const tabs = normalizeFeatureTabs([{ id: 'a', label: 'One', bullets: ['x'] }]);
  const added = newFeatureTabFromList(tabs);
  assert.ok(added.id);
  const withTab = [...tabs, added];
  const withBullet = addBulletToActiveTab(withTab, 'a');
  assert.equal(withBullet[0].bullets.length, 2);
});
