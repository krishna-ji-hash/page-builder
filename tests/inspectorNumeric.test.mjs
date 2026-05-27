import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampFiniteNumber,
  numInputDisplayValue,
  parseFiniteNumber,
  stripNaNFromStyleJson,
} from '../lib/inspectorNumeric.js';

test('numInputDisplayValue never returns NaN', () => {
  assert.equal(numInputDisplayValue(NaN), '');
  assert.equal(numInputDisplayValue('bad'), '');
  assert.equal(numInputDisplayValue(undefined, 12), 12);
  assert.equal(numInputDisplayValue(24), 24);
});

test('parseFiniteNumber rejects invalid input', () => {
  assert.equal(parseFiniteNumber(''), null);
  assert.equal(parseFiniteNumber('12.5'), 12.5);
  assert.equal(parseFiniteNumber('x'), null);
});

test('stripNaNFromStyleJson removes non-finite numbers', () => {
  const out = stripNaNFromStyleJson({
    layout: { gap: NaN, flexGrow: 1 },
    tablet: { layout: { gap: 8, zIndex: NaN } },
  });
  assert.equal(out.layout.gap, undefined);
  assert.equal(out.layout.flexGrow, 1);
  assert.equal(out.tablet.layout.gap, 8);
  assert.equal(out.tablet.layout.zIndex, undefined);
});

test('clampFiniteNumber clamps and falls back', () => {
  assert.equal(clampFiniteNumber(999, { min: 0, max: 120, fallback: 0 }), 120);
  assert.equal(clampFiniteNumber('x', { min: 0, max: 120, fallback: 0 }), 0);
});
