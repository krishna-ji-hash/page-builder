import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLOG_POST_TEMPLATE_SLUG,
  BLOG_POST_TEMPLATE_TITLE,
  isBlogPostTemplatePage,
} from '../lib/blogPostTemplatePage.js';
import { buildBlogDetailPageSectionRow } from '../lib/blogDetailPageTemplates.js';

test('blog post template constants', () => {
  assert.equal(BLOG_POST_TEMPLATE_SLUG, 'blog-post');
  assert.equal(BLOG_POST_TEMPLATE_TITLE, 'Blog Article Template');
  assert.equal(isBlogPostTemplatePage({ slug: 'blog-post' }), true);
  assert.equal(isBlogPostTemplatePage({ slug: 'blog' }), false);
});

test('blog detail full-page template has one blog_detail_page widget', () => {
  const row = buildBlogDetailPageSectionRow();
  const widget = row?.children?.[0]?.children?.[0]?.children?.[0]?.nodeType;
  assert.equal(widget, 'blog_detail_page');
  assert.equal(row?.props?.meta?.sectionTemplate, 'blogDetailPage');
});
