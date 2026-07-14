import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlogPlainText } from '../lib/blogPlainText.js';

test('BlogPlainText keeps single newlines as line breaks', () => {
  const html = renderToStaticMarkup(
    createElement(BlogPlainText, {
      text: 'Important updates:\nOrder shipped\nOut for delivery\nDelivered',
    })
  );
  assert.match(html, /Important updates:/);
  assert.match(html, /Order shipped<br\/?>Out for delivery<br\/?>Delivered/);
});

test('BlogPlainText splits double newlines into paragraphs', () => {
  const html = renderToStaticMarkup(
    createElement(BlogPlainText, {
      text: 'First paragraph.\n\nImportant updates:\nOrder shipped\nDelivered',
    })
  );
  assert.match(html, /site-blog-detail__block-body/);
  assert.match(html, /<p>First paragraph\.<\/p>/);
  assert.match(html, /Order shipped<br\/?>Delivered/);
});
