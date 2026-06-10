import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBlogPreviewSectionRow } from '../lib/templateSectionContent.js';
import {
  nodeIsSectionItemsHost,
  normalizeSectionLayout,
  applySectionItemsChildToDeviceStyle,
  applySectionLayoutToDeviceStyle,
} from '../lib/sectionLayout.js';
import { mergeDeviceStyleWithTypeDefaults } from '../lib/nodeLayoutDefaults.js';
import { getDeviceStyle, styleToCss } from '../lib/styleToCss.js';

test('blogPreview posts row is detected as section items host', () => {
  const row = buildBlogPreviewSectionRow();
  const postsRow = row.children[0].children[0].children[2];
  assert.equal(nodeIsSectionItemsHost(postsRow), true);
});

test('section items child patch removes width 100% and sets 3-col flex', () => {
  const row = buildBlogPreviewSectionRow();
  const postsRow = row.children[0].children[0].children[2];
  const card = postsRow.children[0];
  const layout = normalizeSectionLayout(row.props.meta.sectionLayout, 'blogPreview');
  let cardDs = mergeDeviceStyleWithTypeDefaults('stack', getDeviceStyle(card.style_json, 'desktop'), {
    treeNode: card,
  });
  assert.equal(cardDs.size?.width, '100%');
  cardDs = applySectionItemsChildToDeviceStyle(cardDs, layout, 'desktop');
  const css = styleToCss(cardDs);
  assert.equal(css.width, undefined);
  assert.match(String(css.flexBasis), /33\.333%/);
  assert.match(String(css.maxWidth), /33\.333%/);
});

test('section items host uses row flex on desktop', () => {
  const row = buildBlogPreviewSectionRow();
  const postsRow = row.children[0].children[0].children[2];
  const layout = normalizeSectionLayout(row.props.meta.sectionLayout, 'blogPreview');
  const hostStyle = applySectionLayoutToDeviceStyle(getDeviceStyle(postsRow.style_json, 'desktop'), layout, 'desktop');
  const hostCss = styleToCss(
    mergeDeviceStyleWithTypeDefaults('stack', hostStyle, { treeNode: postsRow })
  );
  assert.equal(hostCss.flexDirection, 'row');
});
