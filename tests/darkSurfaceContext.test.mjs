import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyTemplateSectionContrast } from '../lib/getInTouchSection.js';
import { LIVE_SECTION_FG_ON_DARK } from '../lib/liveSectionContrastVars.js';
import { SITE_THEME_PRESETS } from '../lib/siteDesignTheme.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lightSite = { ...SITE_THEME_PRESETS.light, presetId: 'light', revision: 1, schemaVersion: 1 };

test('applyTemplateSectionContrast sets data-dark-surface on get in touch row', () => {
  const row = {
    nodeType: 'row',
    props: { meta: { sectionTemplate: 'getInTouch' } },
    style_json: { desktop: { background: { backgroundColor: '#1e3a8a' } } },
  };
  const { toneAttrs, css } = applyTemplateSectionContrast(row, {}, { siteTheme: lightSite });
  assert.equal(toneAttrs['data-section-tone'], 'dark');
  assert.equal(toneAttrs['data-dark-surface'], 'true');
  assert.equal(css['--live-section-fg'], LIVE_SECTION_FG_ON_DARK);
});

test('applyTemplateSectionContrast sets data-dark-surface on dark pitch column', () => {
  const { toneAttrs } = applyTemplateSectionContrast(
    { nodeType: 'column', id: 2 },
    { backgroundColor: '#0a0a0a' },
    { sectionTemplateId: 'platformHero', rowChildColumnIndex: 0, siteTheme: lightSite }
  );
  assert.equal(toneAttrs['data-section-tone'], 'dark');
  assert.equal(toneAttrs['data-dark-surface'], 'true');
});

test('dark-surface-copy.css uses live-section-fg-on-dark for copy', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles/shared/dark-surface-copy.css'), 'utf8');
  assert.match(css, /--live-section-fg-on-dark/);
  assert.match(css, /color:\s*var\(--live-section-fg-on-dark\)/);
  assert.doesNotMatch(css, /color:\s*var\(--live-section-fg\)\s*!important/);
});
