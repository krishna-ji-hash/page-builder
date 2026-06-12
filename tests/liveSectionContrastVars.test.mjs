import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeNodeStyleWithSiteTheme, SITE_THEME_PRESETS } from '../lib/siteDesignTheme.js';
import {
  isCssBackgroundLight,
  liveSectionContrastCssVarsForRow,
  liveSectionContrastPair,
  LIVE_SECTION_FG_ON_DARK,
  LIVE_SECTION_FG_ON_LIGHT,
  LIVE_SECTION_MUTED_ON_DARK,
  LIVE_SECTION_MUTED_ON_LIGHT,
  mergeLiveSectionContrastVars,
  resolveRowSectionBackground,
  resolveSectionBackgroundIsLight,
  sectionToneDataAttrForCss,
  shouldApplySectionContrast,
} from '../lib/liveSectionContrastVars.js';
import { styleToCss, coerceSectionAwareTextColor } from '../lib/styleToCss.js';
import { neutralizeLightSurfaceCssObject } from '../lib/sectionSurfaceNeutralization.js';

const darkSite = { ...SITE_THEME_PRESETS.dark, presetId: 'dark', revision: 1, schemaVersion: 1 };
const lightSite = { ...SITE_THEME_PRESETS.light, presetId: 'light', revision: 1, schemaVersion: 1 };

test('isCssBackgroundLight classifies light and dark paints', () => {
  assert.equal(isCssBackgroundLight('#ffffff'), true);
  assert.equal(isCssBackgroundLight('#f8fafc'), true);
  assert.equal(isCssBackgroundLight('#0f172a'), false);
  assert.equal(isCssBackgroundLight('#1e293b'), false);
});

test('isCssBackgroundLight detects light hero gradients', () => {
  assert.equal(
    isCssBackgroundLight('linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'),
    true
  );
  assert.equal(
    isCssBackgroundLight('linear-gradient(135deg, #0b1220 0%, #0f172a 55%, #1a293b 100%)'),
    false
  );
});

test('liveSectionContrastPair returns required token values', () => {
  assert.deepEqual(liveSectionContrastPair(true), {
    '--live-section-fg': LIVE_SECTION_FG_ON_LIGHT,
    '--live-section-muted': LIVE_SECTION_MUTED_ON_LIGHT,
  });
  assert.deepEqual(liveSectionContrastPair(false), {
    '--live-section-fg': LIVE_SECTION_FG_ON_DARK,
    '--live-section-muted': LIVE_SECTION_MUTED_ON_DARK,
  });
});

test('light section row sets dark foreground tokens', () => {
  const deviceStyle = { background: { backgroundColor: '#ffffff' } };
  const css = styleToCss(deviceStyle, darkSite, { nodeType: 'row' });
  assert.equal(css['--live-section-fg'], LIVE_SECTION_FG_ON_LIGHT);
  assert.equal(css['--live-section-muted'], LIVE_SECTION_MUTED_ON_LIGHT);
  assert.equal(css.backgroundColor, '#ffffff');
});

test('light stack sets contrast for pastel card backgrounds', () => {
  const deviceStyle = { background: { backgroundColor: '#e8f5e9' } };
  const css = styleToCss(deviceStyle, darkSite, { nodeType: 'stack' });
  assert.equal(css['--live-section-fg'], LIVE_SECTION_FG_ON_LIGHT);
  assert.equal(css.backgroundColor, '#e8f5e9');
});

