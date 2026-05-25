import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeFeatureTabs,
  patchFeatureTabs,
  resolveFeatureTabsProps,
} from '../lib/featureTabsDefaults.js';

test('normalizeFeatureTabs assigns distinct default images per tab', () => {
  const tabs = normalizeFeatureTabs(null);
  const srcs = tabs.map((t) => t.imageSrc);
  assert.equal(srcs.length, 4);
  assert.notEqual(srcs[0], srcs[1]);
});

test('resolveFeatureTabsProps picks valid activeTabId', () => {
  const { tabs, activeTabId } = resolveFeatureTabsProps({
    tabs: [{ id: 'a', label: 'A', heading: 'H', paragraph: 'P', bullets: [], imageSrc: '/x.svg', imageAlt: 'x' }],
    activeTabId: 'missing',
  });
  assert.equal(tabs.length, 1);
  assert.equal(activeTabId, 'a');
});

test('patchFeatureTabs updates image and bullets from textarea', () => {
  const base = normalizeFeatureTabs([{ id: 't1', label: 'One', heading: 'H', paragraph: 'P', bullets: [], imageSrc: '/a.png' }]);
  const next = patchFeatureTabs(base, 0, {
    imageSrc: '/b.png',
    bullets: 'Line one\nLine two',
  });
  assert.equal(next[0].imageSrc, '/b.png');
  assert.deepEqual(next[0].bullets, ['Line one', 'Line two']);
});
