import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LOGO_HOVER_ZOOM_SCALE,
  logoHoverZoomPresentation,
  resolveLogoHoverZoomScale,
} from '../lib/carouselLogoHoverZoom.js';

test('resolveLogoHoverZoomScale clamps and defaults', () => {
  assert.equal(resolveLogoHoverZoomScale(undefined), DEFAULT_LOGO_HOVER_ZOOM_SCALE);
  assert.equal(resolveLogoHoverZoomScale(1.2), 1.2);
  assert.equal(resolveLogoHoverZoomScale(2), 1.5);
  assert.equal(resolveLogoHoverZoomScale(0.5), 1);
});

test('logoHoverZoomPresentation adds class and css var when enabled', () => {
  const off = logoHoverZoomPresentation(false, 1.1, { width: '100%' });
  assert.equal(off.className, '');
  assert.equal(off.style.width, '100%');
  assert.equal(off.style['--carousel-logo-hover-scale'], undefined);

  const on = logoHoverZoomPresentation(true, 1.12, { width: '100%' });
  assert.equal(on.className, 'live-carousel--logo-hover-zoom');
  assert.equal(on.style['--carousel-logo-hover-scale'], '1.12');
});
