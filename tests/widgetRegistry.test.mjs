import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getWidgetDefinition,
  getWidgetPickerEntries,
  getWidgetPickerTypes,
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
  assert.equal(isWidgetAllowed('website', 'tabs'), true);
  assert.equal(isWidgetAllowed('website', 'accordion'), true);
  assert.equal(isWidgetAllowed('website', 'divider'), true);
  assert.equal(isWidgetAllowed('website', 'table'), true);
  assert.equal(isWidgetAllowed('website', 'form'), true);
});

test('isWidgetAllowed: dashboard includes table and form', () => {
  assert.equal(isWidgetAllowed('dashboard', 'table'), true);
  assert.equal(isWidgetAllowed('dashboard', 'form'), true);
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

test('getWidgetDefinition: website table has spreadsheet-style defaults', () => {
  const def = getWidgetDefinition('website', 'table');
  assert.ok(def);
  assert.equal(def.label, 'Table');
  assert.ok(Array.isArray(def.defaultProps.columns));
  assert.equal(def.defaultProps.columns[0].label, 'A');
  assert.ok(Array.isArray(def.defaultProps.rows));
  assert.equal(def.defaultProps.rows[0].a, 12);
  assert.equal(def.supportsData, false);
});

test('getWidgetDefinition returns null for missing widget', () => {
  assert.equal(getWidgetDefinition('website', 'nonexistent_widget'), null);
});

test('form defaults include fields and submitLabel', () => {
  const form = getWidgetDefinition('website', 'form');
  assert.ok(form);
  assert.ok(Array.isArray(form.defaultProps.fields));
  assert.equal(form.defaultProps.submitLabel, 'Submit');
  assert.equal(form.defaultDataSource.method, 'POST');
});

test('getWidgetPickerTypes: website includes form and compound widgets', () => {
  const types = getWidgetPickerTypes('website');
  assert.ok(types.includes('form'));
  assert.ok(types.includes('divider'));
  assert.ok(types.includes('accordion'));
  assert.ok(types.includes('tabs'));
  assert.ok(types.includes('table'));
});

test('getWidgetPickerEntries: labels come from registry', () => {
  const entries = getWidgetPickerEntries('website');
  const form = entries.find((e) => e.type === 'form');
  assert.ok(form);
  assert.equal(form.label, 'Form');
});

test('getWidgetPickerTypes: dashboard includes table', () => {
  const types = getWidgetPickerTypes('dashboard');
  assert.ok(types.includes('table'));
  assert.ok(types.includes('form'));
});

test('getWidgetDefinition: menu includes default nav items', () => {
  const def = getWidgetDefinition('website', 'menu');
  assert.ok(def);
  assert.equal(def.supportsActions, false);
  assert.ok(Array.isArray(def.defaultProps.items));
  assert.equal(def.defaultProps.items[0].label, 'Home');
});
