import test from 'node:test';
import assert from 'node:assert/strict';
import { liveLeafWrapStyleForButton } from '../lib/buttonLeafWrap.js';

test('liveLeafWrapStyleForButton shrink-wraps auto-width buttons', () => {
  const style = liveLeafWrapStyleForButton({ textAlign: 'center', width: 'auto' });
  assert.equal(style.width, 'fit-content');
  assert.equal(style.alignSelf, 'center');
  assert.equal(style.display, 'inline-flex');
});

test('liveLeafWrapStyleForButton honors explicit full-width buttons', () => {
  const style = liveLeafWrapStyleForButton({ textAlign: 'left', width: '100%' });
  assert.equal(style.width, '100%');
  assert.equal(style.display, undefined);
});

test('liveLeafWrapStyleForButton aligns right-track buttons', () => {
  const style = liveLeafWrapStyleForButton({ textAlign: 'right', width: 'auto' });
  assert.equal(style.alignSelf, 'flex-end');
});
