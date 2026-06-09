import assert from 'node:assert/strict';
import test from 'node:test';
import {
  sanitizeRichHtml,
  shouldStripNeutralDarkCssColor,
  parseCssColorToRgb,
  neutralizeLeafTextCssObject,
} from '../lib/sanitizeRichHtml.js';

test('sanitizeRichHtml strips script', () => {
  const out = sanitizeRichHtml('<p>Hi</p><script>alert(1)</script>');
  assert.ok(!out.includes('script'));
  assert.ok(out.includes('Hi') || out.includes('p'));
});

test('sanitizeRichHtml keeps headings and links', () => {
  const out = sanitizeRichHtml('<h2>Title</h2><p>x <a href="https://example.com">go</a></p>');
  assert.ok(out.includes('h2'));
  assert.ok(out.includes('example.com'));
});

test('sanitizeRichHtml emptyReturn option', () => {
  assert.equal(sanitizeRichHtml('   ', { emptyReturn: '' }), '');
  assert.equal(sanitizeRichHtml('', { emptyReturn: '' }), '');
  assert.ok(sanitizeRichHtml('').includes('p'));
});

test('shouldStripNeutralDarkCssColor detects pasted slate body colors', () => {
  assert.equal(shouldStripNeutralDarkCssColor('#0f172a'), true);
  assert.equal(shouldStripNeutralDarkCssColor('rgb(15, 23, 42)'), true);
  assert.equal(shouldStripNeutralDarkCssColor('#64748b'), true);
  assert.equal(shouldStripNeutralDarkCssColor('black'), true);
  assert.equal(shouldStripNeutralDarkCssColor('hsl(222, 47%, 11%)'), true);
  assert.deepEqual(parseCssColorToRgb('black'), [0, 0, 0]);
  assert.equal(shouldStripNeutralDarkCssColor('#f97316'), false);
  assert.equal(shouldStripNeutralDarkCssColor('#ef4444'), false);
  assert.equal(shouldStripNeutralDarkCssColor('#dc2626'), false);
  assert.equal(shouldStripNeutralDarkCssColor('var(--color-text)'), false);
});

test('sanitizeRichHtml strips pasted white background highlights on paragraphs', () => {
  const html =
    '<p style="background-color:#ffffff;color:#334155">Line one</p><ul><li style="background: white">Item</li></ul>';
  const out = sanitizeRichHtml(html);
  assert.ok(!/background/i.test(out));
  assert.ok(out.includes('Line one'));
  assert.ok(out.includes('Item'));
});

test('sanitizeRichHtml neutralizeHardcodedBodyTextColors strips inline slate on dark preset path', () => {
  const html = '<p style="color: #0f172a">Dispatch copy</p>';
  const plain = sanitizeRichHtml(html);
  assert.ok(plain.includes('#0f172a'));
  const fixed = sanitizeRichHtml(html, { neutralizeHardcodedBodyTextColors: true });
  assert.ok(!fixed.includes('#0f172a'));
  assert.ok(fixed.includes('Dispatch'));
});

test('neutralizeLeafTextCssObject maps neutral dark color and --node-text to readable tokens', () => {
  const a = neutralizeLeafTextCssObject({ color: '#0f172a', fontSize: '18px' }, { darkContentMode: true });
  assert.match(String(a.color), /color-text/);
  assert.equal(a.fontSize, '18px');
  const b = neutralizeLeafTextCssObject(
    { '--node-text': 'rgb(15, 23, 42)', width: '100%' },
    { darkContentMode: true }
  );
  assert.match(String(b['--node-text']), /color-text/);
  assert.equal(b.width, '100%');
  const c = neutralizeLeafTextCssObject({ color: '#f97316' }, { darkContentMode: true });
  assert.equal(c.color, '#f97316');
});
