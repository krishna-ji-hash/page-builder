import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canDeleteProjectPage,
  isDuplicatePageSlugInProject,
  isLivePagePublished,
  normalizeBuilderSlug,
} from '../lib/builder/projectPageRules.js';

test('normalizeBuilderSlug normalizes title-like input', () => {
  assert.equal(normalizeBuilderSlug('  About Us  '), 'about-us');
  assert.equal(normalizeBuilderSlug('Pricing & Plans'), 'pricing-plans');
});

test('duplicate slug rejected inside same project', () => {
  const pages = [
    { id: 1, project_id: 10, slug: 'home' },
    { id: 2, project_id: 10, slug: 'about' },
  ];
  assert.equal(isDuplicatePageSlugInProject(pages, 10, 'about'), true);
});

test('same slug allowed across different projects', () => {
  const pages = [
    { id: 1, project_id: 10, slug: 'about' },
    { id: 2, project_id: 11, slug: 'about' },
  ];
  assert.equal(isDuplicatePageSlugInProject(pages, 10, 'about', 1), false);
  assert.equal(isDuplicatePageSlugInProject(pages, 11, 'about', 2), false);
});

test('last page delete guard', () => {
  assert.equal(canDeleteProjectPage(1), false);
  assert.equal(canDeleteProjectPage(2), true);
});

test('live route should only consider published_version_id', () => {
  assert.equal(isLivePagePublished({ published_version_id: null }), false);
  assert.equal(isLivePagePublished({ published_version_id: 8 }), true);
});

