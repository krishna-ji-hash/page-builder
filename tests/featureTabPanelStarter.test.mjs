import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFeatureTabTwoColumnStarterRoots } from '../lib/featureTabPanelStarter.js';

test('buildFeatureTabTwoColumnStarterRoots — two columns with copy from tab fields', () => {
  const roots = buildFeatureTabTwoColumnStarterRoots({
    heading: 'Dispatch Solutions',
    paragraph: 'Multi-carrier platform.',
    bullets: ['Smart routing', '98% pickup'],
    imageSrc: 'https://example.com/hero.jpg',
    imageAlt: 'Dashboard',
  });
  assert.equal(roots.length, 1);
  assert.equal(roots[0].nodeType, 'row');
  const cols = roots[0].children || [];
  assert.equal(cols.length, 2);
  const copyStack = cols[0]?.children?.[0];
  assert.equal(copyStack?.nodeType, 'stack');
  const copyKids = copyStack?.children || [];
  assert.equal(copyKids[0]?.nodeType, 'heading');
  const counter = copyKids.find((n) => n.nodeType === 'counter_block');
  assert.ok(counter);
  assert.equal(counter.props?.value, '98');
  assert.equal(counter.props?.suffix, '%');
  assert.ok(copyKids.some((n) => n.nodeType === 'button'));
  assert.ok(copyKids.some((n) => n.props?.text?.includes('Smart routing')));
  const visual = cols[1]?.children?.[0]?.children?.[0];
  assert.equal(visual?.nodeType, 'image');
});
