import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertValidNodeHierarchy,
  assertValidReorderParent,
  isValidNodeHierarchy,
} from '../lib/builderHierarchy.js';
import { PDP_BLOCK_NODE_TYPES } from '../lib/pdpElementRegistry.js';

test('row only at root', () => {
  assertValidNodeHierarchy('row', null);
  assert.throws(() => assertValidNodeHierarchy('row', 'row'), /root only/);
});

test('column only inside row', () => {
  assertValidNodeHierarchy('column', 'row');
  assert.throws(() => assertValidNodeHierarchy('column', null), /inside row/);
  assert.throws(() => assertValidNodeHierarchy('column', 'column'), /inside row/);
});

test('stack only inside column', () => {
  assertValidNodeHierarchy('stack', 'column');
  assert.throws(() => assertValidNodeHierarchy('stack', 'row'), /inside column/);
});

test('stack panel roots may live inside feature tabs (elements mode)', () => {
  assertValidNodeHierarchy('stack', 'tabs');
  assert.throws(() => assertValidNodeHierarchy('heading', 'tabs'), /only stack panel roots/);
  assertValidNodeHierarchy('tabs', 'stack');
});

test('blocks only inside stack', () => {
  assertValidNodeHierarchy('heading', 'stack');
  assertValidNodeHierarchy('text', 'stack');
  assertValidNodeHierarchy('rich_text', 'stack');
  assertValidNodeHierarchy('table', 'stack');
  assertValidNodeHierarchy('form', 'stack');
  assertValidNodeHierarchy('input', 'stack');
  assertValidNodeHierarchy('textarea', 'stack');
  assertValidNodeHierarchy('select', 'stack');
  assertValidNodeHierarchy('submit', 'stack');
  assertValidNodeHierarchy('icon', 'stack');
  assertValidNodeHierarchy('content_card', 'stack');
  assertValidNodeHierarchy('video_embed', 'stack');
  assertValidNodeHierarchy('container_box', 'stack');
  assertValidNodeHierarchy('grid_block', 'stack');
  assertValidNodeHierarchy('table_pro', 'stack');
  assertValidNodeHierarchy('modal', 'stack');
  assertValidNodeHierarchy('stack', 'modal');
  assert.throws(() => assertValidNodeHierarchy('heading', 'modal'), /inside stack/);
  assert.throws(() => assertValidNodeHierarchy('heading', 'row'), /inside stack/);
});

test('isValidNodeHierarchy mirrors assert', () => {
  assert.equal(isValidNodeHierarchy('button', 'stack'), true);
  assert.equal(isValidNodeHierarchy('button', 'row'), false);
});

test('PDP widgets only inside stack', () => {
  for (const nodeType of PDP_BLOCK_NODE_TYPES) {
    assertValidNodeHierarchy(nodeType, 'stack');
    assert.throws(() => assertValidNodeHierarchy(nodeType, 'row'), /inside stack/);
  }
});

test('assertValidReorderParent rejects non-containers', () => {
  assertValidReorderParent(null, null);
  assertValidReorderParent(1, { node_type: 'row' });
  assert.throws(() => assertValidReorderParent(1, { node_type: 'heading' }), /container/);
  assert.throws(() => assertValidReorderParent(1, null), /Parent node not found/);
});
