import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adminBuilderPagePath,
  adminFlatBuilderPagePath,
} from '../lib/builder/adminBuilderRoutes.js';

const prevEnv = process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG;

test.after(() => {
  if (prevEnv === undefined) {
    delete process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG;
  } else {
    process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG = prevEnv;
  }
});

test('adminFlatBuilderPagePath', () => {
  assert.equal(adminFlatBuilderPagePath('home'), '/admin/builder/home');
  assert.equal(adminFlatBuilderPagePath(''), '/admin/builder');
});

test('adminBuilderPagePath flattens active project by slug', () => {
  process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG = 'd';
  assert.equal(adminBuilderPagePath('d', 'home'), '/admin/builder/home');
  assert.equal(adminBuilderPagePath('dispatch', 'home'), '/admin/builder/dispatch/home');
});

test('adminBuilderPagePath flattens via active opts', () => {
  delete process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG;
  assert.equal(
    adminBuilderPagePath('d', 'about', { id: 14, slug: 'd' }),
    '/admin/builder/about'
  );
  assert.equal(
    adminBuilderPagePath({ id: 14, slug: 'd' }, 'about', { id: 14, slug: 'd' }),
    '/admin/builder/about'
  );
});

test('adminBuilderPagePath keeps slug for non-active project', () => {
  assert.equal(
    adminBuilderPagePath('dispatch', 'home', { id: 14, slug: 'd' }),
    '/admin/builder/dispatch/home'
  );
});
