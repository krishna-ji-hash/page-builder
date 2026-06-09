import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applySectionToneToLeafCss,
  resolveSectionToneForNode,
  sectionToneForContainerNode,
} from '../lib/sectionToneContext.js';
import { LIVE_SECTION_FG_ON_DARK, LIVE_SECTION_FG_ON_LIGHT } from '../lib/liveSectionContrastVars.js';
import { neutralizeLeafTextCssObject } from '../lib/sanitizeRichHtml.js';
import { SITE_THEME_PRESETS } from '../lib/siteDesignTheme.js';

const darkSite = { ...SITE_THEME_PRESETS.dark, presetId: 'dark', revision: 1, schemaVersion: 1 };
const lightSite = { ...SITE_THEME_PRESETS.light, presetId: 'light', revision: 1, schemaVersion: 1 };

test('applySectionToneToLeafCss remaps white on light sections to readable dark copy', () => {
  const out = applySectionToneToLeafCss({ color: '#ffffff', '--node-text': '#ffffff' }, 'light');
  assert.equal(out.color, LIVE_SECTION_FG_ON_LIGHT);
  assert.equal(out['--node-text'], LIVE_SECTION_FG_ON_LIGHT);
});

test('applySectionToneToLeafCss keeps section fg token on light sections', () => {
  const css = { color: 'var(--live-section-fg, var(--color-text))' };
  const out = applySectionToneToLeafCss(css, 'light');
  assert.equal(out.color, css.color);
});

test('applySectionToneToLeafCss remaps dark neutrals on light sections', () => {
  const out = applySectionToneToLeafCss({ color: '#0f172a' }, 'light');
  assert.equal(out.color, LIVE_SECTION_FG_ON_LIGHT);
});

test('applySectionToneToLeafCss forces light text on dark sections for neutral dark colors', () => {
  const out = applySectionToneToLeafCss({ color: '#0f172a', '--node-text': '#0f172a' }, 'dark');
  assert.equal(out.color, LIVE_SECTION_FG_ON_DARK);
  assert.equal(out['--node-text'], LIVE_SECTION_FG_ON_DARK);
});

test('applySectionToneToLeafCss uses muted copy for body leaves on dark sections', () => {
  const out = applySectionToneToLeafCss(
    { color: '#64748b', '--node-text': '#64748b' },
    'dark',
    { nodeType: 'paragraph' }
  );
  assert.match(String(out.color), /live-section-muted/);
  assert.match(String(out['--node-text']), /live-section-muted/);
});

test('applySectionToneToLeafCss preserves authored brand color on dark sections', () => {
  const out = applySectionToneToLeafCss({ color: '#2841a4' }, 'dark');
  assert.equal(out.color, '#2841a4');
});

test('applySectionToneToLeafCss remaps section-muted token on dark site preset', () => {
  const out = applySectionToneToLeafCss(
    { color: 'var(--live-section-muted, var(--color-muted))' },
    null,
    { nodeType: 'paragraph', darkContentMode: true }
  );
  assert.match(String(out.color), /live-section-muted/);
});

test('neutralizeLeafTextCssObject remaps section-muted token on dark site preset', () => {
  const out = neutralizeLeafTextCssObject(
    { color: 'var(--live-section-muted, var(--color-muted))' },
    { darkContentMode: true, sectionTone: null }
  );
  assert.match(String(out.color), /--color-text/);
});

test('resolveSectionToneForNode forces dark on get in touch row', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      displayName: 'Get in Touch',
      style_json: { desktop: { background: { backgroundColor: '#1e3a8a' } } },
      children: [
        {
          id: 2,
          nodeType: 'heading',
          props: { text: 'Get in Touch with Our Team' },
          style_json: { desktop: { colors: { textColor: '#0f172a' } } },
        },
      ],
    },
  ];
  assert.equal(resolveSectionToneForNode(tree, 2, 'desktop', lightSite, { mode: 'light' }), 'dark');
});

test('resolveSectionToneForNode uses dark pitch column inside light platform hero row', () => {
  const tree = [
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
              props: { text: 'One Platform' },
              style_json: { desktop: { colors: { textColor: '#ffffff' } } },
            },
          ],
        },
      ],
    },
  ];
  assert.equal(resolveSectionToneForNode(tree, 3, 'desktop', lightSite, { mode: 'light' }), 'dark');
});

test('neutralizeLeafTextCssObject preserves white on dark section tone in light site', () => {
  const out = neutralizeLeafTextCssObject(
    { color: '#ffffff' },
    { darkContentMode: false, sectionTone: 'dark' }
  );
  assert.equal(out.color, '#ffffff');
});

test('resolveSectionToneForNode reads dark tone when dark mode remaps light hero row', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      style_json: {
        desktop: {
          background: {
            backgroundImage:
              'linear-gradient(180deg, #f6f8ff 0%, #eef3ff 100%)',
          },
        },
      },
      children: [
        {
          id: 2,
          nodeType: 'column',
          style_json: { desktop: {} },
          children: [
            {
              id: 3,
              nodeType: 'heading',
              props: { text: 'Title' },
              style_json: { desktop: { colors: { textColor: '#ffffff' } } },
            },
          ],
        },
      ],
    },
  ];
  const tone = resolveSectionToneForNode(tree, 3, 'desktop', darkSite, { mode: 'dark' });
  assert.equal(tone, 'dark');
});

test('sectionToneForContainerNode on light gradient row in dark content mode', () => {
  const row = {
    nodeType: 'row',
    style_json: {
      desktop: {
        background: {
          backgroundColor: '#f3f6ff',
          backgroundImage: 'linear-gradient(180deg, #f6f8ff 0%, #eef3ff 100%)',
        },
      },
    },
  };
  assert.equal(sectionToneForContainerNode(row, 'desktop', darkSite, true), 'dark');
});
