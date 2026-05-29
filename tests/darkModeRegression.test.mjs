import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  createModePalettesFromFlat,
  resolveActiveThemeTokens,
  themeTokensToCssVariableStyle,
} from '../lib/themeTokens.js';
import {
  liveSectionContrastCssVarsForRow,
  LIVE_SECTION_FG_ON_DARK,
  LIVE_SECTION_FG_ON_LIGHT,
} from '../lib/liveSectionContrastVars.js';

const ROOT = path.resolve(import.meta.dirname, '..');

import { auditHardcodedColors, scoreDarkModeHealth } from '../scripts/audit-hardcoded-colors.mjs';

const AUDIT_CSS = [
  'styles/shared/advanced-elements.css',
  'styles/shared/menu.css',
  'styles/shared/button.css',
  'styles/shared/feature-tabs.css',
  'styles/shared/faq-accordion.css',
  'styles/shared/template-sections.css',
  'styles/shared/get-in-touch.css',
  'styles/shared/pdp.css',
  'styles/live/live-site.css',
];

const BANNED_PROP_PATTERNS = [
  /color:\s*#0f172a\b/i,
  /color:\s*#64748b\b/i,
  /color:\s*#475569\b/i,
  /color:\s*#334155\b/i,
  /color:\s*#94a3b8\b/i,
  /color:\s*#cbd5e1\b/i,
  /color:\s*#e2e8f0\b/i,
  /color:\s*#f8fafc\b/i,
  /background:\s*#0f172a\b/i,
  /background:\s*#ffffff\b/i,
];

test('live-semantic-tokens.css defines semantic alias chain', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles/shared/live-semantic-tokens.css'), 'utf8');
  const required = [
    '--token-text-primary',
    '--token-text-muted',
    '--token-bg-primary',
    '--token-bg-surface',
    '--token-border-default',
    '--token-card-bg',
    '--token-button-bg',
    '--token-button-text',
    '--token-gradient-hero',
    '--token-gradient-surface',
    '--token-gradient-section',
    '--live-section-fg',
  ];
  for (const name of required) {
    assert.match(css, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('audit CSS files avoid banned hard-coded neutrals on color/background', () => {
  for (const rel of AUDIT_CSS) {
    const css = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const re of BANNED_PROP_PATTERNS) {
      assert.doesNotMatch(css, re, `${rel} should not match ${re}`);
    }
  }
});

test('dark theme tokens resolve different background than light', () => {
  const config = {
    mode: 'dark',
    light: { colors: { background: '#ffffff', text: '#0f172a', primary: '#2563eb' } },
    dark: { colors: { background: '#0f172a', text: '#f8fafc', primary: '#60a5fa' } },
  };
  const lightVars = themeTokensToCssVariableStyle({ ...config, mode: 'light' });
  const darkVars = themeTokensToCssVariableStyle({ ...config, mode: 'dark' });
  assert.equal(lightVars['--token-color-background'], '#ffffff');
  assert.equal(darkVars['--token-color-background'], '#0f172a');
  assert.equal(darkVars['--token-mode'], 'dark');
});

test('section contrast on light row uses dark text tokens', () => {
  const vars = liveSectionContrastCssVarsForRow({
    css: { backgroundColor: '#ffffff' },
    deviceStyle: {},
    siteTheme: { presetId: 'dark', colors: { background: '#0f172a', text: '#f8fafc' } },
  });
  assert.equal(vars['--live-section-fg'], LIVE_SECTION_FG_ON_LIGHT);
});

test('section contrast on dark row uses light text tokens', () => {
  const vars = liveSectionContrastCssVarsForRow({
    css: { backgroundColor: '#0f172a' },
    deviceStyle: {},
    siteTheme: { presetId: 'light', colors: { background: '#f8fafc', text: '#0f172a' } },
  });
  assert.equal(vars['--live-section-fg'], LIVE_SECTION_FG_ON_DARK);
});

test('mixed page: light strip under dark site preset gets dark section fg', () => {
  const rowVars = liveSectionContrastCssVarsForRow({
    css: { backgroundColor: '#fefefe' },
    deviceStyle: { background: { backgroundColor: '#ffffff' } },
    siteTheme: { presetId: 'dark', colors: { text: '#f8fafc', background: '#0f172a' } },
  });
  const active = resolveActiveThemeTokens({
    mode: 'dark',
    dark: { colors: { background: '#0f172a', text: '#f8fafc' } },
  });
  assert.equal(rowVars['--live-section-fg'], LIVE_SECTION_FG_ON_LIGHT);
  assert.equal(active.colors.text, '#f8fafc');
});

test('theme tokens expose status, on-primary, and gradient CSS variables', () => {
  const vars = themeTokensToCssVariableStyle({ mode: 'light' });
  assert.equal(vars['--token-color-on-primary'], '#ffffff');
  assert.equal(vars['--token-color-success-bg'], '#ecfdf5');
  assert.equal(vars['--token-color-info'], '#2563eb');
  assert.match(vars['--token-gradient-hero'], /linear-gradient/i);
  const darkVars = themeTokensToCssVariableStyle({
    mode: 'dark',
    light: { colors: { onPrimary: '#ffffff' } },
    dark: { colors: { onPrimary: '#0f172a' } },
  });
  assert.equal(darkVars['--token-color-on-primary'], '#0f172a');
  const palettes = createModePalettesFromFlat({});
  const darkGradVars = themeTokensToCssVariableStyle({ mode: 'dark', ...palettes });
  assert.match(darkGradVars['--token-gradient-hero'], /0f172a|0b1220/i);
});

test('pdp.css uses semantic tokens not raw slate neutrals', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles/shared/pdp.css'), 'utf8');
  assert.match(css, /--token-text-primary/);
  assert.match(css, /--token-bg-surface/);
  assert.doesNotMatch(css, /#f1f5f9\b/i);
  assert.doesNotMatch(css, /rgba\(15,\s*23,\s*42/i);
});

test('dark mode health score meets finalization target', () => {
  const findings = auditHardcodedColors({ root: ROOT });
  const score = scoreDarkModeHealth(findings);
  assert.ok(score >= 95, `expected health >= 95, got ${score} (${findings.length} hard-coded hits)`);
});
