import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPublicProjectSlug,
  isReservedProjectSlugSegment,
  isRootPublicPageSlug,
  publicPagePath,
  shouldServeFlatPublicPage,
} from '../lib/publicSiteUrls.js';

test('publicPagePath: flat URLs for primary project', () => {
  const prevSlug = process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG;
  const prevFlat = process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS;
  process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG = 'dispatch';
  process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS = 'true';
  try {
    assert.equal(publicPagePath('dispatch', 'home'), '/home');
    assert.equal(publicPagePath('dispatch', 'about-us'), '/about-us');
    assert.equal(publicPagePath('other', 'home'), '/other/home');
  } finally {
    if (prevSlug === undefined) delete process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG;
    else process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG = prevSlug;
    if (prevFlat === undefined) delete process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS;
    else process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS = prevFlat;
  }
});

test('isRootPublicPageSlug: reserves admin and project slug', () => {
  const prevSlug = process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG;
  process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG = 'dispatch';
  try {
    assert.equal(isRootPublicPageSlug('home'), true);
    assert.equal(isRootPublicPageSlug('admin'), false);
    assert.equal(isRootPublicPageSlug('dispatch'), false);
    assert.equal(shouldServeFlatPublicPage('home'), true);
    assert.equal(shouldServeFlatPublicPage('dispatch'), false);
    assert.equal(getPublicProjectSlug(), 'dispatch');
  } finally {
    if (prevSlug === undefined) delete process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG;
    else process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG = prevSlug;
  }
});

test('isReservedProjectSlugSegment: blocks admin/api but not project slug d', () => {
  assert.equal(isReservedProjectSlugSegment('admin'), true);
  assert.equal(isReservedProjectSlugSegment('api'), true);
  assert.equal(isReservedProjectSlugSegment('preview'), true);
  assert.equal(isReservedProjectSlugSegment('d'), false);
  assert.equal(isReservedProjectSlugSegment('dispatch'), false);
});
