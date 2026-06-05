import test from 'node:test';
import assert from 'node:assert/strict';
import {
  nodeSupportsClickToEdit,
  shouldStartFeatureTabTextEdit,
  shouldStartTextEditFromCanvasClick,
} from '../lib/builderTextEditClick.js';

function clickEvent(target) {
  return { target };
}

test('nodeSupportsClickToEdit covers text leaves and rich_text', () => {
  assert.equal(nodeSupportsClickToEdit('heading'), true);
  assert.equal(nodeSupportsClickToEdit('text'), true);
  assert.equal(nodeSupportsClickToEdit('paragraph'), true);
  assert.equal(nodeSupportsClickToEdit('button'), true);
  assert.equal(nodeSupportsClickToEdit('rich_text'), true);
  assert.equal(nodeSupportsClickToEdit('image'), false);
  assert.equal(nodeSupportsClickToEdit('row'), false);
});

test('shouldStartTextEditFromCanvasClick ignores builder chrome', () => {
  const chrome = {
    closest(sel) {
      if (sel.includes('bld-node__chrome')) return chrome;
      return null;
    },
  };
  assert.equal(shouldStartTextEditFromCanvasClick(clickEvent(chrome), 'heading'), false);
});

test('shouldStartTextEditFromCanvasClick allows heading copy click', () => {
  const heading = {
    closest() {
      return null;
    },
  };
  assert.equal(shouldStartTextEditFromCanvasClick(clickEvent(heading), 'heading'), true);
});

test('shouldStartTextEditFromCanvasClick allows rich_text body click', () => {
  const body = { closest: () => null };
  assert.equal(shouldStartTextEditFromCanvasClick(clickEvent(body), 'rich_text'), true);
});

test('shouldStartFeatureTabTextEdit allows panel paragraph field', () => {
  const field = {
    closest(sel) {
      if (sel.includes('data-bld-feature-tab-field')) return field;
      return null;
    },
  };
  assert.equal(shouldStartFeatureTabTextEdit(clickEvent(field)), true);
});

test('shouldStartFeatureTabTextEdit ignores tab nav button', () => {
  const tabBtn = {
    closest(sel) {
      if (sel.includes('live-feature-tabs__tab')) return tabBtn;
      return null;
    },
  };
  assert.equal(shouldStartFeatureTabTextEdit(clickEvent(tabBtn)), false);
});
