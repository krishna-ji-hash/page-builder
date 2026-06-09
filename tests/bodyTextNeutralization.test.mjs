import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldNeutralizeBodyTextColors, shouldNeutralizeHardcodedBodyTextColors } from '../lib/bodyTextNeutralization.js';
import { neutralizeLeafTextCssObject, sanitizeRichHtml } from '../lib/sanitizeRichHtml.js';
import { menuCssVars } from '../lib/styleToCss.js';
import { SITE_THEME_PRESETS } from '../lib/siteDesignTheme.js';

const lightSite = { ...SITE_THEME_PRESETS.light, presetId: 'light', revision: 1, schemaVersion: 1 };
const darkSite = { ...SITE_THEME_PRESETS.dark, presetId: 'dark', revision: 1, schemaVersion: 1 };

const PASTED_SLATE = '#0f172a';
const PASTED_WHITE = '#ffffff';
const SAMPLE_HTML = `<p style="color: ${PASTED_SLATE}">Body copy</p>`;

function renderLeafNeutralization(darkContentMode, siteTheme, cssIn = { color: PASTED_SLATE, fontSize: '16px' }) {
  const cssOut = neutralizeLeafTextCssObject(cssIn, { darkContentMode });
  const htmlOut = sanitizeRichHtml(SAMPLE_HTML, {
    neutralizeHardcodedBodyTextColors: darkContentMode,
  });
  return { cssOut, htmlOut };
}

test('shouldNeutralizeBodyTextColors is false for light site preset', () => {
  assert.equal(shouldNeutralizeBodyTextColors(lightSite), false);
});

test('shouldNeutralizeBodyTextColors is true for dark site preset', () => {
  assert.equal(shouldNeutralizeBodyTextColors(darkSite), true);
});

test('shouldNeutralizeBodyTextColors is false when theme token mode is dark but site preset is light (aligned)', () => {
  assert.equal(shouldNeutralizeBodyTextColors(lightSite, { mode: 'dark' }), false);
});

test('shouldNeutralizeHardcodedBodyTextColors is true on dark section in light site', () => {
  assert.equal(
    shouldNeutralizeHardcodedBodyTextColors({ darkContentMode: false, sectionTone: 'dark' }),
    true
  );
  assert.equal(
    shouldNeutralizeHardcodedBodyTextColors({ darkContentMode: false, sectionTone: 'light' }),
    false
  );
  assert.equal(
    shouldNeutralizeHardcodedBodyTextColors({ darkContentMode: true, sectionTone: 'light' }),
    true
  );
});

test('dark site remaps pasted slate inline spans even on light-tagged sections', () => {
  const html = '<p><span style="color: rgb(55, 65, 81)">Body copy</span></p>';
  const out = sanitizeRichHtml(html, {
    neutralizeHardcodedBodyTextColors: shouldNeutralizeHardcodedBodyTextColors({
      darkContentMode: true,
      sectionTone: 'light',
    }),
    remapLightNeutralTextColors: false,
  });
  assert.ok(!out.includes('55, 65, 81'));
});

test('dark site remaps pasted body gray in leaf css on light-tagged sections', () => {
  const out = neutralizeLeafTextCssObject(
    { color: '#475569', '--node-text': '#475569' },
    { darkContentMode: true, sectionTone: 'light' }
  );
  assert.match(String(out.color), /color-text/);
  assert.match(String(out['--node-text']), /color-text/);
});

test('dark section tone remaps pasted slate inline spans on light site', () => {
  const html = '<p><span style="color: rgb(55, 65, 81)">Body copy</span></p>';
  const out = sanitizeRichHtml(html, {
    neutralizeHardcodedBodyTextColors: true,
    remapLightNeutralTextColors: false,
  });
  assert.ok(!out.includes('55, 65, 81'));
  assert.ok(!out.includes('#374151'));
});

test('dark section tone remaps pasted slate leaf css on light site', () => {
  const out = neutralizeLeafTextCssObject(
    { color: 'rgb(55, 65, 81)' },
    { darkContentMode: false, sectionTone: 'dark' }
  );
  assert.match(String(out.color), /live-section-muted/);
});

test('styleToCss remaps pasted body gray on dark section in light site', async () => {
  const { styleToCss } = await import('../lib/styleToCss.js');
  const css = styleToCss(
    { colors: { textColor: '#64748b' }, typography: { fontSize: '16px' } },
    lightSite,
    { nodeType: 'paragraph', darkContentMode: false, sectionTone: 'dark' }
  );
  assert.match(String(css.color), /live-section-fg/);
});

test('dark content mode remaps pasted dark and light text to readable tokens', () => {
  const dark = neutralizeLeafTextCssObject({ color: PASTED_SLATE }, { darkContentMode: true });
  const light = neutralizeLeafTextCssObject({ color: PASTED_WHITE }, { darkContentMode: true });
  assert.match(String(dark.color), /color-text/);
  assert.match(String(light.color), /color-text/);
});

test('light site mode keeps pasted slate body colors', () => {
  const { cssOut, htmlOut } = renderLeafNeutralization(false, lightSite);
  assert.equal(cssOut.color, PASTED_SLATE);
  assert.ok(htmlOut.includes(PASTED_SLATE));
});

test('light site mode remaps hardcoded white text to section foreground', () => {
  const cssOut = neutralizeLeafTextCssObject({ color: PASTED_WHITE }, { darkContentMode: false });
  assert.match(String(cssOut.color), /live-section-fg/);
  const htmlOut = sanitizeRichHtml(`<p style="color: ${PASTED_WHITE}">Hero</p>`, {
    neutralizeHardcodedBodyTextColors: false,
  });
  assert.ok(!htmlOut.includes(PASTED_WHITE));
});

test('dark content mode remaps menu hardcoded dark link color', () => {
  const vars = menuCssVars(
    { colors: { textColor: '#0f172a' }, typography: { color: '#0f172a' } },
    { darkContentMode: true }
  );
  assert.match(String(vars['--menu-color']), /live-section-fg/);
});

test('page rendering parity: dark content remap only when dark mode active', () => {
  const darkOut = renderLeafNeutralization(true, darkSite);
  assert.match(String(darkOut.cssOut.color), /color-text/);
  const lightOut = renderLeafNeutralization(false, lightSite);
  assert.equal(lightOut.cssOut.color, PASTED_SLATE);
});
