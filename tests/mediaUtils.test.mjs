import assert from 'node:assert/strict';
import {
  resolveUploadMime,
  inferMimeFromFilename,
  shouldConvertRasterToWebp,
  kindForMime,
} from '../lib/media/mediaUtils.js';
import { formatLabelForMime } from '../lib/media/mediaLabels.js';

assert.equal(inferMimeFromFilename('photo.webp'), 'image/webp');
assert.equal(inferMimeFromFilename('PHOTO.WEBP'), 'image/webp');

assert.equal(
  resolveUploadMime({ providedMime: '', detectedMime: '', filename: 'banner.webp' }),
  'image/webp'
);

assert.equal(
  resolveUploadMime({ providedMime: 'application/octet-stream', detectedMime: '', filename: 'x.webp' }),
  'image/webp'
);

assert.equal(shouldConvertRasterToWebp('image/jpeg'), true);
assert.equal(shouldConvertRasterToWebp('image/webp'), false);
assert.equal(shouldConvertRasterToWebp('image/gif'), false);

assert.equal(formatLabelForMime('image/webp'), 'WebP');
assert.equal(kindForMime('image/webp'), 'image');

console.log('mediaUtils.test.mjs — all assertions passed');
