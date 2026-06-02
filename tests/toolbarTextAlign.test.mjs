import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeToolbarTextAlign, readDeviceTextAlign } from '../lib/toolbarTextAlign.js';

test('normalizeToolbarTextAlign', () => {
  assert.equal(normalizeToolbarTextAlign('center'), 'center');
  assert.equal(normalizeToolbarTextAlign('Centre'), 'center');
  assert.equal(normalizeToolbarTextAlign('end'), 'right');
  assert.equal(readDeviceTextAlign({ typography: { textAlign: 'center' } }), 'center');
});
