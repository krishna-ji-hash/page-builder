import test from 'node:test';
import assert from 'node:assert/strict';
import { patchGridBlockItemFields } from '../lib/gridBlockDefaults.js';

test('patchGridBlockItemFields updates one grid cell', () => {
  const items = [
    { id: 'grid-1', title: 'A', text: 'one' },
    { id: 'grid-2', title: 'B', text: 'two' },
  ];
  const next = patchGridBlockItemFields(items, 1, { title: 'Updated' });
  assert.equal(next[1].title, 'Updated');
  assert.equal(next[1].text, 'two');
  assert.equal(next[0].title, 'A');
});

test('patchGridBlockItemFields ignores invalid index', () => {
  const items = [{ id: 'grid-1', title: 'A', text: 'one' }];
  assert.equal(patchGridBlockItemFields(items, -1, { title: 'X' }), items);
  assert.equal(patchGridBlockItemFields(items, 3, { title: 'X' }), items);
});
