import assert from 'node:assert/strict';
import test from 'node:test';
import {
  patchSplitHeroCopyTypoFromStyleKey,
  splitHeroCopyTypoToCssVars,
  splitHeroCtaOutlinePreset,
  splitHeroTypoInspectorFormFields,
} from '../lib/splitHeroCopyTypography.js';

test('patchSplitHeroCopyTypoFromStyleKey updates title typography', () => {
  const patch = patchSplitHeroCopyTypoFromStyleKey('fontSizePx', 42, {});
  assert.equal(patch.splitHeroCopyTypo.titleFontSizePx, 42);
  const vars = splitHeroCopyTypoToCssVars(patch.splitHeroCopyTypo);
  assert.equal(vars['--split-hero-title-font-size'], '42px');
});

test('CTA outline preset sets css vars', () => {
  const vars = splitHeroCopyTypoToCssVars(splitHeroCtaOutlinePreset());
  assert.equal(vars['--split-hero-cta-bg'], '#ffffff');
  assert.equal(vars['--split-hero-cta-border-color'], '#2563eb');
});

test('splitHeroTypoInspectorFormFields reads props', () => {
  const fields = splitHeroTypoInspectorFormFields({
    splitHeroCopyTypo: { titleFontSizePx: 36, titleColor: '#ffffff', bodyColor: '#cbd5e1' },
  });
  assert.equal(fields.fontSizePx, 36);
  assert.equal(fields.textColor, '#ffffff');
  assert.equal(fields.splitHeroBodyColor, '#cbd5e1');
});
