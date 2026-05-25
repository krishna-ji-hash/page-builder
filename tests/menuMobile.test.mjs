import test from 'node:test';
import assert from 'node:assert/strict';
import {
  menuDrawerStyleVars,
  menuHamburgerAlignToJustify,
  normalizeMenuDrawerActionsLayout,
  normalizeMenuDrawerDensity,
  normalizeMenuHamburgerAlign,
  resolveMenuMobileBreakpointPx,
} from '../lib/menuMobile.js';

test('normalizeMenuHamburgerAlign', () => {
  assert.equal(normalizeMenuHamburgerAlign('left'), 'left');
  assert.equal(normalizeMenuHamburgerAlign('CENTER'), 'center');
  assert.equal(normalizeMenuHamburgerAlign('nope', 'right'), 'right');
});

test('menuHamburgerAlignToJustify', () => {
  assert.equal(menuHamburgerAlignToJustify('left'), 'flex-start');
  assert.equal(menuHamburgerAlignToJustify('center'), 'center');
  assert.equal(menuHamburgerAlignToJustify('right'), 'flex-end');
});

test('resolveMenuMobileBreakpointPx', () => {
  assert.equal(resolveMenuMobileBreakpointPx({}), 1024);
  assert.equal(resolveMenuMobileBreakpointPx({ breakpointPx: 640 }), 640);
  assert.equal(resolveMenuMobileBreakpointPx({ breakpointPx: 50 }), 1024);
});

test('normalizeMenuDrawerActionsLayout', () => {
  assert.equal(normalizeMenuDrawerActionsLayout('column'), 'column');
  assert.equal(normalizeMenuDrawerActionsLayout('ROW'), 'row');
  assert.equal(normalizeMenuDrawerActionsLayout('nope', 'row'), 'row');
});

test('normalizeMenuDrawerDensity', () => {
  assert.equal(normalizeMenuDrawerDensity('roomy'), 'roomy');
  assert.equal(normalizeMenuDrawerDensity('COMPACT'), 'compact');
  assert.equal(normalizeMenuDrawerDensity('x', 'balanced'), 'balanced');
});

test('menuDrawerStyleVars', () => {
  const compact = menuDrawerStyleVars({ drawerDensity: 'compact' });
  const roomy = menuDrawerStyleVars({ drawerDensity: 'roomy' });
  assert.ok(compact['--menu-m-link-pad']);
  assert.notEqual(compact['--menu-m-link-pad'], roomy['--menu-m-link-pad']);
});
