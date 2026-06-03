import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSectionHeading,
  normalizeColumnHeading,
  patchSectionHeadingFromKey,
  patchColumnHeadingFromKey,
  sectionHeadingToStyleVars,
  columnHeadingToStyleVars,
  isSectionHeadingInspectorKey,
  isColumnHeadingInspectorKey,
} from '../lib/contentComposer.js';

test('normalizeSectionHeading defaults when missing', () => {
  const s = normalizeSectionHeading(undefined);
  assert.equal(s.enabled, false);
  assert.equal(s.align, 'center');
  assert.equal(s.tag, 'h2');
  assert.equal(s.maxWidth, 760);
  assert.equal(s.spacingBottom, 32);
});

test('patchSectionHeadingFromKey updates enabled and clamps max width', () => {
  const sh = patchSectionHeadingFromKey('sectionHeadingEnabled', true, {});
  assert.equal(sh.enabled, true);
  const sh2 = patchSectionHeadingFromKey('sectionHeadingMaxWidth', 9999, sh);
  assert.equal(sh2.maxWidth, 1400);
});

test('sectionHeadingToStyleVars only when enabled', () => {
  assert.deepEqual(sectionHeadingToStyleVars({ enabled: false }), {});
  const vars = sectionHeadingToStyleVars({ enabled: true, maxWidth: 600, spacingBottom: 24 });
  assert.equal(vars['--bld-section-heading-max-w'], '600px');
  assert.equal(vars['--bld-section-heading-spacing-bottom'], '24px');
});

test('normalizeColumnHeading and patchColumnHeadingFromKey', () => {
  const c = normalizeColumnHeading({ enabled: true, heading: 'Title', align: 'right' });
  assert.equal(c.align, 'right');
  const patched = patchColumnHeadingFromKey('columnHeadingSpacingBottom', 200, c);
  assert.equal(patched.spacingBottom, 120);
});

test('columnHeadingToStyleVars when enabled', () => {
  const vars = columnHeadingToStyleVars({ enabled: true, spacingBottom: 16, align: 'center' });
  assert.equal(vars['--bld-column-heading-spacing-bottom'], '16px');
  assert.equal(vars['--bld-column-heading-align'], 'center');
});

test('inspector key guards', () => {
  assert.equal(isSectionHeadingInspectorKey('sectionHeadingTag'), true);
  assert.equal(isSectionHeadingInspectorKey('text'), false);
  assert.equal(isColumnHeadingInspectorKey('columnHeadingReset'), true);
});
