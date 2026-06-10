import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureTickerRowSlideArrays,
  getTickerSlidesForRow,
  resolveDualTickerSlides,
  splitLegacySlidesForTicker,
} from '../lib/carouselTickerRows.js';

test('resolveDualTickerSlides falls back to legacy slides for both rows', () => {
  const slides = [{ id: 'a', imageSrc: '/a.png' }, { id: 'b', imageSrc: '/b.png' }];
  const out = resolveDualTickerSlides({ slides });
  assert.equal(out.hasSplitRows, false);
  assert.equal(out.topSlides.length, 2);
  assert.equal(out.bottomSlides.length, 2);
  assert.equal(out.topSlides[0].id, 'a');
});

test('resolveDualTickerSlides uses separate row arrays when set', () => {
  const out = resolveDualTickerSlides({
    slides: [{ id: 'legacy' }],
    tickerSlidesTop: [{ id: 'top-1', imageSrc: '/t.png' }],
    tickerSlidesBottom: [{ id: 'bot-1' }, { id: 'bot-2' }],
  });
  assert.equal(out.hasSplitRows, true);
  assert.equal(out.topSlides.length, 1);
  assert.equal(out.topSlides[0].id, 'top-1');
  assert.equal(out.bottomSlides.length, 2);
});

test('getTickerSlidesForRow and ensureTickerRowSlideArrays', () => {
  const props = { slides: [{ id: 'x', title: 'X' }] };
  assert.equal(getTickerSlidesForRow(props, 'top').length, 1);
  const ensured = ensureTickerRowSlideArrays(props);
  assert.equal(ensured.tickerSlidesTop.length, 1);
  assert.equal(ensured.tickerSlidesBottom.length, 1);
  assert.notEqual(ensured.tickerSlidesTop, ensured.tickerSlidesBottom);
});

test('splitLegacySlidesForTicker copies slides into both rows', () => {
  const split = splitLegacySlidesForTicker([{ id: '1' }, { id: '2' }]);
  assert.equal(split.tickerSlidesTop.length, 2);
  assert.equal(split.tickerSlidesBottom.length, 2);
  assert.equal(split.tickerSlidesTop[0].id, '1');
  assert.equal(split.tickerSlidesBottom[1].id, '2');
});
