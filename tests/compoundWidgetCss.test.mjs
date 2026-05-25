import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCompoundWidgetShellCss } from '../lib/sanitizeLiveLayout.js';

test('sanitizeCompoundWidgetShellCss keeps layout only', () => {
  const out = sanitizeCompoundWidgetShellCss({
    width: '100%',
    padding: '4px 0 0',
    fontFamily: 'Georgia, serif',
    fontSize: '24px',
    color: '#112233',
    '--node-text': '#ffffff',
    '--node-pad': '8px',
  });
  assert.equal(out.width, '100%');
  assert.equal(out.padding, '4px 0 0');
  assert.equal(out['--node-pad'], '8px');
  assert.equal(out.fontFamily, undefined);
  assert.equal(out.fontSize, undefined);
  assert.equal(out.color, undefined);
  assert.equal(out['--node-text'], undefined);
});
