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

test('normalizeResponsiveStyle defaults stack flexDirection to column when unset', () => {
  const out = normalizeResponsiveStyle(
    { desktop: { layout: { display: 'flex' } } },
    { nodeType: 'stack' }
  );
  assert.equal(out.desktop.layout.flexDirection, 'column');
});

test('normalizeResponsiveStyle keeps explicit stack flexDirection row', () => {
  const out = normalizeResponsiveStyle(
    { desktop: { layout: { display: 'flex', flexDirection: 'row', gap: 8 } } },
    { nodeType: 'stack' }
  );
  assert.equal(out.desktop.layout.flexDirection, 'row');
});

test('normalizeStyle preserves typography whiteSpace', () => {
  const out = normalizeStyle({
    layout: { display: 'block' },
    typography: { fontSize: '16px', whiteSpace: 'pre-wrap' },
  });
  assert.equal(out.typography.whiteSpace, 'pre-wrap');
});
