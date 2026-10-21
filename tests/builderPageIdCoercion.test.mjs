import assert from 'node:assert/strict';
import test from 'node:test';

/**
 * Mirror of getPageIdByProjectAndPageSlug id coercion (PG bigint → string).
 * Full service import pulls next/cache; keep this focused.
 */
function coercePageId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

test('coercePageId accepts PG string bigint ids', () => {
  assert.equal(coercePageId('25'), 25);
  assert.equal(coercePageId(25), 25);
  assert.equal(coercePageId(25n), 25);
});

test('coercePageId rejects invalid ids', () => {
  assert.equal(coercePageId(null), null);
  assert.equal(coercePageId(undefined), null);
  assert.equal(coercePageId(''), null);
  assert.equal(coercePageId('abc'), null);
  assert.equal(coercePageId(0), null);
  assert.equal(coercePageId(-1), null);
});

test('legacy Number.isInteger without Number() fails on PG strings (regression)', () => {
  const raw = '25';
  assert.equal(Number.isInteger(raw), false);
  assert.equal(coercePageId(raw), 25);
});
