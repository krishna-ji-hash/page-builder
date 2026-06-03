import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInlineTextPropsPatch,
  htmlToPlainText,
  normalizeInlineTextProps,
  normalizeMarqueeProps,
  propsPatchForTextContent,
  resolveInlineTextHtml,
  resolveMarqueeDurationSec,
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

test('normalizeMarqueeProps reads gap alias and defaults gap when enabled', () => {
  const m = normalizeMarqueeProps({ enabled: true, gap: 48, duration: 22 });
  assert.equal(m.gapPx, 48);
  assert.equal(m.duration, 22);
  assert.equal(resolveMarqueeDurationSec(m), 22);
});

test('buildInlineTextPropsPatch plain mode disables rich and restores text', () => {
  const built = buildInlineTextPropsPatch(
    { richText: { enabled: true, html: '<b>Hi</b>', plainText: 'Hi' } },
    'inlineTextMode',
    'plain'
  );
  assert.equal(built.patch.richText.enabled, false);
  assert.equal(built.patch.text, 'Hi');
});

test('sanitizeInlineLeafHtml strips script tags', () => {
  const out = sanitizeInlineLeafHtml('<p>Hi</p><script>alert(1)</script>');
  assert.ok(!out.includes('script'));
  assert.ok(!out.includes('alert'));
});
