import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAdminSearchIndex, searchAdminIndex } from '../lib/admin/adminSearchIndex.js';

test('buildAdminSearchIndex includes platform and project entries', () => {
  const index = buildAdminSearchIndex({
    projects: [{ id: 14, name: 'Dispatch', slug: 'd', type: 'website' }],
    pages: [{ id: 1, title: 'Home', slug: 'home', projectId: 14, projectSlug: 'd', status: 'published' }],
  });
  assert.ok(index.some((e) => e.label === 'Dashboard'));
  assert.ok(index.some((e) => e.label === 'Dispatch'));
  assert.ok(index.some((e) => e.label === 'Home'));
  assert.ok(index.some((e) => e.label.includes('SEO')));
});

test('searchAdminIndex ranks exact label matches first', () => {
  const index = buildAdminSearchIndex({
    projects: [{ id: 1, name: 'Dispatch', slug: 'dispatch' }],
    pages: [],
  });
  const hits = searchAdminIndex(index, 'dispatch');
  assert.ok(hits.length > 0);
  assert.equal(hits[0].label, 'Dispatch');
});
