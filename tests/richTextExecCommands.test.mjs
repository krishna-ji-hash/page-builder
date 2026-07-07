import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyFontSizePxInRoot,
  applyRichColorInRoot,
  ensureFontSizeMarkupInRoot,
  preserveRichTextSelectionForToolbar,
  readFontSizePxFromRoot,
  restoreRichTextSelection,
  selectAllContentsInRoot,
  selectionNonCollapsedInRoot,
} from '../lib/richTextExecCommands.js';
import { sanitizeInlineLeafHtml } from '../lib/inlineTextHtml.js';

test('preserveRichTextSelectionForToolbar keeps highlighted range when caret collapses', () => {
  if (typeof document === 'undefined') return;

  const root = document.createElement('div');
  root.contentEditable = 'true';
  root.innerHTML = 'Why Ship?';
  document.body.appendChild(root);

  const sel = window.getSelection();
  const range = document.createRange();
  const textNode = root.firstChild;
  range.setStart(textNode, 0);
  range.setEnd(textNode, 3);
  sel.removeAllRanges();
  sel.addRange(range);
  preserveRichTextSelectionForToolbar(root);

  const collapsed = document.createRange();
  collapsed.selectNodeContents(root);
  collapsed.collapse(true);
  sel.removeAllRanges();
  sel.addRange(collapsed);
  preserveRichTextSelectionForToolbar(root);

  restoreRichTextSelection(root);
  assert.equal(selectionNonCollapsedInRoot(root), true);

  root.remove();
});

test('applyRichColorInRoot wraps a single selected character', () => {
  if (typeof document === 'undefined') return;

  const root = document.createElement('div');
  root.contentEditable = 'true';
  root.innerHTML = 'Why Ship with Dispatch?';
  document.body.appendChild(root);

  const sel = window.getSelection();
  const range = document.createRange();
  const textNode = root.firstChild;
  range.setStart(textNode, textNode.length - 1);
  range.setEnd(textNode, textNode.length);
  sel.removeAllRanges();
  sel.addRange(range);

  const result = applyRichColorInRoot(root, 'foreColor', '#17ba2a', { selectAllIfCollapsed: false });
  assert.ok(result);
  assert.notEqual(result.after, result.before);
  assert.match(result.after, /bld-text-accent|color/i);
  assert.match(sanitizeInlineLeafHtml(result.after), /17ba2a|rgb\(23,\s*186,\s*42\)/i);

  root.remove();
});

test('applyRichColorInRoot highlight adds bld-text-highlight class', () => {
  if (typeof document === 'undefined') return;

  const root = document.createElement('div');
  root.contentEditable = 'true';
  root.innerHTML = 'Accent word';
  document.body.appendChild(root);
  selectAllContentsInRoot(root);

  const result = applyRichColorInRoot(root, 'hiliteColor', '#fef08a', { selectAllIfCollapsed: true });
  assert.ok(result);
  assert.match(sanitizeInlineLeafHtml(result.after), /bld-text-highlight|background-color/i);

  root.remove();
});

test('selectAllContentsInRoot and applyRichColorInRoot update innerHTML', () => {
  if (typeof document === 'undefined') return;

  const root = document.createElement('div');
  root.contentEditable = 'true';
  root.innerHTML = 'Promo copy';
  document.body.appendChild(root);

  assert.equal(selectAllContentsInRoot(root), true);
  assert.equal(selectionNonCollapsedInRoot(root), true);

  const result = applyRichColorInRoot(root, 'foreColor', '#ef4444', { selectAllIfCollapsed: true });
  assert.ok(result);
  assert.notEqual(result.after, result.before);
  assert.match(result.after, /color|#ef4444|rgb/i);

  root.remove();
});

test('applyFontSizePxInRoot applies exact px without font size level 7 jump', () => {
  if (typeof document === 'undefined') return;

  const root = document.createElement('p');
  root.contentEditable = 'true';
  root.innerHTML = 'Feature tab paragraph';
  document.body.appendChild(root);
  root.focus();

  const result = applyFontSizePxInRoot(root, 17, { selectAllIfCollapsed: true });
  assert.ok(result);
  assert.notEqual(result.after, result.before);
  assert.doesNotMatch(result.after, /size="7"/i);
  assert.equal(readFontSizePxFromRoot(root, 0), 17);

  const again = applyFontSizePxInRoot(root, 18, { selectAllIfCollapsed: true });
  assert.ok(again);
  assert.equal(readFontSizePxFromRoot(root, 0), 18);
  assert.match(sanitizeInlineLeafHtml(result.after), /font-size:\s*17px/i);
  assert.match(sanitizeInlineLeafHtml(again.after), /font-size:\s*18px/i);

  root.remove();
});

test('applyFontSizePxInRoot persists px when selection stays collapsed', () => {
  if (typeof document === 'undefined') return;

  const root = document.createElement('p');
  root.contentEditable = 'true';
  root.innerHTML = 'Hello';
  document.body.appendChild(root);
  root.focus();

  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);

  const result = applyFontSizePxInRoot(root, 22, { selectAllIfCollapsed: false });
  assert.ok(result);
  assert.notEqual(result.before, result.after);
  assert.match(sanitizeInlineLeafHtml(result.after), /font-size:\s*22px/i);
  assert.equal(readFontSizePxFromRoot(root, 0), 22);

  root.remove();
});

test('applyFontSizePxInRoot sets host inline size for visible preview', () => {
  if (typeof document === 'undefined') return;

  const root = document.createElement('p');
  root.className = 'live-feature-tabs__paragraph live-feature-tabs__editable';
  root.contentEditable = 'true';
  root.innerHTML = 'Smart routing copy';
  document.body.appendChild(root);

  applyFontSizePxInRoot(root, 22, { wholeBlock: true });
  assert.equal(parseInt(root.style.fontSize, 10), 22);
  assert.match(ensureFontSizeMarkupInRoot(root), /font-size:\s*22px/i);

  root.remove();
});

test('applyFontSizePxInRoot wholeBlock applies without selection', () => {
  if (typeof document === 'undefined') return;

  const root = document.createElement('span');
  root.contentEditable = 'true';
  root.innerHTML = '98%';
  document.body.appendChild(root);

  const result = applyFontSizePxInRoot(root, 24, { wholeBlock: true });
  assert.ok(result);
  assert.match(sanitizeInlineLeafHtml(result.after), /font-size:\s*24px/i);
  assert.equal(readFontSizePxFromRoot(root, 0), 24);

  root.remove();
});

test('applyFontSizePxInRoot works when selection is lost (toolbar focus)', () => {
  if (typeof document === 'undefined') return;

  const root = document.createElement('span');
  root.contentEditable = 'true';
  root.innerHTML = '98%';
  root.className = 'live-feature-tabs__editable';
  document.body.appendChild(root);
  window.getSelection()?.removeAllRanges();

  const result = applyFontSizePxInRoot(root, 20, { selectAllIfCollapsed: true });
  assert.ok(result);
  assert.match(sanitizeInlineLeafHtml(result.after), /font-size:\s*20px/i);
  assert.equal(readFontSizePxFromRoot(root, 0), 20);

  root.remove();
});
