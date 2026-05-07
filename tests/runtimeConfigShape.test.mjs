import assert from 'node:assert/strict';
import test from 'node:test';
import { getWidgetDefinition } from '../lib/builder/widgetRegistry.js';

test('DynamicTable config shape uses internal users source', () => {
  const table = getWidgetDefinition('dashboard', 'table');
  assert.ok(table);
  assert.ok(Array.isArray(table.defaultProps.columns));
  assert.equal(table.defaultDataSource.kind, 'internal_api');
  assert.equal(table.defaultDataSource.resource, 'users');
  assert.equal(table.defaultDataSource.path, '/api/runtime/data/users');
  assert.equal(table.defaultDataSource.method, 'GET');
});

test('DynamicForm config shape uses internal users submit source', () => {
  const form = getWidgetDefinition('admin', 'form');
  assert.ok(form);
  assert.ok(Array.isArray(form.defaultProps.fields));
  assert.equal(form.defaultDataSource.kind, 'internal_api');
  assert.equal(form.defaultDataSource.resource, 'form_submissions');
  assert.equal(form.defaultDataSource.path, '/api/forms/submit');
  assert.equal(form.defaultDataSource.method, 'POST');
});
