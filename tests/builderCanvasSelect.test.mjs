import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveBuilderCanvasSelectTarget,
  splitHeroCarouselNodeIdFromDom,
  isSplitHeroCarouselNode,
} from '../lib/builderCanvasSelect.js';

function clickEvent(target) {
  return { target };
}

test('resolveBuilderCanvasSelectTarget returns nav for split hero dots', () => {
  const dot = { closest(sel) {
    if (sel.includes('split-dot')) return dot;
    if (sel.includes('split-nav')) return {};
    return null;
  }};
  assert.equal(resolveBuilderCanvasSelectTarget(clickEvent(dot), 'column-1'), 'nav');
});

test('resolveBuilderCanvasSelectTarget selects carousel from column click on hero copy', () => {
  const carouselShell = {
    getAttribute(name) {
      return name === 'data-bld-node' ? 'carousel-42' : null;
    },
  };
  const splitHero = {
    closest(sel) {
      if (sel === '[data-bld-node]') return carouselShell;
      if (sel === '.live-carousel--splitHero') return splitHero;
      return null;
    },
  };
  const title = {
    closest(sel) {
      if (sel === '.live-carousel--splitHero') return splitHero;
      if (sel.includes('split-title')) return title;
      return null;
    },
  };
  assert.equal(resolveBuilderCanvasSelectTarget(clickEvent(title), 'column-1'), 'carousel-42');
});

test('splitHeroCarouselNodeIdFromDom reads data-bld-node from carousel shell', () => {
  const shell = { getAttribute: () => '99', closest: () => shell };
  const root = { closest: (sel) => (sel === '[data-bld-node]' ? shell : null) };
  assert.equal(splitHeroCarouselNodeIdFromDom(root), '99');
});

test('isSplitHeroCarouselNode detects splitHero variant', () => {
  assert.equal(isSplitHeroCarouselNode({ nodeType: 'carousel', props: { variant: 'splitHero' } }), true);
  assert.equal(isSplitHeroCarouselNode({ nodeType: 'carousel', props: { variant: 'hero' } }), false);
});
