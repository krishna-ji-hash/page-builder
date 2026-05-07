import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getColumnsForPath,
  getDataSourceDefinition,
  getResourceIdFromPath,
  isMethodAllowedForResource,
  listResourceIds,
} from '../lib/runtime/dataSourceRegistry.js';

test('listResourceIds includes users, leads, orders', () => {
  const ids = listResourceIds();
  assert.ok(ids.includes('users'));
  assert.ok(ids.includes('leads'));
  assert.ok(ids.includes('orders'));
});

test('getDataSourceDefinition: unknown is null', () => {
  assert.equal(getDataSourceDefinition('nope'), null);
});

test('resource definition includes key, label, endpoint, defaults', () => {
  const users = getDataSourceDefinition('users');
  assert.equal(users.key, 'users');
  assert.equal(users.label, 'Users');
  assert.equal(users.endpoint.GET, '/api/runtime/data/users');
  assert.equal(users.endpoint.POST, '/api/runtime/data/users');
  assert.ok(Array.isArray(users.defaultColumns));
  assert.ok(Array.isArray(users.defaultFields));
});

test('getResourceIdFromPath parses approved path', () => {
  assert.equal(getResourceIdFromPath('/api/runtime/data/users'), 'users');
  assert.equal(getResourceIdFromPath('/api/runtime/data/leads'), 'leads');
  assert.equal(getResourceIdFromPath('/api/evil'), null);
  assert.equal(getResourceIdFromPath('https://x.com'), null);
});

test('isMethodAllowedForResource', () => {
  assert.equal(isMethodAllowedForResource('users', 'GET'), true);
  assert.equal(isMethodAllowedForResource('users', 'POST'), true);
  assert.equal(isMethodAllowedForResource('orders', 'GET'), true);
  assert.equal(isMethodAllowedForResource('orders', 'POST'), false);
});

test('getColumnsForPath', () => {
  const cols = getColumnsForPath('/api/runtime/data/users');
  assert.ok(Array.isArray(cols) && cols.length);
  assert.ok(cols.some((c) => c.key === 'email'));
});
