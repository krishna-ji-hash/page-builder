import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FLOATING_TOOLBAR_SELECTOR,
  isFocusInFloatingToolbar,
  shouldDeferInlineEditBlurCommit,
} from '../lib/inlineEditBlurGuard.js';

test('FLOATING_TOOLBAR_SELECTOR includes inline toolbar class', () => {
  assert.match(FLOATING_TOOLBAR_SELECTOR, /bld-floating-inline-toolbar/);
});

test('shouldDeferInlineEditBlurCommit when color picker session is open', () => {
  assert.equal(shouldDeferInlineEditBlurCommit(null, true), true);
});

test('shouldDeferInlineEditBlurCommit for relatedTarget inside toolbar', () => {
  const el = { closest: (sel) => (sel === FLOATING_TOOLBAR_SELECTOR ? el : null), matches: () => false };
  assert.equal(shouldDeferInlineEditBlurCommit({ relatedTarget: el }, false), true);
});

test('isFocusInFloatingToolbar is false without document focus', () => {
  assert.equal(isFocusInFloatingToolbar(), false);
});
