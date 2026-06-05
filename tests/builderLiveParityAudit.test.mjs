import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  auditBuilderLiveParityCss,
  auditSectionTemplateParitySurfaceCss,
  runBuilderLiveParityAudit,
} from '../scripts/audit-builder-live-parity.mjs';
import { PARITY_INLINE_STYLE_CONTRACTS, PARITY_SURFACE_SELECTOR } from '../lib/paritySurface.js';
import { featureTabPanelImageInlineStyle } from '../lib/featureTabPanelImage.js';

test('PARITY_SURFACE_SELECTOR covers live and builder mirror', () => {
  assert.match(PARITY_SURFACE_SELECTOR, /live-doc/);
  assert.match(PARITY_SURFACE_SELECTOR, /bld-canvas__live-mirror/);
});

test('feature tab image contract is registered', () => {
  assert.ok(PARITY_INLINE_STYLE_CONTRACTS.featureTabPanelImage);
});

test('audit flags builder-only widget overflow without parity surface', () => {
  const css = `
    .bld-canvas__page [data-section-template='featureTabs'] .live-node.bld-column {
      overflow-x: visible;
    }
  `;
  const hits = auditBuilderLiveParityCss('styles/shared/feature-tabs.css', css);
  assert.equal(hits.length, 1);
  assert.ok(hits[0].props.includes('overflow-x'));
});

test('audit allows parity surface selector', () => {
  const css = `
    ${PARITY_SURFACE_SELECTOR} [data-section-template='featureTabs'] .live-node.bld-column {
      overflow-x: visible;
    }
  `;
  const hits = auditBuilderLiveParityCss('styles/shared/feature-tabs.css', css);
  assert.equal(hits.length, 0);
});

test('audit allows builder chrome pointer-events only', () => {
  const css = `
    .bld-canvas__page .bld-node__shell:has(.bld-demo-feature-tabs) > .bld-node__chrome--overlay {
      pointer-events: none;
    }
  `;
  const hits = auditBuilderLiveParityCss('styles/shared/feature-tabs.css', css);
  assert.equal(hits.length, 0);
});

test('live-site.css imports shared section-template-parity.css', () => {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const liveSite = readFileSync(path.join(root, 'styles/live/live-site.css'), 'utf8');
  assert.match(liveSite, /section-template-parity\.css/);
});

test('audit ignores :not([data-section-template]) generic row rules', () => {
  const css = `
    .live-doc > section:not([data-section-template]) {
      overflow-y: visible;
      min-height: 0;
    }
  `;
  const hits = auditSectionTemplateParitySurfaceCss('styles/live/live-site.css', css);
  assert.equal(hits.length, 0);
});

test('audit flags bare live-doc section-template layout without parity surface', () => {
  const css = `
    .live-doc > section[data-section-template='faq'] {
      overflow-y: visible;
    }
  `;
  const hits = auditSectionTemplateParitySurfaceCss('styles/live/live-site.css', css);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, 'section-template-without-parity-surface');
});

test('audit allows parity surface for section templates', () => {
  const css = `
    ${PARITY_SURFACE_SELECTOR} > section[data-section-template='faq'] {
      overflow-y: visible;
    }
  `;
  const hits = auditSectionTemplateParitySurfaceCss('styles/live/live-site.css', css);
  assert.equal(hits.length, 0);
});

test('repo passes builder-live-parity audit', () => {
  const violations = runBuilderLiveParityAudit();
  assert.deepEqual(
    violations,
    [],
    violations.map((v) => `${v.file} ${v.selector} [${v.props}] ${v.kind ?? ''}`).join('\n')
  );
});

test('feature tab image inline style uses height for audit immunity', () => {
  const s = featureTabPanelImageInlineStyle('contain', 360);
  assert.equal(s.height, 'auto');
  assert.ok(s.maxHeight === 'none' || s.maxHeight);
});
