import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyBrandLogoSlotPatch,
  brandLogoDisplayUrls,
  brandLogoHasRenderableUrl,
  brandLogoPropsPatchFromFormKey,
  isBrandLogoInspectorNode,
  nodeIsInsideSiteHeader,
  nodeLooksLikeBrandLogo,
  normalizeBrandLogoProps,
  pickBrandLogoSrcForTone,
  resolveBrandLogoActiveTone,
  dedupeBrandLogoChildrenInStack,
} from '../lib/headerLogo.js';

test('nodeLooksLikeBrandLogo detects header image and logo_block', () => {
  assert.equal(nodeLooksLikeBrandLogo({ nodeType: 'logo_block' }), true);
  assert.equal(nodeLooksLikeBrandLogo({ nodeType: 'image', displayName: 'Logo' }), true);
  assert.equal(nodeLooksLikeBrandLogo({ nodeType: 'image', displayName: 'Hero photo' }), false);
});

test('nodeLooksLikeBrandLogo treats header row images as brand logo', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      props: { meta: { isHeader: true, role: 'header' } },
      children: [
        {
          id: 2,
          nodeType: 'column',
          children: [{ id: 3, nodeType: 'image', displayName: 'Image', props: { src: '/a.png' } }],
        },
      ],
    },
  ];
  assert.equal(nodeIsInsideSiteHeader(tree, 3), true);
  assert.equal(nodeLooksLikeBrandLogo(tree[0].children[0].children[0], { tree }), true);
});

test('normalizeBrandLogoProps maps legacy src to light logo', () => {
  const n = normalizeBrandLogoProps({ src: '/a.svg', alt: 'Acme' });
  assert.equal(n.lightLogoUrl, '/a.svg');
  assert.equal(n.alt, 'Acme');
});

test('dark mode falls back to light when darkLogoUrl empty', () => {
  const n = normalizeBrandLogoProps({ lightLogoUrl: '/light.svg', darkLogoUrl: '' });
  const urls = brandLogoDisplayUrls(n);
  assert.equal(urls.dark, '/light.svg');
  assert.equal(urls.useDual, false);
});

test('dual logos when dark differs from light', () => {
  const n = normalizeBrandLogoProps({ lightLogoUrl: '/l.svg', darkLogoUrl: '/d.svg' });
  const urls = brandLogoDisplayUrls(n);
  assert.equal(urls.useDual, true);
});

test('pickBrandLogoSrcForTone returns one url per mode', () => {
  const n = normalizeBrandLogoProps({ lightLogoUrl: '/l.svg', darkLogoUrl: '/d.svg' });
  assert.equal(pickBrandLogoSrcForTone(n, 'light'), '/l.svg');
  assert.equal(pickBrandLogoSrcForTone(n, 'dark'), '/d.svg');
});

test('resolveBrandLogoActiveTone uses site dark preset', () => {
  assert.equal(
    resolveBrandLogoActiveTone({ siteTheme: { presetId: 'dark' } }),
    'dark'
  );
  assert.equal(
    resolveBrandLogoActiveTone({ siteTheme: { presetId: 'light' }, sectionTone: 'light' }),
    'light'
  );
});

test('header dual logos auto mode follow site preset not light header surface', () => {
  const normalized = normalizeBrandLogoProps({ lightLogoUrl: '/l.svg', darkLogoUrl: '/d.svg' });
  assert.equal(
    resolveBrandLogoActiveTone({
      normalized,
      siteTheme: { presetId: 'dark' },
      sectionTone: 'light',
      inSiteHeader: true,
    }),
    'dark'
  );
  assert.equal(
    resolveBrandLogoActiveTone({
      normalized,
      siteTheme: { presetId: 'light' },
      sectionTone: 'dark',
      inSiteHeader: true,
    }),
    'light'
  );
});

test('logo theme site mode always uses site preset', () => {
  const normalized = normalizeBrandLogoProps({
    lightLogoUrl: '/l.svg',
    darkLogoUrl: '/d.svg',
    meta: { logoTheme: 'site' },
  });
  assert.equal(
    resolveBrandLogoActiveTone({
      normalized,
      siteTheme: { presetId: 'dark' },
      sectionTone: 'light',
    }),
    'dark'
  );
});

test('isBrandLogoInspectorNode matches header image for inspector save', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      props: { meta: { isHeader: true } },
      children: [{ id: 2, nodeType: 'image', displayName: 'Image', props: { src: '/a.png' } }],
    },
  ];
  assert.equal(isBrandLogoInspectorNode(tree[0].children[0], tree), true);
});

test('applyBrandLogoSlotPatch sets dark without clearing light', () => {
  const patch = applyBrandLogoSlotPatch(
    'dark',
    '/uploads/p1/dark.svg',
    { lightLogoUrl: '/uploads/p1/light.svg', src: '/uploads/p1/light.svg' }
  );
  assert.equal(patch.darkLogoUrl, '/uploads/p1/dark.svg');
  assert.equal(patch.lightLogoUrl, '/uploads/p1/light.svg');
  assert.equal(patch.logo.darkLogoUrl, '/uploads/p1/dark.svg');
});

test('brandLogoPropsPatchFromFormKey persists logo object', () => {
  const patch = brandLogoPropsPatchFromFormKey('darkLogoUrl', '/dark.svg', { src: '/light.svg' });
  assert.equal(patch.logo.darkLogoUrl, '/dark.svg');
  assert.equal(patch.src, '/light.svg');
  assert.equal(patch.meta.brandLogo, true);
});

test('no renderable url when all empty', () => {
  assert.equal(brandLogoHasRenderableUrl(normalizeBrandLogoProps({})), false);
});

test('dedupeBrandLogoChildrenInStack keeps first logo only', () => {
  const stack = {
    nodeType: 'stack',
    displayName: 'Logo stack',
    children: [
      { nodeType: 'image', displayName: 'Logo', props: { src: '/a.png' } },
      { nodeType: 'image', displayName: 'Logo copy', props: { src: '/b.png' } },
    ],
  };
  const next = dedupeBrandLogoChildrenInStack(stack);
  assert.equal(next.children.length, 1);
  assert.equal(next.children[0].props.src, '/a.png');
});
