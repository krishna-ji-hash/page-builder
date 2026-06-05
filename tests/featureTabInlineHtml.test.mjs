import assert from 'node:assert/strict';
import test from 'node:test';
import {
  featureTabBulletInnerHtml,
  featureTabFieldHasInlineHtml,
  sanitizeFeatureTabFieldHtml,
} from '../lib/featureTabInlineHtml.js';

test('featureTabFieldHasInlineHtml detects font-size spans', () => {
  assert.equal(featureTabFieldHasInlineHtml('98%'), false);
  assert.equal(featureTabFieldHasInlineHtml('<span style="font-size:22px">98%</span>'), true);
});

test('sanitizeFeatureTabFieldHtml keeps font-size', () => {
  const out = sanitizeFeatureTabFieldHtml('<span style="font-size:22px">98%</span>');
  assert.match(out, /font-size:\s*22px/i);
});

test('featureTabBulletInnerHtml escapes plain text', () => {
  assert.equal(featureTabBulletInnerHtml('98%'), '98%');
  assert.match(featureTabBulletInnerHtml('<span style="font-size:20px">98%</span>'), /font-size:\s*20px/i);
});
