import assert from 'node:assert/strict';
import test from 'node:test';
import { prefixMenuItemsWithProjectSlug, prefixRelativeAppPath } from '../lib/projectPathPrefix.js';

test('prefixRelativeAppPath: maps / and /about under project slug', () => {
  assert.equal(prefixRelativeAppPath('/', 'acme'), '/acme/home');
  assert.equal(prefixRelativeAppPath('/about', 'acme'), '/acme/about');
  assert.equal(prefixRelativeAppPath('/acme/about', 'acme'), '/acme/about');
});

test('prefixRelativeAppPath: leaves absolute and api paths', () => {
  assert.equal(prefixRelativeAppPath('https://x.test/y', 'acme'), 'https://x.test/y');
  assert.equal(prefixRelativeAppPath('/api/foo', 'acme'), '/api/foo');
  assert.equal(prefixRelativeAppPath('#x', 'acme'), '#x');
});

test('prefixMenuItemsWithProjectSlug: prefixes to/href', () => {
  const out = prefixMenuItemsWithProjectSlug([{ label: 'Home', to: '/' }], 'acme');
  assert.equal(out[0].to, '/acme/home');
});
