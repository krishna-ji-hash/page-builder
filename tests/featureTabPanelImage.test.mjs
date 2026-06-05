import assert from 'node:assert/strict';
import test from 'node:test';
import {
  featureTabPanelFigureVars,
  featureTabPanelImageInlineStyle,
} from '../lib/featureTabPanelImage.js';

test('featureTabPanelImageInlineStyle — contain shows full image (default)', () => {
  const s = featureTabPanelImageInlineStyle('contain', 360);
  assert.equal(s.objectFit, 'contain');
  assert.equal(s.height, 'auto');
  assert.equal(s.maxHeight, 'none');
});

test('featureTabPanelImageInlineStyle — legacy cover maps to full contain', () => {
  const s = featureTabPanelImageInlineStyle('cover', 360);
  assert.equal(s.objectFit, 'contain');
  assert.equal(s.height, 'auto');
  assert.equal(s.maxHeight, 'none');
});

test('featureTabPanelImageInlineStyle — fill uses fixed box', () => {
  const s = featureTabPanelImageInlineStyle('fill', 360);
  assert.equal(s.objectFit, 'fill');
  assert.equal(s.height, '360px');
  assert.equal(s.maxHeight, '360px');
});

test('featureTabPanelFigureVars passes fit to CSS vars', () => {
  const v = featureTabPanelFigureVars('fill', 400);
  assert.equal(v['--ft-panel-image-height'], '400px');
  assert.equal(v['--ft-panel-image-fit'], 'fill');
});

test('featureTabPanelFigureVars maps legacy cover to contain', () => {
  const v = featureTabPanelFigureVars('cover', 400);
  assert.equal(v['--ft-panel-image-fit'], 'contain');
});
