import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSectionBackgroundIsLight } from '../lib/liveSectionContrastVars.js';
import { resolveSectionToneForNode, applySectionToneToLeafCss } from '../lib/sectionToneContext.js';
import { styleToCss } from '../lib/styleToCss.js';
import { mergeNodeStyleWithSiteTheme, SITE_THEME_PRESETS } from '../lib/siteDesignTheme.js';
import { neutralizeLeafTextCssObject } from '../lib/sanitizeRichHtml.js';
import { LIVE_SECTION_FG_ON_DARK } from '../lib/liveSectionContrastVars.js';

const lightSite = { ...SITE_THEME_PRESETS.light, presetId: 'light', revision: 1, schemaVersion: 1 };

function rowContrastIsLight(background) {
  const rowStyle = { background, layout: { display: 'flex' } };
  const themed = mergeNodeStyleWithSiteTheme(rowStyle, lightSite, 'row');
  const css = styleToCss(themed, lightSite, { nodeType: 'row', darkContentMode: false });
  return resolveSectionBackgroundIsLight({ css, deviceStyle: themed, siteTheme: lightSite });
}

function heroTree(background) {
  return [
    {
      id: 1,
      nodeType: 'row',
      style_json: { desktop: { background } },
      children: [
        {
          id: 2,
          nodeType: 'column',
          style_json: { desktop: {} },
          children: [
            {
              id: 3,
              nodeType: 'heading',
              props: { text: 'Build production-grade pages in minutes.' },
              style_json: {
                desktop: {
                  colors: { textColor: '#ffffff' },
                  typography: { fontSize: '54px', fontWeight: '850' },
                },
              },
            },
          ],
        },
      ],
    },
  ];
}

test('starter hero gradient stays dark section in light site mode', () => {
  const bg = {
    backgroundColor: '#0b1220',
    backgroundImage:
      "linear-gradient(rgba(3,8,20,0.55), rgba(3,8,20,0.55)), url('https://example.com/x.jpg')",
    backgroundSize: 'cover',
  };
  assert.equal(rowContrastIsLight(bg), false);
  assert.equal(resolveSectionToneForNode(heroTree(bg), 3, 'desktop', lightSite, { mode: 'light' }), 'dark');
});

test('template hero gradient stays dark section in light site mode', () => {
  const bg = {
    backgroundColor: '#0b1220',
    backgroundImage:
      'radial-gradient(900px 520px at 18% 22%, rgba(99,102,241,0.35) 0%, transparent 55%), linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(2,6,23,1) 100%)',
  };
  assert.equal(rowContrastIsLight(bg), false);
});

test('hero heading keeps light copy on dark band when site preset is light', () => {
  const bg = { backgroundColor: '#0b1220' };
  const tone = resolveSectionToneForNode(heroTree(bg), 3, 'desktop', lightSite, { mode: 'light' });
  assert.equal(tone, 'dark');
  let css = styleToCss(
    mergeNodeStyleWithSiteTheme(heroTree(bg)[0].children[0].children[0].style_json.desktop, lightSite, 'heading'),
    lightSite,
    { nodeType: 'heading', darkContentMode: false }
  );
  css = neutralizeLeafTextCssObject(css, { darkContentMode: false, sectionTone: tone });
  css = applySectionToneToLeafCss(css, tone);
  assert.equal(css.color, LIVE_SECTION_FG_ON_DARK);
});
