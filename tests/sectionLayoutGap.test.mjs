import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGallerySectionRow } from '../lib/templateSectionContent.js';
import {
  applySectionLayoutToDeviceStyle,
  buildSectionItemsHostGapUpdate,
  normalizeSectionLayout,
  resolveSectionItemsHostLayout,
  sectionItemsChildFlexForColumns,
  sectionLayoutCssVars,
  sectionLayoutGapPx,
} from '../lib/sectionLayout.js';

function assignIds(node, start = 1) {
  let id = start;
  function go(n) {
    n.id = id++;
    for (const c of n.children || []) go(c);
  }
  go(node);
  return node;
}

test('sectionLayoutGapPx prefers custom gapPx override', () => {
  const layout = normalizeSectionLayout({ gap: 'medium', gapPx: 8 }, 'gallery');
  assert.equal(sectionLayoutGapPx(layout), 8);
});

test('gallery items host gap update persists on section row and syncs host style', () => {
  const row = assignIds(structuredClone(buildGallerySectionRow()));
  const tree = [row];
  const host = row.children[0].children[0].children[1];
  assert.equal(host.displayName, 'Gallery grid');

  const update = buildSectionItemsHostGapUpdate(tree, host, 8);
  assert.ok(update);
  assert.equal(update.sectionRowPayload.props.meta.sectionLayout.gapPx, 8);

  const resolved = resolveSectionItemsHostLayout(tree, host);
  assert.equal(sectionLayoutGapPx(resolved), 20);

  row.props.meta.sectionLayout = update.sectionRowPayload.props.meta.sectionLayout;
  host.style_json = update.hostPayload.style_json;

  const after = resolveSectionItemsHostLayout(tree, host);
  assert.equal(sectionLayoutGapPx(after), 8);

  const css = applySectionLayoutToDeviceStyle(
    host.style_json.desktop,
    after,
    'desktop'
  );
  assert.equal(css.layout.gap, 8);
});

test('section layout preset without gapPx uses template default', () => {
  assert.equal(sectionLayoutGapPx(normalizeSectionLayout(null, 'gallery')), 20);
});

test('sectionItemsChildFlexForColumns uses live gap in calc', () => {
  const flex = sectionItemsChildFlexForColumns(3, 8);
  assert.equal(flex.flexBasis, 'calc((100% - 2 * 8px) / 3)');
  assert.equal(flex.maxWidth, 'calc((100% - 2 * 8px) / 3)');
});

test('sectionLayoutCssVars exposes gap and column count for CSS grid math', () => {
  const layout = normalizeSectionLayout({ gap: 'medium', gapPx: 12, columns: 3 }, 'gallery');
  assert.deepEqual(sectionLayoutCssVars(layout), {
    '--bld-section-layout-gap': '12px',
    '--bld-section-layout-cols': '3',
  });
});
