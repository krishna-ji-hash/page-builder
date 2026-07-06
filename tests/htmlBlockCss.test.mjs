import assert from 'node:assert/strict';
import test from 'node:test';
import {
  htmlBlockScopeSelector,
  normalizeHtmlBlockCssInput,
  sanitizeHtmlBlockCssInput,
  scopeHtmlBlockCss,
  splitHtmlBlockStyleFromHtml,
  mergeHtmlBlockCssSources,
} from '../lib/htmlBlockCss.js';

test('htmlBlockScopeSelector escapes quotes in id', () => {
  assert.equal(htmlBlockScopeSelector(42), '[data-html-block-id="42"]');
  assert.equal(htmlBlockScopeSelector('a"b'), '[data-html-block-id="a\\"b"]');
});

test('scopeHtmlBlockCss prefixes simple selectors', () => {
  const out = scopeHtmlBlockCss('.dispatch-process-section { padding: 80px; }', 99);
  assert.ok(out.includes('[data-html-block-id="99"] .dispatch-process-section'));
  assert.ok(out.includes('padding: 80px'));
});

test('scopeHtmlBlockCss scopes selectors inside @media', () => {
  const input = `@media (max-width: 768px) {
  .card { margin: 0; }
}`;
  const out = scopeHtmlBlockCss(input, 7);
  assert.ok(out.includes('@media (max-width: 768px)'));
  assert.ok(out.includes('[data-html-block-id="7"] .card'));
  assert.ok(out.includes('margin: 0'));
  assert.ok(!out.match(/@media[^{]+\{\s*\.card\s*\{/));
});

test('scopeHtmlBlockCss leaves @keyframes unscoped', () => {
  const input = `@keyframes fade {
  from { opacity: 0; }
  to { opacity: 1; }
}`;
  const out = scopeHtmlBlockCss(input, 1);
  assert.equal(out, input);
});

test('scopeHtmlBlockCss handles multiple comma selectors', () => {
  const out = scopeHtmlBlockCss('.a, .b { color: red; }', 5);
  assert.ok(out.includes('[data-html-block-id="5"] .a'));
  assert.ok(out.includes('[data-html-block-id="5"] .b'));
  assert.ok(out.includes('color: red'));
});

test('sanitizeHtmlBlockCssInput strips script-like fragments', () => {
  const out = sanitizeHtmlBlockCssInput('.x{}</style><script>alert(1)</script>');
  assert.ok(!out.includes('</style'));
  assert.ok(!out.includes('<script'));
  assert.ok(out.includes('.x{}'));
});

test('normalizeHtmlBlockCssInput strips style wrappers', () => {
  const out = normalizeHtmlBlockCssInput('<style>.ds-flow { padding: 80px; }</style>');
  assert.equal(out, '.ds-flow { padding: 80px; }');
});

test('splitHtmlBlockStyleFromHtml extracts embedded styles', () => {
  const input = '<section><style>.a{color:red}</style><p>Hi</p></section>';
  const { html, extractedCss } = splitHtmlBlockStyleFromHtml(input);
  assert.equal(html, '<section><p>Hi</p></section>');
  assert.ok(extractedCss.includes('.a{color:red}'));
});

test('scopeHtmlBlockCss maps universal selector to block root', () => {
  const out = scopeHtmlBlockCss('* { box-sizing: border-box; }', 3);
  assert.ok(out.includes('[data-html-block-id="3"], [data-html-block-id="3"] *'));
  assert.ok(out.includes('box-sizing: border-box'));
});
