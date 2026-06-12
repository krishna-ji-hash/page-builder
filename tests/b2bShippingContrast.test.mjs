import test from 'node:test';
import assert from 'node:assert/strict';
import { SECTION_TEMPLATES } from '../lib/sectionTemplates.js';
import { resolveSectionToneForNode, applySectionToneToLeafCss } from '../lib/sectionToneContext.js';
import { applyTemplateSectionContrast } from '../lib/getInTouchSection.js';
import { containerPaintsDark, LIVE_SECTION_FG_ON_DARK, LIVE_SECTION_FG_ON_LIGHT } from '../lib/liveSectionContrastVars.js';
import { styleToCss } from '../lib/styleToCss.js';
import { mergeDeviceStyleWithTypeDefaults } from '../lib/nodeLayoutDefaults.js';
import { mergeNodeStyleWithSiteTheme, SITE_THEME_PRESETS } from '../lib/siteDesignTheme.js';
import { getDeviceStyle } from '../lib/styleToCss.js';
import { isSiteContentDarkMode } from '../lib/bodyTextNeutralization.js';
import { neutralizeLeafTextCssObject } from '../lib/sanitizeRichHtml.js';
import { finalizeLeafDeviceStyle } from '../lib/leafStylePipeline.js';

const lightSite = { ...SITE_THEME_PRESETS.light, presetId: 'light', revision: 1, schemaVersion: 1 };
const darkSite = { ...SITE_THEME_PRESETS.dark, presetId: 'dark', revision: 1, schemaVersion: 1 };

function assignIds(node, start = 1) {
  let id = start;
  function go(n) {
    n.id = id++;
    for (const c of n.children || []) go(c);
  }
  go(node);
  return node;
}

function leafHeadingCss(tree, heading, site) {
  const darkContentMode = isSiteContentDarkMode(site);
  const tone = resolveSectionToneForNode(tree, heading.id, 'desktop', site, { mode: site.presetId });
  const hMerged = finalizeLeafDeviceStyle(
    heading,
    'desktop',
    mergeDeviceStyleWithTypeDefaults(
      'heading',
      mergeNodeStyleWithSiteTheme(getDeviceStyle(heading.style_json, 'desktop'), site, 'heading', {
        treeNode: heading,
      }),
      { treeNode: heading }
    )
  );
  let css = styleToCss(hMerged, site, { nodeType: 'heading', darkContentMode, sectionTone: tone });
  css = neutralizeLeafTextCssObject(css, { darkContentMode, sectionTone: tone });
  css = applySectionToneToLeafCss(css, tone, { nodeType: 'heading', darkContentMode });
  return { tone, css };
}

const row = assignIds(structuredClone(SECTION_TEMPLATES.b2bShippingServices[0]));
const tree = [row];
const card = row.children[0].children[0].children[1].children[0];
const cardHeading = card.children[1];
const sectionHeading = row.children[0].children[0].children[0].children[0];

test('B2B light site: service card paints light and resolves light section tone', () => {
  assert.equal(containerPaintsDark(card, 'desktop', lightSite), false);
  assert.equal(resolveSectionToneForNode(tree, cardHeading.id, 'desktop', lightSite, { mode: 'light' }), 'light');
});

test('B2B dark site: service card paints dark after surface token remap', () => {
  assert.equal(containerPaintsDark(card, 'desktop', darkSite), true);
  assert.equal(resolveSectionToneForNode(tree, cardHeading.id, 'desktop', darkSite, { mode: 'dark' }), 'dark');
});

test('B2B light site: card heading keeps dark readable copy', () => {
  const { tone, css } = leafHeadingCss(tree, cardHeading, lightSite);
  assert.equal(tone, 'light');
  assert.match(String(css.color), /--live-section-fg/);
  const stackCss = styleToCss(
    mergeDeviceStyleWithTypeDefaults(
      'stack',
      mergeNodeStyleWithSiteTheme(getDeviceStyle(card.style_json, 'desktop'), lightSite, 'stack', { treeNode: card }),
      { treeNode: card }
    ),
    lightSite,
    { nodeType: 'stack', darkContentMode: false }
  );
  const tpl = applyTemplateSectionContrast(card, stackCss, { siteTheme: lightSite, tree, device: 'desktop' });
  assert.equal(tpl.css['--live-section-fg'], LIVE_SECTION_FG_ON_LIGHT);
  assert.equal(tpl.toneAttrs['data-section-tone'], 'light');
});

test('B2B dark site: card heading uses light-on-dark copy', () => {
  const { tone, css } = leafHeadingCss(tree, cardHeading, darkSite);
  assert.equal(tone, 'dark');
  assert.equal(css.color, LIVE_SECTION_FG_ON_DARK);
});

test('B2B light site: section title heading stays dark', () => {
  const { tone, css } = leafHeadingCss(tree, sectionHeading, lightSite);
  assert.equal(tone, 'light');
  assert.match(String(css.color), /--live-section-fg/);
});
