import test from 'node:test';
import assert from 'node:assert/strict';
import { liveRenderChildKey, liveRenderRootKey } from '../lib/liveRenderKeys.js';

test('liveRenderChildKey stays unique when sibling ids collide', () => {
  const parent = 'root/row:1@0';
  const a = { nodeType: 'stack', id: 42 };
  const b = { nodeType: 'text', id: 42 };
  const ka = liveRenderChildKey(parent, a, 0);
  const kb = liveRenderChildKey(parent, b, 1);
  assert.notEqual(ka, kb);
  assert.match(ka, /stack:42@0$/);
  assert.match(kb, /text:42@1$/);
});

test('liveRenderRootKey includes type and index', () => {
  const key = liveRenderRootKey({ nodeType: 'row', id: 'section-1' }, 2);
  assert.equal(key, 'root/row:section-1@2');
});
