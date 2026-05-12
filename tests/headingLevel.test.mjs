import test from 'node:test';
import assert from 'node:assert/strict';
import { semanticHeadingTypography, normalizeHeadingLevel } from '../lib/headingLevel.js';
import { mergeLeafTypographicAlignmentLayout } from '../lib/nodeLayoutDefaults.js';
import { withHeadingSemanticTypographyIfNeeded } from '../lib/leafStylePipeline.js';

test('semanticHeadingTypography scales h1 larger than h6', () => {
  const h1 = semanticHeadingTypography('h1').fontSize;
  const h6 = semanticHeadingTypography('h6').fontSize;
  assert.ok(String(h1).length > 0);
  assert.ok(String(h6).length > 0);
  assert.notEqual(h1, h6);
});

test('normalizeHeadingLevel accepts uppercase', () => {
  assert.equal(normalizeHeadingLevel('H3'), 'h3');
});

test('mergeLeafTypographicAlignmentLayout adds width for center text', () => {
  const out = mergeLeafTypographicAlignmentLayout('text', {
    typography: { textAlign: 'center', fontSize: '16px' },
    layout: {},
    size: {},
  });
  assert.equal(out.size.width, '100%');
  assert.equal(out.layout.alignSelf, 'stretch');
});

test('withHeadingSemanticTypographyIfNeeded fills fontSize when none persisted', () => {
  const node = {
    nodeType: 'heading',
    props: { tag: 'h1' },
    style_json: { desktop: { typography: { color: '#111' } } },
  };
  const merged = { typography: { color: '#111' } };
  const out = withHeadingSemanticTypographyIfNeeded(node, 'desktop', merged);
  assert.ok(out.typography.fontSize);
  assert.match(String(out.typography.fontSize), /clamp|rem|px/);
});

test('withHeadingSemanticTypographyIfNeeded respects persisted fontSize', () => {
  const node = {
    nodeType: 'heading',
    props: { tag: 'h6' },
    style_json: { desktop: { typography: { fontSize: '80px' } } },
  };
  const merged = { typography: { fontSize: '12px' } };
  const out = withHeadingSemanticTypographyIfNeeded(node, 'desktop', merged);
  assert.equal(out.typography.fontSize, '12px');
});
