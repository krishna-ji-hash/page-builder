import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applySectionToneToLeafCss,
  resolveSectionToneForNode,
} from '../lib/sectionToneContext.js';
import { applyTemplateSectionContrast } from '../lib/getInTouchSection.js';
import { LIVE_SECTION_FG_ON_DARK, LIVE_SECTION_FG_ON_LIGHT } from '../lib/liveSectionContrastVars.js';
import { SITE_THEME_PRESETS } from '../lib/siteDesignTheme.js';

const lightSite = { ...SITE_THEME_PRESETS.light, presetId: 'light', revision: 1, schemaVersion: 1 };

const mixedPlatformHeroTree = [
  {
    id: 1,
    nodeType: 'row',
    style_json: { desktop: { background: { backgroundColor: '#f4f6f8' } } },
    children: [
      {
        id: 2,
        nodeType: 'column',
        style_json: { desktop: { background: { backgroundColor: '#0a0a0a' } } },
        children: [
          {
            id: 3,
            nodeType: 'heading',
            props: { text: 'One Platform for Every Shipment' },
            style_json: { desktop: { colors: { textColor: '#0f172a' } } },
          },
        ],
      },
      {
        id: 4,
        nodeType: 'column',
        style_json: { desktop: { background: { backgroundColor: '#ffffff' } } },
        children: [
          {
            id: 5,
            nodeType: 'text',
            props: { text: 'Light column body' },
            style_json: { desktop: { colors: { textColor: '#0f172a' } } },
          },
        ],
      },
    ],
  },
];

test('mixed page: pitch heading resolves dark tone under light row', () => {
  assert.equal(resolveSectionToneForNode(mixedPlatformHeroTree, 3, 'desktop', lightSite, { mode: 'light' }), 'dark');
});

test('mixed page: second column body resolves light tone from row', () => {
  assert.equal(resolveSectionToneForNode(mixedPlatformHeroTree, 5, 'desktop', lightSite, { mode: 'light' }), 'light');
});

test('mixed page: dark pitch heading gets light copy after applySectionToneToLeafCss', () => {
  const css = applySectionToneToLeafCss({ color: '#0f172a' }, 'dark');
  assert.equal(css.color, LIVE_SECTION_FG_ON_DARK);
});

test('mixed page: light column body keeps dark copy on light tone', () => {
  const css = applySectionToneToLeafCss({ color: '#0f172a' }, 'light');
  assert.equal(css.color, LIVE_SECTION_FG_ON_LIGHT);
});

test('mixed page: pitch column contrast vars do not use light row fg token for copy CSS', () => {
  const { css, toneAttrs } = applyTemplateSectionContrast(
    mixedPlatformHeroTree[0].children[0],
    { backgroundColor: '#0a0a0a' },
    {
      sectionTemplateId: 'platformHero',
      rowChildColumnIndex: 0,
      siteTheme: lightSite,
      tree: mixedPlatformHeroTree,
    }
  );
  assert.equal(css['--live-section-fg'], LIVE_SECTION_FG_ON_DARK);
  assert.equal(toneAttrs['data-dark-surface'], 'true');
  assert.notEqual(css['--live-section-fg'], LIVE_SECTION_FG_ON_LIGHT);
});
