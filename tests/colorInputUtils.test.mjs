import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hex6ForColorInput,
  isCssGradientImage,
  backgroundImageUrlForInspector,
  isTransparentBackground,
} from '../lib/colorInputUtils.js';

test('hex6ForColorInput resolves hex, rgb, and var() fallbacks', () => {
  assert.equal(hex6ForColorInput('#445e86'), '#445e86');
  assert.equal(hex6ForColorInput('rgb(68, 98, 141)'), '#44628d');
  assert.equal(hex6ForColorInput('var(--token-bg-surface, #ffffff)'), '#ffffff');
  assert.equal(hex6ForColorInput('transparent', '#e2e8f0'), '#e2e8f0');
});

test('isCssGradientImage detects gradient tokens', () => {
  assert.equal(isCssGradientImage('linear-gradient(180deg, #fff, #000)'), true);
  assert.equal(isCssGradientImage('url("/uploads/a.webp")'), false);
});

test('backgroundImageUrlForInspector omits gradients', () => {
  assert.equal(backgroundImageUrlForInspector('linear-gradient(180deg, red, blue)'), '');
  assert.equal(backgroundImageUrlForInspector('/uploads/card.webp'), '/uploads/card.webp');
});

test('isTransparentBackground', () => {
  assert.equal(isTransparentBackground('transparent'), true);
  assert.equal(isTransparentBackground('#445e86'), false);
});
