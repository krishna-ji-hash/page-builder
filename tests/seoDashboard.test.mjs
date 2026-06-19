import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRedirectPath, extractFirstHeading, collectInternalLinks } from '../lib/seo/seoPageHelpers.js';
import { validateRedirectLoops } from '../lib/seo/seoRedirectHelpers.js';
import { normalizePageSeo } from '../lib/seo/seoEngine.js';

test('normalizeRedirectPath trims and prefixes slash', () => {
  assert.equal(normalizeRedirectPath('bulk'), '/bulk');
  assert.equal(normalizeRedirectPath('/bulk/'), '/bulk');
});

test('validateRedirectLoops detects simple loop', () => {
  const loops = validateRedirectLoops([
    { sourcePath: '/a', destinationPath: '/b', active: true },
    { sourcePath: '/b', destinationPath: '/a', active: true },
  ]);
  assert.ok(loops.length >= 1);
});

test('extractFirstHeading finds heading text', () => {
  const tree = [{ nodeType: 'heading', props: { text: 'Dispatch Solutions' }, children: [] }];
  assert.equal(extractFirstHeading(tree), 'Dispatch Solutions');
});

test('collectInternalLinks reads menu and button hrefs', () => {
  const tree = [
    {
      nodeType: 'menu',
      props: { items: [{ label: 'About', to: '/about-us' }] },
      children: [],
    },
    { nodeType: 'button', props: { href: '/contact' }, children: [] },
  ];
  const links = collectInternalLinks(tree);
  assert.ok(links.includes('/about-us'));
  assert.ok(links.includes('/contact'));
});

test('page seo sitemapExclude normalizes', () => {
  const seo = normalizePageSeo({ sitemapExclude: true });
  assert.equal(seo.sitemapExclude, true);
});
