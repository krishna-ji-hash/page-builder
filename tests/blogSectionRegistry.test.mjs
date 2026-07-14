import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLOG_SECTION_DEFS,
  BLOG_SECTION_NODE_TYPES,
  buildBlogSectionWidgetRegistryEntries,
  getBlogSectionDef,
  isBlogSectionNodeType,
} from '../lib/blogSectionRegistry.js';
import { BLOG_SECTION_TEMPLATE_BUILDERS } from '../lib/blogSectionTemplates.js';
import { SECTION_TEMPLATES } from '../lib/sectionTemplates.js';

test('blog section registry defines seven standalone templates', () => {
  assert.equal(BLOG_SECTION_DEFS.length, 7);
  assert.equal(BLOG_SECTION_NODE_TYPES.size, 7);
});

test('blog section templates are registered in SECTION_TEMPLATES', () => {
  for (const def of BLOG_SECTION_DEFS) {
    assert.ok(BLOG_SECTION_TEMPLATE_BUILDERS[def.templateId], def.templateId);
    assert.ok(Array.isArray(SECTION_TEMPLATES[def.templateId]), def.templateId);
    const row = SECTION_TEMPLATES[def.templateId][0];
    assert.equal(row?.props?.meta?.sectionTemplate, def.templateId);
    const widget = row?.children?.[0]?.children?.[0]?.children?.[0];
    assert.equal(widget?.nodeType, def.nodeType);
  }
});

test('buildBlogSectionWidgetRegistryEntries matches node types', () => {
  const entries = buildBlogSectionWidgetRegistryEntries();
  for (const def of BLOG_SECTION_DEFS) {
    assert.ok(entries[def.nodeType]);
    assert.equal(entries[def.nodeType].type, def.nodeType);
  }
});

test('getBlogSectionDef resolves hero section', () => {
  const def = getBlogSectionDef('blog_hub_hero');
  assert.equal(def?.sectionKey, 'hero');
  assert.equal(isBlogSectionNodeType('blog_hub_hero'), true);
  assert.equal(isBlogSectionNodeType('blog_full_page'), false);
});