test('light gradient row sets dark text tokens in dark site mode', () => {
  const deviceStyle = {
    background: { backgroundImage: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' },
  };
  const css = styleToCss(deviceStyle, darkSite, { nodeType: 'row' });
  assert.equal(css['--live-section-fg'], LIVE_SECTION_FG_ON_LIGHT);
});

test('dark section row sets light foreground tokens', () => {
  const deviceStyle = { background: { backgroundColor: '#0f172a' } };
  const css = styleToCss(deviceStyle, darkSite, { nodeType: 'row' });
  assert.equal(css['--live-section-fg'], LIVE_SECTION_FG_ON_DARK);
  assert.equal(css['--live-section-muted'], LIVE_SECTION_MUTED_ON_DARK);
});

test('mixed page: two rows resolve independent contrast vars', () => {
  const lightRowStyle = { background: { backgroundColor: '#ffffff' } };
  const darkRowStyle = { background: { backgroundColor: '#111827' } };
  const lightCss = styleToCss(lightRowStyle, lightSite, { nodeType: 'row' });
  const darkCss = styleToCss(darkRowStyle, lightSite, { nodeType: 'row' });
  assert.equal(lightCss['--live-section-fg'], LIVE_SECTION_FG_ON_LIGHT);
  assert.equal(darkCss['--live-section-fg'], LIVE_SECTION_FG_ON_DARK);
});

test('site theme defaults use section fg fallback without overriding explicit colors', () => {
  const defaults = mergeNodeStyleWithSiteTheme({}, darkSite, 'heading');
  assert.equal(defaults.typography?.color, 'var(--live-section-fg, var(--color-text))');
  const explicit = mergeNodeStyleWithSiteTheme(
    { typography: { color: '#ff00ff' }, colors: { textColor: '#ff00ff' } },
    darkSite,
    'heading'
  );
  assert.equal(explicit.typography?.color, '#ff00ff');
  assert.equal(explicit.colors?.textColor, '#ff00ff');
});

test('resolveRowSectionBackground prefers inline css background', () => {
  const bg = resolveRowSectionBackground({
    css: { backgroundColor: '#fefefe' },
    deviceStyle: { background: { backgroundColor: '#000000' } },
    siteTheme: darkSite,
  });
  assert.equal(bg, '#fefefe');
});

test('mergeLiveSectionContrastVars is a no-op merge for non-row via styleToCss', () => {
  const css = styleToCss({ colors: { textColor: '#111' } }, lightSite, { nodeType: 'text' });
  assert.equal(css['--live-section-fg'], undefined);
});

test('transparent column does not publish section contrast tokens', () => {
  assert.equal(shouldApplySectionContrast('column', {}, {}), false);
  const css = styleToCss({ layout: { gap: 12 } }, darkSite, { nodeType: 'column' });
  assert.equal(css['--live-section-fg'], undefined);
});

test('hero landing row keeps light contrast tokens in light site mode', () => {
  const deviceStyle = {
    background: {
      backgroundImage:
        'radial-gradient(900px 520px at 18% 22%, rgba(59,130,246,0.16) 0%, transparent 55%), linear-gradient(180deg, #f6f8ff 0%, #eef3ff 100%)',
    },
  };
  const css = styleToCss(deviceStyle, lightSite, { nodeType: 'row' });
  assert.equal(css['--live-section-fg'], LIVE_SECTION_FG_ON_LIGHT);
});

test('hero landing row remaps to dark contrast in dark content mode', () => {
  const deviceStyle = {
    background: {
      backgroundImage:
        'radial-gradient(900px 520px at 18% 22%, rgba(59,130,246,0.16) 0%, transparent 55%), linear-gradient(180deg, #f6f8ff 0%, #eef3ff 100%)',
    },
  };
  const css = styleToCss(deviceStyle, darkSite, { nodeType: 'row', darkContentMode: true });
  assert.equal(css['--live-section-fg'], LIVE_SECTION_FG_ON_DARK);
});

test('coerceSectionAwareTextColor remaps neutral white in dark content mode', () => {
  assert.equal(coerceSectionAwareTextColor('#ffffff'), '#ffffff');
  assert.match(String(coerceSectionAwareTextColor('#ffffff', { darkContentMode: true })), /live-section-fg/);
  assert.match(String(coerceSectionAwareTextColor('white', { darkContentMode: true })), /live-section-fg/);
  assert.equal(coerceSectionAwareTextColor('#2563eb'), '#2563eb');
});

test('styleToCss never emits raw #ffffff on heading color or --node-text', () => {
  const css = styleToCss(
    { colors: { textColor: '#ffffff' }, typography: { fontSize: '48px' } },
    darkSite,
    { nodeType: 'heading', darkContentMode: true }
  );
  assert.match(String(css.color), /live-section-fg/);
  assert.match(String(css['--node-text']), /live-section-fg/);
});

test('styleToCss preserves dark text on white button in dark content mode', () => {
  const css = styleToCss(
    {
      colors: { textColor: '#111111', backgroundColor: '#ffffff' },
      spacing: { padding: '13px 24px' },
    },
    darkSite,
    { nodeType: 'button', darkContentMode: true }
  );
  assert.equal(css.color, '#111111');
  assert.equal(css['--node-text'], '#111111');
  assert.equal(css.backgroundColor, '#ffffff');
});

test('styleToCss still remaps button text without explicit contrasting background', () => {
  const css = styleToCss(
    { colors: { textColor: '#111111' }, spacing: { padding: '13px 24px' } },
    darkSite,
    { nodeType: 'button', darkContentMode: true }
  );
  assert.match(String(css.color), /color-text/);
});

test('resolveSectionBackgroundIsLight resolves remapped token surface in dark mode', () => {
  const css = styleToCss(
    { background: { backgroundColor: '#f4f8fc' } },
    darkSite,
    { nodeType: 'row', darkContentMode: true }
  );
  const light = resolveSectionBackgroundIsLight({ css, deviceStyle: {}, siteTheme: darkSite });
  assert.equal(light, false);
  assert.equal(css['--live-section-muted'], LIVE_SECTION_MUTED_ON_DARK);
});

test('sectionToneDataAttrForCss maps contrast vars to data-section-tone', () => {
  assert.deepEqual(sectionToneDataAttrForCss({ '--live-section-fg': LIVE_SECTION_FG_ON_LIGHT }), {
    'data-section-tone': 'light',
  });
  assert.deepEqual(sectionToneDataAttrForCss({ '--live-section-fg': LIVE_SECTION_FG_ON_DARK }), {
    'data-section-tone': 'dark',
  });
});

test('dark mode: light hero gradient remaps to dark section contrast', () => {
  const deviceStyle = {
    background: {
      backgroundColor: '#f3f6ff',
      backgroundImage:
        'radial-gradient(900px 520px at 18% 22%, rgba(59,130,246,0.16) 0%, transparent 55%), linear-gradient(180deg, #f6f8ff 0%, #eef3ff 100%)',
    },
  };
  const withContrast = styleToCss(deviceStyle, darkSite, { nodeType: 'row', darkContentMode: true });
  assert.equal(withContrast['--live-section-fg'], LIVE_SECTION_FG_ON_DARK);
  assert.ok(!String(withContrast.backgroundImage || '').includes('#f6f8ff'));
});

test('resolveSectionBackgroundIsLight prefers opaque light surface under decorative tint gradient', () => {
  const light = resolveSectionBackgroundIsLight({
    css: {
      backgroundColor: 'var(--token-bg-surface, #ffffff)',
      backgroundImage:
        'linear-gradient(180deg, rgba(37, 99, 235, 0.09) 0%, rgba(255, 255, 255, 0) 70%)',
    },
    deviceStyle: {
      background: {
        backgroundColor: 'var(--token-bg-surface, #ffffff)',
        backgroundImage:
          'linear-gradient(180deg, rgba(37, 99, 235, 0.09) 0%, rgba(255, 255, 255, 0) 70%)',
      },
    },
    siteTheme: lightSite,
  });
  assert.equal(light, true);
});

test('liveSectionContrastCssVarsForRow resolves var(--color-background) against site theme', () => {
  const vars = liveSectionContrastCssVarsForRow({
    css: { backgroundColor: 'var(--color-background)' },
    deviceStyle: {},
    siteTheme: darkSite,
  });
  assert.equal(vars['--live-section-fg'], LIVE_SECTION_FG_ON_DARK);
});
