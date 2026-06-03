import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSplitHeroCarouselSectionRow } from '../lib/templateSectionContent.js';

test('buildSplitHeroCarouselSectionRow produces split hero carousel section', () => {
  const row = buildSplitHeroCarouselSectionRow();
  assert.equal(row.nodeType, 'row');
  assert.equal(row.props?.meta?.sectionTemplate, 'splitHeroCarousel');
  const carousel = row.children?.[0]?.children?.[0]?.children?.[0];
  assert.equal(carousel?.nodeType, 'carousel');
  assert.equal(carousel?.props?.variant, 'splitHero');
  assert.equal(carousel?.props?.transitionEffect, 'fade');
  assert.ok(Array.isArray(carousel?.props?.slides) && carousel.props.slides.length >= 2);
  assert.equal(carousel?.props?.slides?.[0]?.badge, 'New • Premium templates');
  assert.equal(carousel?.props?.showArrows, true);
  assert.equal(carousel?.props?.showDots, true);
  assert.equal(carousel?.props?.splitHeroVisualFrame, 'none');
  assert.equal(carousel?.props?.imageFit, 'contain');
});
