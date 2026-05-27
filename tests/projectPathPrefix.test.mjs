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

test('prefixRelativeAppPath: flat primary project uses root paths', () => {
  const prevSlug = process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG;
  const prevFlat = process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS;
  process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG = 'dispatch';
  process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS = 'true';
  try {
    assert.equal(prefixRelativeAppPath('/', 'dispatch'), '/home');
    assert.equal(prefixRelativeAppPath('/about-us', 'dispatch'), '/about-us');
    assert.equal(prefixRelativeAppPath('/dispatch/about-us', 'dispatch'), '/about-us');
    const menu = prefixMenuItemsWithProjectSlug([{ label: 'About', to: '/about-us' }], 'dispatch');
    assert.equal(menu[0].to, '/about-us');
  } finally {
    if (prevSlug === undefined) delete process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG;
    else process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG = prevSlug;
    if (prevFlat === undefined) delete process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS;
    else process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS = prevFlat;
  }
});
