import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertValidNodeHierarchy,
  assertValidReorderParent,
  isValidNodeHierarchy,
} from '../lib/builderHierarchy.js';

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

test('blocks only inside stack', () => {
  assertValidNodeHierarchy('heading', 'stack');
  assertValidNodeHierarchy('text', 'stack');
  assertValidNodeHierarchy('rich_text', 'stack');
  assertValidNodeHierarchy('table', 'stack');
  assertValidNodeHierarchy('form', 'stack');
  assert.throws(() => assertValidNodeHierarchy('heading', 'row'), /inside stack/);
});

test('isValidNodeHierarchy mirrors assert', () => {
  assert.equal(isValidNodeHierarchy('button', 'stack'), true);
  assert.equal(isValidNodeHierarchy('button', 'row'), false);
});

test('assertValidReorderParent rejects non-containers', () => {
  assertValidReorderParent(null, null);
  assertValidReorderParent(1, { node_type: 'row' });
  assert.throws(() => assertValidReorderParent(1, { node_type: 'heading' }), /container/);
  assert.throws(() => assertValidReorderParent(1, null), /Parent node not found/);
});
