import assert from 'node:assert/strict';
import test from 'node:test';
import {
  shouldWrapRootSectionContent,
  splitRowCssForSectionContentShell,
} from '../lib/sectionContentShell.js';

test('shouldWrapRootSectionContent only for boxed root content rows', () => {
  assert.equal(shouldWrapRootSectionContent('boxed', true), true);
  assert.equal(shouldWrapRootSectionContent('boxed', false), false);
});

test('splitRowCssForSectionContentShell uses flex-start and strips horizontal padding', () => {
  const { sectionCss, innerCss } = splitRowCssForSectionContentShell({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: '28px',
    padding: '48px 24px',
    backgroundColor: '#eef6ff',
    marginLeft: 'calc(50% - 50vw)',
  });
  assert.equal(sectionCss.display, 'block');
  assert.equal(sectionCss.padding, '48px');
  assert.equal(sectionCss.marginLeft, 0);
  assert.equal(innerCss.justifyContent, 'flex-start');
  assert.equal(innerCss.flexDirection, 'row');
});
