import test from 'node:test';
import assert from 'node:assert/strict';
import { splitStylesForTextMarquee } from '../lib/marqueeTextStyles.js';

test('splitStylesForTextMarquee keeps background on shell, text transparent', () => {
  const { shellStyle, textStyle } = splitStylesForTextMarquee({
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '12px 24px',
    width: '480px',
    fontSize: '14px',
    lineHeight: 1.45,
  });
  assert.equal(shellStyle.backgroundColor, '#2563eb');
  assert.equal(shellStyle.padding, '12px 24px');
  assert.equal(shellStyle.width, '100%');
  assert.equal(shellStyle.transform, 'none');
  assert.equal(shellStyle.display, 'flex');
  assert.equal(shellStyle.alignItems, 'center');
  assert.equal(textStyle.lineHeight, 1.45);
  assert.equal(textStyle.fontSize, '14px');
  assert.equal(textStyle.backgroundColor, 'transparent');
  assert.equal(textStyle.color, '#ffffff');
  assert.equal(textStyle.width, 'auto');
});
