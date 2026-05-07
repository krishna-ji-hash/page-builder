import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStyle, normalizeResponsiveStyle } from '../lib/styleNormalizer.js';

test('normalizeStyle migrates legacy spacing.gap into layout.gap', () => {
  const out = normalizeStyle({
    layout: { display: 'flex' },
    spacing: { gap: '18px', padding: '8px' },
  });
  assert.equal(out.layout.gap, 18);
  assert.equal(out.spacing.gap, undefined);
  assert.ok(out.spacing.padding);
});

test('normalizeResponsiveStyle does not persist spacing.gap on desktop', () => {
  const out = normalizeResponsiveStyle({
    desktop: { spacing: { gap: '12px' } },
  });
  assert.equal(out.desktop.layout.gap, 12);
  assert.equal(out.desktop.spacing.gap, undefined);
});
