import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyTemplateSectionContrast,
  isPlatformHeroPitchColumnNode,
  isPlatformHeroSectionRow,
  sectionTemplateDataAttrsForRow,
} from '../lib/getInTouchSection.js';
import { containerPaintsDark, LIVE_SECTION_FG_ON_DARK } from '../lib/liveSectionContrastVars.js';
import { SITE_THEME_PRESETS } from '../lib/siteDesignTheme.js';

const lightSite = { ...SITE_THEME_PRESETS.light, presetId: 'light', revision: 1, schemaVersion: 1 };

test('isPlatformHeroSectionRow matches displayName', () => {
  assert.equal(isPlatformHeroSectionRow({ nodeType: 'row', displayName: 'Platform Hero' }), true);
  assert.equal(isPlatformHeroSectionRow({ nodeType: 'row', displayName: 'Hero' }), false);
});

test('sectionTemplateDataAttrsForRow infers platformHero from displayName', () => {
  assert.deepEqual(sectionTemplateDataAttrsForRow({ nodeType: 'row', displayName: 'Platform Hero' }), {
    'data-section-template': 'platformHero',
  });
});

test('applyTemplateSectionContrast forces dark on platform hero pitch column', () => {
  const { css, toneAttrs } = applyTemplateSectionContrast(
    { nodeType: 'column', id: 2 },
    { backgroundColor: '#0a0a0a' },
    { sectionTemplateId: 'platformHero', rowChildColumnIndex: 0 }
  );
  assert.equal(toneAttrs['data-section-tone'], 'dark');
  assert.equal(css['--live-section-fg'], LIVE_SECTION_FG_ON_DARK);
});

test('containerPaintsDark detects #0a0a0a pitch card', () => {
  const col = {
    nodeType: 'column',
    style_json: { desktop: { background: { backgroundColor: '#0a0a0a' } } },
  };
  assert.equal(containerPaintsDark(col, 'desktop', lightSite), true);
});

test('applyTemplateSectionContrast marks dark-painted stack', () => {
  const { toneAttrs } = applyTemplateSectionContrast(
    {
      nodeType: 'stack',
      id: 9,
      style_json: { desktop: { background: { backgroundColor: '#0a0a0a' } } },
    },
    {},
    { device: 'desktop', siteTheme: lightSite, tree: [] }
  );
  assert.equal(toneAttrs['data-section-tone'], 'dark');
});

test('isPlatformHeroPitchColumnNode detects first column', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      props: { meta: { sectionTemplate: 'platformHero' } },
      children: [{ id: 2, nodeType: 'column', children: [] }],
    },
  ];
  assert.equal(isPlatformHeroPitchColumnNode({ id: 2, nodeType: 'column' }, tree), true);
});
