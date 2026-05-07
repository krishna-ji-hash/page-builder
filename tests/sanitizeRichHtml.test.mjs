import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeRichHtml } from '../lib/sanitizeRichHtml.js';

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
