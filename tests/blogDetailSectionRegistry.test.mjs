import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLOG_DETAIL_SECTION_DEFS,
  BLOG_DETAIL_SECTION_NODE_TYPES,
  buildBlogDetailSectionWidgetRegistryEntries,
  getBlogDetailSectionDef,
  isAnyBlogDetailWidgetNodeType,
  isBlogDetailSectionNodeType,
} from '../lib/blogDetailSectionRegistry.js';
import { BLOG_DETAIL_SECTION_TEMPLATE_BUILDERS } from '../lib/blogDetailSectionTemplates.js';
import { SECTION_TEMPLATES } from '../lib/sectionTemplates.js';

test('blog detail section registry defines four standalone templates', () => {
  assert.equal(BLOG_DETAIL_SECTION_DEFS.length, 4);
  assert.equal(BLOG_DETAIL_SECTION_NODE_TYPES.size, 4);
});

test('blog detail section templates are registered in SECTION_TEMPLATES', () => {
  for (const def of BLOG_DETAIL_SECTION_DEFS) {
    assert.ok(BLOG_DETAIL_SECTION_TEMPLATE_BUILDERS[def.templateId], def.templateId);
    assert.ok(Array.isArray(SECTION_TEMPLATES[def.templateId]), def.templateId);
    const row = SECTION_TEMPLATES[def.templateId][0];
    assert.equal(row?.props?.meta?.sectionTemplate, def.templateId);
    const widget = row?.children?.[0]?.children?.[0]?.children?.[0];
    assert.equal(widget?.nodeType, def.nodeType);
  }
});

test('blog detail full page template inserts all four sections', () => {
  const rows = SECTION_TEMPLATES.blogDetailPage;
  assert.equal(rows.length, 4);
});

test('isAnyBlogDetailWidgetNodeType includes full page and sections', () => {
  assert.equal(isAnyBlogDetailWidgetNodeType('blog_detail_page'), true);
  assert.equal(isBlogDetailSectionNodeType('blog_detail_hero'), true);
  assert.equal(getBlogDetailSectionDef('blog_detail_article')?.sectionKey, 'article');
  const entries = buildBlogDetailSectionWidgetRegistryEntries();
  assert.ok(entries.blog_detail_sidebar);
});
