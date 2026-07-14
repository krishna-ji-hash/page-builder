import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProjectHomePreviewUrl, buildPublicPreviewUrl } from '../lib/admin/publicPreviewUrl.js';

const mainSite = { slug: 'main-site', homeSlug: 'home', domain: null };
const dispatch = { slug: 'dispatch', homeSlug: 'home', domain: 'dispatch.local' };

test('domain on localhost uses http with dev port', () => {
  const url = buildProjectHomePreviewUrl(dispatch, { origin: 'http://localhost:3000' });
  assert.equal(url, 'http://dispatch.local:3000/');
});

test('domain in production uses https', () => {
  const url = buildProjectHomePreviewUrl(dispatch, { origin: 'https://builder.example.com' });
  assert.equal(url, 'https://dispatch.local/');
});

test('active project on localhost without domain uses site root', () => {
  const home = buildProjectHomePreviewUrl(mainSite, {
    origin: 'http://localhost:3000',
    isActiveProject: true,
  });
  assert.equal(home, 'http://localhost:3000/');

  const about = buildPublicPreviewUrl(mainSite, 'about', {
    origin: 'http://localhost:3000',
    isActiveProject: true,
  });
  assert.equal(about, 'http://localhost:3000/about');
});

test('active project without origin returns relative path (SSR-safe)', () => {
  assert.equal(
    buildPublicPreviewUrl(mainSite, 'page-slug', { isActiveProject: true }),
    '/page-slug'
  );
  assert.equal(buildProjectHomePreviewUrl(mainSite, { isActiveProject: true }), '/');
});

test('non-active project on localhost without domain has no preview url', () => {
  const home = buildProjectHomePreviewUrl(mainSite, {
    origin: 'http://localhost:3000',
    isActiveProject: false,
  });
  assert.equal(home, null);
});

test('active default with domain still uses localhost on dev', () => {
  const project = { slug: 'd', homeSlug: 'home', domain: 'housethat.com' };
  const home = buildProjectHomePreviewUrl(project, {
    origin: 'http://localhost:3000',
    isActiveProject: true,
  });
  assert.equal(home, 'http://localhost:3000/');
});
