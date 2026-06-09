import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isHardcodedLightSurfaceColor,
  neutralizeLightSurfaceCssObject,
  neutralizeLightSurfaceDeviceStyle,
} from '../lib/sectionSurfaceNeutralization.js';
import { styleToCss } from '../lib/styleToCss.js';
import { SITE_THEME_PRESETS, mergeNodeStyleWithSiteTheme } from '../lib/siteDesignTheme.js';
import { neutralizeLeafTextCssObject } from '../lib/sanitizeRichHtml.js';

test('isHardcodedLightSurfaceColor detects template whites', () => {
  assert.equal(isHardcodedLightSurfaceColor('#ffffff'), true);
  assert.equal(isHardcodedLightSurfaceColor('#f8fafc'), true);
  assert.equal(isHardcodedLightSurfaceColor('#0f172a'), false);
  assert.equal(isHardcodedLightSurfaceColor('var(--token-bg-surface)'), false);
});

test('neutralizeLightSurfaceCssObject maps to token surface', () => {
  const out = neutralizeLightSurfaceCssObject({ backgroundColor: '#ffffff', padding: '12px' });
  assert.equal(out.backgroundColor, 'var(--token-bg-surface)');
  assert.equal(out.padding, '12px');
});

test('styleToCss remaps row background in dark content mode', () => {
  const siteTheme = { ...SITE_THEME_PRESETS.dark, presetId: 'dark' };
  const css = styleToCss(
    { background: { backgroundColor: '#ffffff' }, spacing: { padding: '24px' } },
    siteTheme,
    { nodeType: 'row', darkContentMode: true }
  );
  assert.equal(css.backgroundColor, 'var(--token-bg-surface)');
  assert.ok(css['--live-section-fg']);
});

test('neutralizeLeafTextCssObject remaps pasted white text in dark content mode', () => {
  const out = neutralizeLeafTextCssObject({ color: '#ffffff' }, { darkContentMode: true });
  assert.match(String(out.color), /color-text/);
});

test('remapLegacyPlatformHeroFeatureCardBg maps template pastels to dark card fills', async () => {
  const {
    remapLegacyPlatformHeroFeatureCardBg,
    PLATFORM_HERO_FEATURE_CARD_BG,
    remapPlatformHeroFeatureCardSurface,
  } = await import('../lib/sectionSurfaceNeutralization.js');
  assert.equal(remapLegacyPlatformHeroFeatureCardBg('#f3e8de'), PLATFORM_HERO_FEATURE_CARD_BG.international);
  assert.equal(remapLegacyPlatformHeroFeatureCardBg('#d8efe6'), PLATFORM_HERO_FEATURE_CARD_BG.bulk);
  const out = remapPlatformHeroFeatureCardSurface(
    { background: { backgroundColor: '#f3e8de' } },
    { props: { meta: { tplRole: 'platform-feature-card' } } }
  );
  assert.equal(out.background.backgroundColor, PLATFORM_HERO_FEATURE_CARD_BG.international);
});

test('neutralizeLightSurfaceDeviceStyle remaps light hero gradient in dark mode', () => {
  const siteTheme = { ...SITE_THEME_PRESETS.dark, presetId: 'dark' };
  const out = neutralizeLightSurfaceDeviceStyle(
    {
      background: {
        backgroundImage: 'linear-gradient(180deg, #f6f8ff 0%, #eef3ff 100%)',
      },
    },
    siteTheme,
    { mode: 'dark' }
  );
  assert.match(String(out.background.backgroundImage), /var\(--color-background\)|linear-gradient/i);
  assert.equal(out.background.backgroundColor, 'var(--color-background)');
});

test('mergeNodeStyleWithSiteTheme does not inject site row fill under hero gradient', () => {
  const siteTheme = { ...SITE_THEME_PRESETS.dark, presetId: 'dark' };
  const user = {
    background: {
      backgroundImage: 'linear-gradient(180deg, #f6f8ff 0%, #eef3ff 100%)',
    },
  };
  const merged = mergeNodeStyleWithSiteTheme(user, siteTheme, 'row');
  assert.equal(merged.background.backgroundImage, user.background.backgroundImage);
  assert.equal(merged.background.backgroundColor, undefined);
});

test('styleToCss remaps light gradient row background in dark content mode', () => {
  const siteTheme = { ...SITE_THEME_PRESETS.dark, presetId: 'dark' };
  const css = styleToCss(
    {
      background: {
        backgroundImage: 'linear-gradient(180deg, #f6f8ff 0%, #eef3ff 100%)',
      },
    },
    siteTheme,
    { nodeType: 'row', darkContentMode: true }
  );
  assert.match(String(css.backgroundImage), /linear-gradient/i);
  assert.ok(!String(css.backgroundImage).includes('#f6f8ff'));
  assert.equal(css['--live-section-fg'], '#f8fafc');
});
