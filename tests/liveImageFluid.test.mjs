import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampFigureStyleForViewport,
  clampImgStyleForViewport,
  isFluidImageWidth,
} from '../lib/liveImageFluid.js';

test('isFluidImageWidth treats explicit px as fixed', () => {
  assert.equal(isFluidImageWidth('480px'), false);
  assert.equal(isFluidImageWidth('100%'), true);
  assert.equal(isFluidImageWidth(''), false);
  assert.equal(isFluidImageWidth('fit-content'), false);
});

test('clampFigureStyleForViewport preserves authored px width', () => {
  const { style, fluid } = clampFigureStyleForViewport({ width: '420px' });
  assert.equal(fluid, false);
  assert.equal(style.width, '420px');
  assert.equal(style.maxWidth, '100%');
});

test('clampFigureStyleForViewport marks 100% width as fluid', () => {
  const { style, fluid } = clampFigureStyleForViewport({ width: '100%' });
  assert.equal(fluid, true);
  assert.equal(style.width, '100%');
});

test('clampImgStyleForViewport uses cover + fixed height on desktop fluid image', () => {
  const s = clampImgStyleForViewport(
    { objectFit: 'cover' },
    { imageHeightPx: 420, device: 'desktop', fluid: true }
  );
  assert.equal(s.height, '420px');
  assert.equal(s.objectFit, 'cover');
  assert.equal(s.width, '100%');
});

test('clampImgStyleForViewport hugs bitmap width on desktop when not fluid', () => {
  const s = clampImgStyleForViewport(
    { objectFit: 'cover' },
    { imageHeightPx: 420, device: 'desktop', fluid: false }
  );
  assert.equal(s.height, '420px');
  assert.equal(s.width, 'auto');
});

test('clampImgStyleForViewport uses contain + auto height on mobile', () => {
  const s = clampImgStyleForViewport({ objectFit: 'cover' }, { imageHeightPx: 420, device: 'mobile' });
  assert.equal(s.height, 'auto');
  assert.equal(s.objectFit, 'contain');
  assert.equal(s.maxHeight, '420px');
  assert.equal(s.width, '100%');
});

test('clampImgStyleForViewport respects fill on tablet', () => {
  const s = clampImgStyleForViewport({ objectFit: 'fill' }, { imageHeightPx: 300, device: 'tablet' });
  assert.equal(s.objectFit, 'fill');
  assert.equal(s.height, 'auto');
});
