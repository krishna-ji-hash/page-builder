import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyInlineFontSizeWithMarkup,
  inlineFontSizeOverridePropsFromHtml,
  lineHeightForFontSizePx,
  parseToolbarFontSizeFromHtml,
  readInlineFontSizePxFromRoot,
  stripToolbarFontSizeFromHtml,
  syncInlineFontSizeHostFromHtml,
} from '../lib/inlineFontSize.js';
import { sanitizeInlineLeafHtml } from '../lib/inlineTextHtml.js';

test('lineHeightForFontSizePx stays tighter than template 1.72', () => {
  assert.equal(lineHeightForFontSizePx(22), '1.35');
  assert.ok(Number(lineHeightForFontSizePx(22)) < 1.72);
});

test('applyInlineFontSizeWithMarkup scales glyphs on feature tab paragraph', () => {
  if (typeof document === 'undefined') return;

  const root = document.createElement('p');
  root.className = 'live-feature-tabs__paragraph live-feature-tabs__editable';
  root.innerHTML = 'Partners, Smart routing automatically chooses the best carrier.';
  document.body.appendChild(root);

  applyInlineFontSizeWithMarkup(root, 22);
  assert.equal(root.getAttribute('data-bld-inline-font-size'), '22');
  assert.equal(readInlineFontSizePxFromRoot(root, 0), 22);
  const computed = parseFloat(getComputedStyle(root).fontSize);
  assert.ok(computed >= 21 && computed <= 23);
  assert.match(sanitizeInlineLeafHtml(root.innerHTML), /font-size:\s*22px/i);

  root.remove();
});

test('inlineFontSizeOverridePropsFromHtml enables template override from saved HTML', () => {
  const html = '<span data-bld-fs="1" style="font-size:22px">Hello</span>';
  assert.equal(parseToolbarFontSizeFromHtml(html), 22);
  const props = inlineFontSizeOverridePropsFromHtml(html);
  assert.equal(props['data-bld-inline-font-size'], '22');
  assert.equal(props.style['--bld-inline-font-size'], '22px');
  assert.deepEqual(inlineFontSizeOverridePropsFromHtml('plain text'), {});
});

test('stripToolbarFontSizeFromHtml removes toolbar size so template CSS can apply', () => {
  const html = '<span data-bld-fs="1" style="font-size:22px">Hi</span>';
  const out = stripToolbarFontSizeFromHtml(html);
  assert.ok(!/font-size/i.test(out));
  assert.ok(!/data-bld-fs/i.test(out));
  assert.match(out, /Hi/);
});

test('syncInlineFontSizeHostFromHtml restores preview from saved markup', () => {
  if (typeof document === 'undefined') return;

  const root = document.createElement('span');
  root.className = 'live-feature-tabs__editable';
  document.body.appendChild(root);

  syncInlineFontSizeHostFromHtml(
    root,
    '<span data-bld-fs="1" style="font-size:20px">98%</span>'
  );
  assert.equal(readInlineFontSizePxFromRoot(root, 0), 20);

  root.remove();
});
