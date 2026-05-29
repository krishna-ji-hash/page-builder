import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createModePalettesFromFlat,
  DEFAULT_DARK_TOKEN_COLORS,
  DEFAULT_THEME_TOKENS,
  hasModePalettes,
  normalizeThemeTokens,
  resolveActiveThemeTokens,
  themeTokensToCssVariableStyle,
} from '../lib/themeTokens.js';

test('legacy flat tokens: mode does not change resolved colors until palettes exist', () => {
  const legacy = normalizeThemeTokens({
    mode: 'light',
    colors: { primary: '#111111', background: '#ffffff', text: '#0f172a' },
  });
  assert.equal(hasModePalettes(legacy), false);
  const asLight = resolveActiveThemeTokens({ ...legacy, mode: 'light' });
  const asDark = resolveActiveThemeTokens({ ...legacy, mode: 'dark' });
  assert.equal(asLight.colors.primary, '#111111');
  assert.equal(asDark.colors.primary, '#111111');
  const cssLight = themeTokensToCssVariableStyle({ ...legacy, mode: 'light' });
  const cssDark = themeTokensToCssVariableStyle({ ...legacy, mode: 'dark' });
  assert.equal(cssLight['--token-color-primary'], '#111111');
  assert.equal(cssDark['--token-color-primary'], '#111111');
  assert.equal(cssDark['--token-mode'], 'dark');
});

test('mode palettes: light vs dark resolve different active colors', () => {
  const tokens = normalizeThemeTokens({
    mode: 'light',
    light: { colors: { primary: '#2563eb', background: '#ffffff', text: '#0f172a' } },
    dark: { colors: { primary: '#60a5fa', background: '#0f172a', text: '#f8fafc' } },
  });
  assert.equal(hasModePalettes(tokens), true);
  const activeLight = resolveActiveThemeTokens({ ...tokens, mode: 'light' });
  const activeDark = resolveActiveThemeTokens({ ...tokens, mode: 'dark' });
  assert.equal(activeLight.colors.background, '#ffffff');
  assert.equal(activeDark.colors.background, '#0f172a');
  const varsLight = themeTokensToCssVariableStyle({ ...tokens, mode: 'light' });
  const varsDark = themeTokensToCssVariableStyle({ ...tokens, mode: 'dark' });
  assert.equal(varsLight['--token-color-background'], '#ffffff');
  assert.equal(varsDark['--token-color-background'], '#0f172a');
  assert.equal(varsLight['--token-mode'], 'light');
  assert.equal(varsDark['--token-mode'], 'dark');
});

test('createModePalettesFromFlat seeds dark colors', () => {
  const flat = { colors: { primary: '#111111' } };
  const { light, dark } = createModePalettesFromFlat(flat);
  assert.equal(light.colors.primary, '#111111');
  assert.equal(dark.colors.primary, '#111111');
  assert.equal(dark.colors.background, DEFAULT_DARK_TOKEN_COLORS.background);
});

test('normalizeThemeTokens preserves light/dark palettes', () => {
  const normalized = normalizeThemeTokens({
    mode: 'dark',
    light: { colors: { text: '#000000' } },
    dark: { colors: { text: '#ffffff' } },
    colors: { text: '#999999' },
  });
  assert.ok(normalized.light);
  assert.ok(normalized.dark);
  assert.equal(normalized.colors, undefined);
  const active = resolveActiveThemeTokens(normalized);
  assert.equal(active.colors.text, '#ffffff');
});

test('builder preview live parity: same CSS vars from same config', () => {
  const config = {
    mode: 'dark',
    light: { colors: { primary: '#2563eb' } },
    dark: { colors: { primary: '#60a5fa' } },
  };
  const a = themeTokensToCssVariableStyle(config);
  const b = themeTokensToCssVariableStyle(config);
  assert.deepEqual(a, b);
  assert.equal(a['--token-color-primary'], '#60a5fa');
});

test('empty input falls back to defaults', () => {
  const active = resolveActiveThemeTokens(undefined);
  assert.equal(active.colors.primary, DEFAULT_THEME_TOKENS.colors.primary);
});

test('status and gradient keys map to kebab CSS variables', () => {
  const vars = themeTokensToCssVariableStyle(DEFAULT_THEME_TOKENS);
  assert.equal(vars['--token-color-success-bg'], '#ecfdf5');
  assert.equal(vars['--token-color-on-primary'], '#ffffff');
  assert.match(vars['--token-gradient-section'], /linear-gradient/i);
});
