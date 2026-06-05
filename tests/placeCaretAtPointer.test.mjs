import test from 'node:test';
import assert from 'node:assert/strict';
import { placeCaretAtPointer, selectionIsInsideRoot } from '../lib/placeCaretAtPointer.js';

test('placeCaretAtPointer returns false without coordinates', () => {
  const el = { contains: () => true, focus: () => {} };
  assert.equal(placeCaretAtPointer(el, {}), false);
  assert.equal(placeCaretAtPointer(null, { clientX: 10, clientY: 10 }), false);
});

test('selectionIsInsideRoot is false without selection', () => {
  assert.equal(selectionIsInsideRoot(null), false);
});
