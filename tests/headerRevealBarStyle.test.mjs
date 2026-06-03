import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeHeaderBehavior } from '../lib/headerBehavior.js';
import {
  headerRevealBarToCssVars,
  patchHeaderRevealBarFromFormKey,
} from '../lib/headerRevealBarStyle.js';

test('patchHeaderRevealBarFromFormKey updates width and colors', () => {
  const bar = patchHeaderRevealBarFromFormKey('headerRevealBarMaxWidthPct', '88', {});
  assert.equal(bar.maxWidthPct, 88);
  const bar2 = patchHeaderRevealBarFromFormKey('headerRevealBarBackgroundColor', '#f8fafc', bar);
  assert.equal(bar2.backgroundColor, '#f8fafc');
});

test('headerRevealBarToCssVars emits width and chrome vars', () => {
  const vars = headerRevealBarToCssVars({
    maxWidthPct: 90,
    backgroundColor: '#ffffff',
    borderColor: '#2563eb',
    borderWidthPx: 1,
    borderRadiusPx: 12,
    shadow: 'light',
  });
  assert.equal(vars['--header-reveal-bar-width-pct'], '90');
  assert.equal(vars['--header-reveal-bar-bg'], '#ffffff');
  assert.equal(vars['--header-reveal-bar-border-color'], '#2563eb');
  assert.equal(vars['--header-reveal-bar-radius'], '12px');
  assert.ok(vars['--header-reveal-bar-shadow']);
});

test('normalizeHeaderBehavior preserves revealBar', () => {
  const hb = normalizeHeaderBehavior({
    type: 'mainReveal',
    revealBar: { maxWidthPct: 85, borderRadiusPx: 8 },
  });
  assert.equal(hb.revealBar.maxWidthPct, 85);
  assert.equal(hb.revealBar.borderRadiusPx, 8);
});
