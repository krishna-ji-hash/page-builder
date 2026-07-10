import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeParagraphBlockHtml } from '../lib/inlineParagraphHtml.js';
import {
  sanitizeInlineLeafHtml,
  sanitizeInlineLeafHtmlForTag,
  unwrapSingleOuterBlockTag,
} from '../lib/inlineTextHtml.js';

test('normalizeParagraphBlockHtml converts div blocks to p', () => {
  const html = '<div>Line one</div><div>Line two</div>';
  const out = normalizeParagraphBlockHtml(html);
  assert.match(out, /<p>Line one<\/p>/);
  assert.match(out, /<p>Line two<\/p>/);
});

test('sanitizeInlineLeafHtml keeps nested p in paragraph blocks', () => {
  const html = normalizeParagraphBlockHtml('<div>First</div><div>Second</div>');
  const safe = sanitizeInlineLeafHtml(html, { paragraphBlocks: true });
  assert.match(safe, /<p>First<\/p>/);
  assert.match(safe, /<p>Second<\/p>/);
});

test('sanitizeInlineLeafHtml preserves toolbar accent color on dark sections', () => {
  const html =
    '<span class="bld-text-accent" style="color:#17ba2a" data-bld-inline="1">Green</span>';
  const safe = sanitizeInlineLeafHtml(html, { neutralizeHardcodedBodyTextColors: true });
  assert.match(safe, /17ba2a|rgb\(23,\s*186,\s*42\)/i);
  assert.match(safe, /bld-text-accent/);
});

test('unwrapSingleOuterBlockTag avoids nested p wrappers', () => {
  const inner = '<p><span style="color:#5b6472">Hello</span></p>';
  const unwrapped = unwrapSingleOuterBlockTag(inner, 'p');
  assert.match(unwrapped, /<span/);
  assert.doesNotMatch(unwrapped, /^<p>/);
  const safe = sanitizeInlineLeafHtmlForTag(inner, 'p');
  assert.match(safe, /Hello/);
  assert.doesNotMatch(safe, /^<p>.*<p>/);
});
