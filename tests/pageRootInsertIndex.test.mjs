import assert from 'node:assert/strict';
import test from 'node:test';

/** Mirror BuilderShell.resolvePageRootInsertIndex (null must not coerce to 0). */
function resolvePageRootInsertIndex(insertIndex, nodes) {
  const countRootRows = (list) =>
    Array.isArray(list) ? list.filter((n) => n?.nodeType === 'row').length : 0;
  if (insertIndex != null && Number.isFinite(Number(insertIndex))) {
    return Math.max(0, Math.trunc(Number(insertIndex)));
  }
  return countRootRows(nodes);
}

const tree = [{ nodeType: 'row', id: 1 }, { nodeType: 'row', id: 2 }];

test('resolvePageRootInsertIndex: null appends after existing root rows', () => {
  assert.equal(resolvePageRootInsertIndex(null, tree), 2);
  assert.equal(resolvePageRootInsertIndex(undefined, tree), 2);
});

test('resolvePageRootInsertIndex: explicit 0 inserts at top', () => {
  assert.equal(resolvePageRootInsertIndex(0, tree), 0);
});

test('resolvePageRootInsertIndex: explicit index honored', () => {
  assert.equal(resolvePageRootInsertIndex(1, tree), 1);
});
