import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTickerScrollClasses } from '../lib/carouselTickerShared.js';

test('dual-row ticker opposite: row1 left (ltr), row2 right (rtl)', () => {
  const { row1TrackClass, row2TrackClass } = resolveTickerScrollClasses('ticker', 'opposite');
  assert.equal(row1TrackClass, 'live-carousel__ticker-track--ltr');
  assert.equal(row2TrackClass, 'live-carousel__ticker-track--rtl');
});

test('dual-row ticker defaults to opposite when direction unset', () => {
  const { row1TrackClass, row2TrackClass } = resolveTickerScrollClasses('ticker', '');
  assert.equal(row1TrackClass, 'live-carousel__ticker-track--ltr');
  assert.equal(row2TrackClass, 'live-carousel__ticker-track--rtl');
});

test('dual-row ticker right: both rows same direction (rtl)', () => {
  const { row1TrackClass, row2TrackClass } = resolveTickerScrollClasses('ticker', 'right');
  assert.equal(row1TrackClass, 'live-carousel__ticker-track--rtl');
  assert.equal(row2TrackClass, 'live-carousel__ticker-track--rtl');
});

test('marquee single row uses one track class for both', () => {
  const { row1TrackClass, row2TrackClass, isMarqueeVariant } = resolveTickerScrollClasses('marquee', 'right');
  assert.equal(isMarqueeVariant, true);
  assert.equal(row1TrackClass, 'live-carousel__ticker-track--rtl');
  assert.equal(row2TrackClass, row1TrackClass);
});
