/**
 * Preserve textarea line breaks from the blog CMS editor on live / builder.
 * Double newlines → paragraphs; single newlines → <br />.
 */
import { createElement, Fragment } from 'react';

/**
 * @param {{ text?: string, className?: string }} props
 */
export function BlogPlainText({ text, className = '' }) {
  const raw = String(text ?? '');
  if (!raw) return createElement('p', { className: className || undefined });

  if (!raw.includes('\n')) {
    return createElement('p', { className: className || undefined }, raw);
  }

  const paragraphs = raw
    .split(/\n\s*\n/)
    .map((chunk) => chunk.replace(/^\n+|\n+$/g, ''))
    .filter((chunk) => chunk.length > 0);

  const renderLines = (chunk) =>
    chunk.split('\n').map((line, index, arr) =>
      createElement(
        Fragment,
        { key: index },
        line,
        index < arr.length - 1 ? createElement('br') : null
      )
    );

  if (paragraphs.length <= 1) {
    return createElement('p', { className: className || undefined }, renderLines(raw));
  }

  return createElement(
    'div',
    { className: ['site-blog-detail__block-body', className].filter(Boolean).join(' ') },
    paragraphs.map((para, index) => createElement('p', { key: index }, renderLines(para)))
  );
}
