import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INSPECTOR_FORM_SKIP_OPTIMISTIC_KEYS,
  shouldTrackPendingInspectorForm,
  splitHeroFormFieldsFromProps,
} from '../lib/splitHeroInspectorForm.js';

test('splitHeroFormFieldsFromProps reads carousel props', () => {
  const fields = splitHeroFormFieldsFromProps({
    splitHeroVisualWidthPct: 52,
    splitHeroImageMaxHeightPx: 280,
    splitHeroNavOffsetYPx: 16,
  });
  assert.equal(fields.splitHeroVisualWidthPct, '52');
  assert.equal(fields.splitHeroImageMaxHeightPx, '280');
  assert.equal(fields.splitHeroNavOffsetYPx, '16');
});

test('shouldTrackPendingInspectorForm includes splitHero and carouselImageFit', () => {
  assert.equal(shouldTrackPendingInspectorForm('splitHeroVisualWidthPct'), true);
  assert.equal(shouldTrackPendingInspectorForm('carouselImageFit'), true);
  assert.equal(shouldTrackPendingInspectorForm('splitHeroCtaBackgroundColor'), true);
  assert.equal(shouldTrackPendingInspectorForm('carouselSlidePatch'), false);
  assert.equal(INSPECTOR_FORM_SKIP_OPTIMISTIC_KEYS.has('carouselSlidePatch'), true);
  assert.equal(shouldTrackPendingInspectorForm('splitHeroCtaStylePreset'), false);
  assert.equal(INSPECTOR_FORM_SKIP_OPTIMISTIC_KEYS.has('splitHeroCtaStylePreset'), true);
});
