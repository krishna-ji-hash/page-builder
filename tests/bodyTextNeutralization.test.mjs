import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldNeutralizeBodyTextColors } from '../lib/bodyTextNeutralization.js';
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

test('shouldNeutralizeBodyTextColors is true when theme token mode is dark', () => {
  assert.equal(shouldNeutralizeBodyTextColors(lightSite, { mode: 'dark' }), true);
});

test('dark content mode remaps pasted dark and light text to section fg', () => {
  const dark = neutralizeLeafTextCssObject({ color: PASTED_SLATE }, { darkContentMode: true });
  const light = neutralizeLeafTextCssObject({ color: PASTED_WHITE }, { darkContentMode: true });
  assert.match(String(dark.color), /live-section-fg/);
  assert.match(String(light.color), /live-section-fg/);
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
  assert.match(String(darkOut.cssOut.color), /live-section-fg/);
  const lightOut = renderLeafNeutralization(false, lightSite);
  assert.equal(lightOut.cssOut.color, PASTED_SLATE);
});
