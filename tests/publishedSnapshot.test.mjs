import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePublishedSnapshot } from '../lib/publishedSnapshot.js';

test('accepts valid snapshot', () => {
  const raw = { nodes: [{ nodeType: 'row', children: [] }] };
  const r = parsePublishedSnapshot(raw);
  assert.equal(r.ok, true);
  assert.equal(r.nodes.length, 1);
  assert.equal(r.nodes[0].nodeType, 'row');
});

test('rejects missing nodes array', () => {
  const r = parsePublishedSnapshot({ foo: [] });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'missing_nodes');
});

test('rejects invalid child entry', () => {
  const r = parsePublishedSnapshot({
    nodes: [{ nodeType: 'row', children: [{ nodeType: '' }] }],
  });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'invalid_node');
});

test('rejects non-array children when key present', () => {
  const r = parsePublishedSnapshot({
    nodes: [{ nodeType: 'row', children: {} }],
  });
  assert.equal(r.ok, false);
});

test('preserves style_json, dataJson, and actionsJson for live runtime', () => {
  const raw = {
    nodes: [
      {
        nodeType: 'table',
        dataJson: { source: { kind: 'internal_api', path: '/api/runtime/data/users' } },
        props: { columns: [{ key: 'id', label: 'ID' }] },
        style_json: { desktop: { fontSize: '14px' } },
        children: [],
      },
      {
        nodeType: 'button',
        actionsJson: { onClick: { type: 'navigate', to: '/dashboard' } },
        props: { text: 'Go' },
        children: [],
      },
    ],
  };
  const r = parsePublishedSnapshot(raw);
  assert.equal(r.ok, true);
  assert.deepEqual(r.nodes[0].dataJson, raw.nodes[0].dataJson);
  assert.equal(r.nodes[0].nodeType, 'table');
  assert.deepEqual(r.nodes[1].actionsJson, raw.nodes[1].actionsJson);
});
