import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInlineTextPropsPatch,
  htmlToPlainText,
  normalizeInlineTextProps,
  propsPatchForTextContent,
  resolveInlineTextHtml,
} from '../lib/richTextNodeProps.js';
import { sanitizeInlineLeafHtml } from '../lib/inlineTextHtml.js';

test('resolveInlineTextHtml prefers richText.html when enabled', () => {
  const n = normalizeInlineTextProps({
    text: 'Plain',
    richText: { enabled: true, html: 'Ship <strong>Orders</strong>', plainText: 'Ship Orders' },
  });
  assert.match(resolveInlineTextHtml(n), /<strong>Orders<\/strong>/);
});

test('propsPatchForTextContent stores richText on inline html', () => {
  const patch = propsPatchForTextContent({}, 'Hello <em>world</em>');
  assert.equal(patch.richText.enabled, true);
  assert.match(patch.richText.html, /<em>world<\/em>/);
  assert.equal(patch.richText.plainText, htmlToPlainText(patch.richText.html));
});

test('buildInlineTextPropsPatch enables marquee', () => {
  const built = buildInlineTextPropsPatch({}, 'marqueeEnabled', true);
  assert.equal(built.patch.marquee.enabled, true);
});

test('sanitizeInlineLeafHtml strips script tags', () => {
  const out = sanitizeInlineLeafHtml('<p>Hi</p><script>alert(1)</script>');
  assert.ok(!out.includes('script'));
  assert.ok(!out.includes('alert'));
});
