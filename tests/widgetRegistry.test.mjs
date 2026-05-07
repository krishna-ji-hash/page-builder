import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getWidgetDefinition,
  getWidgetsForProjectType,
  isWidgetAllowed,
  widgetRegistry,
} from '../lib/builder/widgetRegistry.js';

test('getWidgetsForProjectType: unknown type falls back to website', () => {
  const w = getWidgetsForProjectType('unknown-xyz');
  assert.equal(w.heading, widgetRegistry.website.heading);
});

test('isWidgetAllowed: website has core marketing widgets only', () => {
  assert.equal(isWidgetAllowed('website', 'heading'), true);
  assert.equal(isWidgetAllowed('website', 'rich_text'), true);
  assert.equal(isWidgetAllowed('website', 'menu'), true);
  assert.equal(isWidgetAllowed('website', 'table'), false);
  assert.equal(isWidgetAllowed('website', 'form'), false);
});

test('isWidgetAllowed: dashboard includes table, not form', () => {
  assert.equal(isWidgetAllowed('dashboard', 'table'), true);
  assert.equal(isWidgetAllowed('dashboard', 'form'), false);
});

test('isWidgetAllowed: admin includes table and form', () => {
  assert.equal(isWidgetAllowed('admin', 'table'), true);
  assert.equal(isWidgetAllowed('admin', 'form'), true);
  assert.equal(isWidgetAllowed('admin', 'menu'), true);
  assert.equal(isWidgetAllowed('admin', 'carousel'), true);
});

test('isWidgetAllowed: dashboard includes menu and carousel', () => {
  assert.equal(isWidgetAllowed('dashboard', 'menu'), true);
  assert.equal(isWidgetAllowed('dashboard', 'carousel'), true);
});

test('getWidgetDefinition: table has columns default and supportsData', () => {
  const def = getWidgetDefinition('dashboard', 'table');
  assert.ok(def);
  assert.equal(def.supportsData, true);
  assert.ok(Array.isArray(def.defaultProps.columns));
  assert.ok(def.defaultProps.columns.some((c) => c.key === 'id'));
});

test('table data_json shape: internal users endpoint', () => {
  const table = getWidgetDefinition('dashboard', 'table');
  assert.ok(table.defaultDataSource);
  assert.equal(table.defaultDataSource.kind, 'internal_api');
  assert.equal(table.defaultDataSource.resource, 'users');
  assert.ok(table.defaultDataSource.path.startsWith('/api/'));
});

test('getWidgetDefinition returns null for missing widget', () => {
  assert.equal(getWidgetDefinition('website', 'table'), null);
});

test('form defaults include fields and submitLabel', () => {
  const form = getWidgetDefinition('admin', 'form');
  assert.ok(form);
  assert.ok(Array.isArray(form.defaultProps.fields));
  assert.equal(form.defaultProps.submitLabel, 'Submit');
  assert.equal(form.defaultDataSource.method, 'POST');
});

test('getWidgetDefinition: menu includes default nav items', () => {
  const def = getWidgetDefinition('website', 'menu');
  assert.ok(def);
  assert.equal(def.supportsActions, false);
  assert.ok(Array.isArray(def.defaultProps.items));
  assert.equal(def.defaultProps.items[0].label, 'Home');
});
