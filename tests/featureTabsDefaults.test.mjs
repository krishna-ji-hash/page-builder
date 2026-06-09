import assert from 'node:assert/strict';
import test from 'node:test';
import {
  featureTabsPropsFingerprint,
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

test('resolveFeatureTabsProps defaults to first tab when defaultTabExplicit is false', () => {
  const tabs = [
    { id: 'delivery-success', label: 'Tab 1', heading: 'H1', paragraph: 'P1', bullets: [], imageSrc: '/a.png' },
    { id: 'enterprise-tech', label: 'Tab 3', heading: 'H3', paragraph: 'P3', bullets: [], imageSrc: '/c.png' },
  ];
  const { activeTabId } = resolveFeatureTabsProps({
    tabs,
    activeTabId: 'enterprise-tech',
  });
  assert.equal(activeTabId, 'delivery-success');
});

test('resolveFeatureTabsProps honors inspector default when defaultTabExplicit is true', () => {
  const tabs = [
    { id: 'delivery-success', label: 'Tab 1', heading: 'H1', paragraph: 'P1', bullets: [], imageSrc: '/a.png' },
    { id: 'enterprise-tech', label: 'Tab 3', heading: 'H3', paragraph: 'P3', bullets: [], imageSrc: '/c.png' },
  ];
  const { activeTabId } = resolveFeatureTabsProps({
    tabs,
    activeTabId: 'enterprise-tech',
    defaultTabExplicit: true,
  });
  assert.equal(activeTabId, 'enterprise-tech');
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

test('featureTabsPropsFingerprint changes when tab copy changes', () => {
  const tabs = normalizeFeatureTabs([{ id: 't1', label: 'One', heading: 'H', paragraph: 'P', bullets: [], imageSrc: '/a.png' }]);
  const a = featureTabsPropsFingerprint({ tabs, activeTabId: 't1' });
  const b = featureTabsPropsFingerprint({
    tabs: patchFeatureTabs(tabs, 0, { heading: 'H2' }),
    activeTabId: 't1',
  });
  assert.notEqual(a, b);
});
