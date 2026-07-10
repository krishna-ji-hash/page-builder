import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyBrandLogoSlotPatch,
  brandLogoDisplayUrls,
  brandLogoHasRenderableUrl,
  brandLogoPropsPatchFromFormKey,
  imageSrcPropsPatch,
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
  assert.equal(nodeLooksLikeBrandLogo({ nodeType: 'image', displayName: 'India Post logo' }), false);
  assert.equal(
    nodeLooksLikeBrandLogo({
      nodeType: 'image',
      displayName: 'India Post logo',
      props: { lightLogoUrl: '/uploads/p1/india-post.webp' },
    }),
    true
  );
});

test('nodeLooksLikeBrandLogo excludes courier partner grid images', () => {
  const tree = [
    {
      id: 10,
      nodeType: 'row',
      children: [
        {
          id: 11,
          nodeType: 'stack',
          props: { meta: { tplRole: 'courier-partner-card' } },
          children: [
            {
              id: 12,
              nodeType: 'image',
              displayName: 'India Post logo',
              props: { src: '/builder-placeholder.svg', lightLogoUrl: '/uploads/p1/india.webp' },
            },
          ],
        },
      ],
    },
  ];
  assert.equal(
    nodeLooksLikeBrandLogo(tree[0].children[0].children[0], { tree }),
    false
  );
});

test('partner-logo-image meta is not brand logo even without tree context', () => {
  const node = {
    nodeType: 'image',
    displayName: 'Ecom Express logo',
    props: {
      src: '/uploads/new.webp',
      lightLogoUrl: '/uploads/old.webp',
      meta: { tplRole: 'partner-logo-image' },
    },
  };
  assert.equal(nodeLooksLikeBrandLogo(node), false);
});

test('imageSrcPropsPatch clears stale brand fields on courier partner upload', () => {
  const tree = [
    {
      id: 10,
      nodeType: 'row',
      children: [
        {
          id: 11,
          nodeType: 'stack',
          props: { meta: { tplRole: 'courier-partner-card' } },
          children: [{ id: 12, nodeType: 'image', props: { lightLogoUrl: '/old.webp' } }],
        },
      ],
    },
  ];
  const patch = imageSrcPropsPatch('/uploads/new.webp', { lightLogoUrl: '/old.webp', src: '/old.webp' }, {
    tree,
    nodeId: 12,
    alt: 'Ecom Express',
  });
  assert.equal(patch.src, '/uploads/new.webp');
  assert.equal(patch.lightLogoUrl, '');
  assert.equal(patch.alt, 'Ecom Express');
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
