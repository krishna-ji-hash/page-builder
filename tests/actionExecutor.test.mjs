import assert from 'node:assert/strict';
import test from 'node:test';
import {
  executeAction,
  isActionExecutable,
  isSafeApiCallAction,
  isSafeNavigateAction,
  isSafeRefreshDataAction,
  isSafeShowToastAction,
} from '../lib/runtime/actionExecutor.js';

test('isSafeNavigateAction: allows relative app paths only', () => {
  assert.equal(isSafeNavigateAction({ type: 'navigate', to: '/dashboard' }), true);
  assert.equal(isSafeNavigateAction({ type: 'navigate', to: 'https://example.com' }), false);
});

test('isSafeNavigateAction: rejects empty, protocol-relative, and non-objects', () => {
  assert.equal(isSafeNavigateAction(null), false);
  assert.equal(isSafeNavigateAction({ type: 'navigate', to: '' }), false);
  assert.equal(isSafeNavigateAction({ type: 'navigate', to: '//evil.com' }), false);
  assert.equal(isSafeNavigateAction({ type: 'navigate' }), false);
});

test('isSafeNavigateAction: rejects non-navigate and arbitrary payloads', () => {
  assert.equal(isSafeNavigateAction({ type: 'eval', code: '1' }), false);
  assert.equal(
    isSafeNavigateAction({ type: 'navigate', to: 'javascript:alert(1)' }),
    false
  );
});

test('isSafeApiCallAction: internal /api/ paths only', () => {
  assert.equal(
    isSafeApiCallAction({ type: 'apiCall', path: '/api/runtime/data/users', method: 'GET' }),
    true
  );
  assert.equal(isSafeApiCallAction({ type: 'apiCall', path: '//x.com', method: 'GET' }), false);
  assert.equal(isSafeApiCallAction({ type: 'apiCall', path: '/data', method: 'GET' }), false);
  assert.equal(isSafeApiCallAction({ type: 'apiCall', path: '/api/x', method: 'FAKE' }), false);
  assert.equal(
    isSafeApiCallAction({ type: 'apiCall', url: '/api/runtime/data/users', method: 'GET' }),
    true
  );
});

test('isSafeRefreshDataAction and isSafeShowToastAction', () => {
  assert.equal(isSafeRefreshDataAction({ type: 'refreshData' }), true);
  assert.equal(isSafeRefreshDataAction({ type: 'refreshPage' }), true);
  assert.equal(isSafeRefreshDataAction({ type: 'refreshData', key: 't' }), true);
  assert.equal(isSafeShowToastAction({ type: 'showToast', message: 'hi', variant: 'success' }), true);
  assert.equal(isSafeShowToastAction({ type: 'showToast', message: '' }), false);
});

test('isActionExecutable covers supported types', () => {
  assert.equal(isActionExecutable({ type: 'navigate', to: '/' }), true);
  assert.equal(isActionExecutable({ type: 'apiCall', path: '/api/x', method: 'POST' }), true);
  assert.equal(isActionExecutable({ type: 'refreshData' }), true);
  assert.equal(isActionExecutable({ type: 'refreshPage' }), true);
  assert.equal(isActionExecutable({ type: 'showToast', message: 'm' }), true);
  assert.equal(isActionExecutable({ type: 'eval', code: '1' }), false);
});

test('executeAction: navigate does not throw on server (no window)', async () => {
  const r = await executeAction({ type: 'navigate', to: '/ok' });
  assert.equal(r?.ok, true);
});

test('executeAction: showToast and refreshData call runtime', async () => {
  const calls = { toast: 0, bump: 0 };
  await executeAction(
    { type: 'showToast', message: 'x', variant: 'info' },
    { showToast: () => (calls.toast += 1) }
  );
  assert.equal(calls.toast, 1);
  await executeAction(
    { type: 'refreshData' },
    { bumpRefresh: () => (calls.bump += 1) }
  );
  assert.equal(calls.bump, 1);
});

test('executeAction: apiCall uses fetchInternal', async () => {
  const r = await executeAction(
    { type: 'apiCall', path: '/api/runtime/data/users', method: 'GET' },
    { fetchInternal: async () => [{ id: 1 }] }
  );
  assert.equal(r.ok, true);
  assert.deepEqual(r.data, [{ id: 1 }]);
});
