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

test('non-active project on localhost falls back to project slug path', () => {
  const home = buildProjectHomePreviewUrl(mainSite, {
    origin: 'http://localhost:3000',
    isActiveProject: false,
  });
  assert.equal(home, 'http://localhost:3000/main-site/home');

  const about = buildPublicPreviewUrl(mainSite, 'about', {
    origin: 'http://localhost:3000',
    isActiveProject: false,
  });
  assert.equal(about, 'http://localhost:3000/main-site/about');
});
