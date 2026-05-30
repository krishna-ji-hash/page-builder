import test from 'node:test';
import assert from 'node:assert/strict';
import { fontOptionIdFromStack, resolveFontStack } from '../lib/fontPresets.js';
import {
  collectBrandFontClearPatches,
  stripExplicitFontFamilyFromStyleJson,
  syncBrandColorsToThemeTokens,
  syncBrandFontToThemeTokens,
} from '../lib/projectBrand.js';

test('resolveFontStack maps preset labels and ids', () => {
  assert.equal(resolveFontStack('georgia'), 'Georgia, "Times New Roman", serif');
  assert.equal(resolveFontStack('Georgia'), 'Georgia, "Times New Roman", serif');
  assert.equal(fontOptionIdFromStack('Georgia'), 'georgia');
  assert.equal(fontOptionIdFromStack('Arial'), 'arial');
});

test('stripExplicitFontFamilyFromStyleJson removes per-device overrides', () => {
  const input = {
    desktop: { typography: { fontFamily: 'Georgia', fontSize: '16px' } },
    tablet: { typography: { fontFamily: 'Arial' } },
  };
  const out = stripExplicitFontFamilyFromStyleJson(input);
  assert.equal(out.desktop.typography.fontFamily, undefined);
  assert.equal(out.desktop.typography.fontSize, '16px');
  assert.equal(out.tablet.typography, undefined);
});

test('mergeNodeStyleWithSiteTheme ignores template fontFamily without user override', async () => {
  const { mergeNodeStyleWithSiteTheme } = await import('../lib/siteDesignTheme.js');
  const siteTheme = {
    typography: { fontFamily: 'Arial, Helvetica, sans-serif', fontFamilyHeading: 'Arial, Helvetica, sans-serif' },
    colors: {},
    spacing: {},
  };
  const deviceStyle = { typography: { fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '18px' } };
  const merged = mergeNodeStyleWithSiteTheme(deviceStyle, siteTheme, 'text', { treeNode: { props: {} } });
  assert.equal(merged.typography.fontFamily, 'Arial, Helvetica, sans-serif');
  assert.equal(merged.typography.fontSize, '18px');
  const userMerged = mergeNodeStyleWithSiteTheme(deviceStyle, siteTheme, 'text', {
    treeNode: { props: { meta: { userFontOverride: true } } },
  });
  assert.equal(userMerged.typography.fontFamily, 'Georgia, "Times New Roman", serif');
});

test('collectBrandFontClearPatches returns only changed nodes', () => {
  const tree = [
    {
      id: 1,
      style_json: { desktop: { typography: { fontFamily: 'Georgia' } } },
      children: [{ id: 2, style_json: { desktop: { typography: { fontSize: '18px' } } } }],
    },
  ];
  const patches = collectBrandFontClearPatches(tree);
  assert.equal(patches.length, 1);
  assert.equal(patches[0].nodeId, 1);
  assert.equal(patches[0].payload.brandFontNormalize, true);
  assert.equal(patches[0].payload.style_json.desktop?.typography?.fontFamily, undefined);
});

test('syncBrandColorsToThemeTokens patches active palette', () => {
  const tokens = {
    mode: 'light',
    light: { colors: { primary: '#111111', text: '#222222' } },
    dark: { colors: { primary: '#aaaaaa', text: '#bbbbbb' } },
  };
  const next = syncBrandColorsToThemeTokens(tokens, { primary: '#2563eb', text: '#0f172a' });
  assert.equal(next.light.colors.primary, '#2563eb');
  assert.equal(next.light.colors.text, '#0f172a');
  assert.equal(next.dark.colors.primary, '#aaaaaa');
});

test('syncBrandFontToThemeTokens sets body and heading stacks', () => {
  const tokens = { mode: 'light', typography: { fontFamilyBody: 'Arial' } };
  const next = syncBrandFontToThemeTokens(tokens, 'Arial');
  assert.equal(next.typography.fontFamilyBody, 'Arial, Helvetica, sans-serif');
  assert.equal(next.typography.fontFamilyHeading, 'Arial, Helvetica, sans-serif');
});
