import test from 'node:test';
import assert from 'node:assert/strict';
import { clampImgStyleForViewport } from '../lib/liveImageFluid.js';

test('clampImgStyleForViewport uses cover + fixed height on desktop', () => {
  const s = clampImgStyleForViewport({ objectFit: 'cover' }, { imageHeightPx: 420, device: 'desktop' });
  assert.equal(s.height, '420px');
  assert.equal(s.objectFit, 'cover');
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
