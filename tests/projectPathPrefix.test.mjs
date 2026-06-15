import assert from 'node:assert/strict';
import test from 'node:test';
import { prefixMenuItemsWithProjectSlug, prefixRelativeAppPath } from '../lib/projectPathPrefix.js';
import { normalizeMenuItems } from '../lib/menuItems.js';

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

test('prefixRelativeAppPath: bare page slugs map under project slug', () => {
  assert.equal(prefixRelativeAppPath('domestic-shipping', 'd'), '/d/domestic-shipping');
  assert.equal(prefixRelativeAppPath('about-us', 'acme'), '/acme/about-us');
});

test('prefixRelativeAppPath: hash anchors resolve to home on inner pages', () => {
  assert.equal(
    prefixRelativeAppPath('#features', 'd', { currentPath: '/d/domestic-shipping' }),
    '/d/home#features'
  );
  assert.equal(prefixRelativeAppPath('#features', 'd', { currentPath: '/d/home' }), '#features');
});

test('prefixMenuItemsWithProjectSlug: prefixes to/href', () => {
  const out = prefixMenuItemsWithProjectSlug([{ label: 'Home', to: '/' }], 'acme');
  assert.equal(out[0].to, '/acme/home');
});

test('prefixMenuItemsWithProjectSlug: normalizes bare slugs in nested children', () => {
  const raw = [{ label: 'Services', children: [{ label: 'Domestic', to: 'domestic-shipping' }] }];
  const { items: normalized } = normalizeMenuItems(raw);
  const out = prefixMenuItemsWithProjectSlug(normalized, 'd', '/d/domestic-shipping');
  assert.equal(out[0].children[0].to, '/d/domestic-shipping');
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
    assert.equal(prefixRelativeAppPath('about-us', 'dispatch'), '/about-us');
    assert.equal(
      prefixRelativeAppPath('#pricing', 'dispatch', { currentPath: '/about-us' }),
      '/home#pricing'
    );
    const menu = prefixMenuItemsWithProjectSlug([{ label: 'About', to: '/about-us' }], 'dispatch');
    assert.equal(menu[0].to, '/about-us');
  } finally {
    if (prevSlug === undefined) delete process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG;
    else process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG = prevSlug;
    if (prevFlat === undefined) delete process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS;
    else process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS = prevFlat;
  }
});
