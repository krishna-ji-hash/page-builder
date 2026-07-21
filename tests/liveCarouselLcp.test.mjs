import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  liveCarouselNativeImgAttrs,
  liveCarouselSlideImageAttrs,
} from '../lib/liveCarouselImageAttrs.js';
import {
  canOptimizeCarouselImageWithNext,
  isFirstLcpFromCarousel,
  splitHeroCarouselSizes,
  splitHeroDefaultIntrinsic,
} from '../lib/liveCarouselImage.js';
import { pickImageLoadingPolicy } from '../lib/liveImagePerf.js';

test('pickImageLoadingPolicy uses low fetchPriority for non-first images', () => {
  assert.equal(pickImageLoadingPolicy(0).fetchPriority, 'high');
  assert.equal(pickImageLoadingPolicy(0).loading, 'eager');
  assert.equal(pickImageLoadingPolicy(2).fetchPriority, 'low');
  assert.equal(pickImageLoadingPolicy(2).loading, 'lazy');
});

test('split hero first slide is eager/high priority only', () => {
  const first = liveCarouselSlideImageAttrs(
    { imageSrc: 'https://images.unsplash.com/x.jpg' },
    { slideIndex: 0, isFirstVisible: true, variant: 'splitHero', splitHeroImageMaxHeightPx: 300, splitHeroVisualWidthPct: 40 }
  );
  assert.equal(first.loading, 'eager');
  assert.equal(first.fetchPriority, 'high');
  assert.equal(first.priority, true);
  assert.ok(first.width > 0);
  assert.equal(first.height, 300);

  const later = liveCarouselSlideImageAttrs(
    { imageSrc: 'https://images.unsplash.com/y.jpg' },
    { slideIndex: 2, isFirstVisible: false, variant: 'splitHero', splitHeroImageMaxHeightPx: 300 }
  );
  assert.equal(later.loading, 'lazy');
  assert.equal(later.fetchPriority, 'low');
  assert.equal(later.priority, false);
});

test('split hero sizes attribute scales to visual column', () => {
  assert.match(splitHeroCarouselSizes(40), /40vw/);
  assert.match(splitHeroCarouselSizes(40), /768px/);
});

test('split hero default intrinsic reserves stable box', () => {
  const dims = splitHeroDefaultIntrinsic({ splitHeroImageMaxHeightPx: 300, visualWidthPct: 40 });
  assert.equal(dims.height, 300);
  assert.ok(dims.width >= 240);
});

test('canOptimizeCarouselImageWithNext allows unsplash and same-origin', () => {
  assert.equal(canOptimizeCarouselImageWithNext('/media/hero.webp'), true);
  assert.equal(
    canOptimizeCarouselImageWithNext('https://images.unsplash.com/photo-1?w=1200'),
    true
  );
  assert.equal(canOptimizeCarouselImageWithNext('data:image/png;base64,abc'), false);
});

test('isFirstLcpFromCarousel detects carousel-before-standalone-image', () => {
  const tree = [
    {
      nodeType: 'row',
      children: [
        {
          nodeType: 'carousel',
          props: { slides: [{ imageSrc: 'https://images.unsplash.com/a.jpg' }] },
        },
        { nodeType: 'image', props: { src: '/later.jpg' } },
      ],
    },
  ];
  assert.equal(isFirstLcpFromCarousel(tree), true);

  const tree2 = [
    { nodeType: 'image', props: { src: '/hero.jpg' } },
    {
      nodeType: 'carousel',
      props: { slides: [{ imageSrc: 'https://images.unsplash.com/a.jpg' }] },
    },
  ];
  assert.equal(isFirstLcpFromCarousel(tree2), false);
});

test('Carousel uses LiveCarouselImage and initial-paint class', () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), 'components/runtime/Carousel.jsx'),
    'utf8'
  );
  assert.ok(src.includes('LiveCarouselImage'));
  assert.ok(src.includes('is-initial-paint'));
  assert.ok(src.includes('isFirstVisible: slideIndex === 0 && activeDotIndex === 0'));
});

test('live-site CSS reserves split hero visual aspect ratio', () => {
  const css = fs.readFileSync(path.resolve(process.cwd(), 'styles/live/live-site.css'), 'utf8');
  assert.ok(css.includes('--split-hero-visual-aspect'));
  assert.ok(css.includes('.live-carousel--splitHero.is-initial-paint'));
  assert.ok(css.includes('aspect-ratio'));
});

test('LcpImagePreload skips carousel-first LCP duplicate', () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), 'components/seo/LcpImagePreload.jsx'),
    'utf8'
  );
  assert.ok(src.includes('isFirstLcpFromCarousel'));
});

test('only one priority flag per first visible slide attrs', () => {
  const slides = [0, 1, 2].map((i) =>
    liveCarouselSlideImageAttrs(
      { imageSrc: `/s${i}.jpg` },
      { slideIndex: i, isFirstVisible: i === 0, variant: 'hero', perView: 1 }
    )
  );
  const priorityCount = slides.filter((s) => s.priority === true).length;
  assert.equal(priorityCount, 1);
});

test('native img attrs omit priority boolean', () => {
  const attrs = liveCarouselNativeImgAttrs(
    { imageSrc: '/logo.png' },
    { slideIndex: 0, isFirstVisible: true }
  );
  assert.equal('priority' in attrs, false);
  assert.equal(attrs.loading, 'eager');
  assert.equal(attrs.fetchPriority, 'high');
});
