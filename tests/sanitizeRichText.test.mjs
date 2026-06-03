import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeRichText } from '../lib/sanitizeRichText.js';
import { sanitizeInlineLeafHtml } from '../lib/inlineTextHtml.js';
import { richTextFromLegacyContent, normalizeInlineTextProps } from '../lib/richTextNodeProps.js';

test('sanitizeRichText allows inline formatting tags', () => {
  const out = sanitizeRichText('Hello <strong>bold</strong> <em>it</em>');
  assert.match(out, /<strong>bold<\/strong>/);
  assert.match(out, /<em>it<\/em>/);
});

test('sanitizeRichText blocks script and javascript URLs', () => {
  const out = sanitizeRichText(
    '<span onclick="alert(1)">x</span><a href="javascript:alert(1)">link</a><script>bad()</script>'
  );
  assert.ok(!out.includes('script'));
  assert.ok(!out.includes('onclick'));
  assert.ok(!out.includes('javascript:'));
  assert.match(out, /bld-rich-link/);
});

test('sanitizeRichText keeps safe style properties only', () => {
  const out = sanitizeRichText(
    '<span style="color:#ff0000;position:absolute;background-color:#fef08a">hi</span>'
  );
  assert.match(out, /color/i);
  assert.match(out, /background-color/i);
  assert.ok(!out.includes('position'));
  assert.match(out, /bld-text-highlight/);
});

test('sanitizeInlineLeafHtml uses inline sanitizer', () => {
  const out = sanitizeInlineLeafHtml('<b>ok</b><iframe></iframe>');
  assert.match(out, /<b>ok<\/b>/);
  assert.ok(!out.includes('iframe'));
});

test('richTextFromLegacyContent maps props.content', () => {
  const rt = richTextFromLegacyContent({
    content: { mode: 'rich', html: 'Hi <u>there</u>', text: 'Hi there' },
  });
  assert.equal(rt.enabled, true);
  assert.match(rt.html, /<u>there<\/u>/);
  const n = normalizeInlineTextProps({
    text: 'fallback',
    content: { mode: 'rich', html: '<strong>x</strong>', text: 'x' },
  });
  assert.equal(n.richText.enabled, true);
});
