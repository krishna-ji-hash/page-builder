import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyRichColorInRoot,
  selectAllContentsInRoot,
  selectionNonCollapsedInRoot,
} from '../lib/richTextExecCommands.js';

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
