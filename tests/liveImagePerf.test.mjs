import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyFigureLayoutStability,
  liveImageIntrinsicAttrs,
  pickImageLoadingPolicy,
  resolveLiveImageDims,
} from '../lib/liveImagePerf.js';
import { findFirstLcpImageUrl } from '../lib/findLcpImageUrl.js';

test('pickImageLoadingPolicy prioritizes first image', () => {
  assert.equal(pickImageLoadingPolicy(0).fetchPriority, 'high');
  assert.equal(pickImageLoadingPolicy(0).loading, 'eager');
  assert.equal(pickImageLoadingPolicy(2).loading, 'lazy');
  assert.equal(pickImageLoadingPolicy(2).fetchPriority, 'low');
});

test('liveImageIntrinsicAttrs uses aspect ratio from style_json', () => {
  const attrs = liveImageIntrinsicAttrs({ aspectRatio: '16 / 9', imageHeightPx: 360 });
  assert.equal(attrs.height, 360);
  assert.ok(attrs.width > 0);
});

test('applyFigureLayoutStability sets minHeight from imageHeightPx', () => {
  const fig = applyFigureLayoutStability({ width: '100%' }, { imageHeightPx: 400 });
  assert.equal(fig.minHeight, '400px');
});

test('findFirstLcpImageUrl walks tree in order', () => {
  const url = findFirstLcpImageUrl([
    { nodeType: 'text', props: { text: 'Hi' } },
    { nodeType: 'image', props: { src: '/hero.jpg' } },
    { nodeType: 'image', props: { src: '/second.jpg' } },
  ]);
  assert.equal(url, '/hero.jpg');
});

test('resolveLiveImageDims reads size.aspectRatio', () => {
  const dims = resolveLiveImageDims(
    { props: { imageHeightPx: 200 } },
    { size: { aspectRatio: '4 / 3' } }
  );
  assert.equal(dims.aspectRatio, '4 / 3');
  assert.equal(dims.imageHeightPx, 200);
});
