import assert from 'node:assert/strict';
import {
  BLOG_EDITOR_LIMITS,
  buildBlogEditorChecklist,
  clampWords,
  countWords,
} from '../lib/blogEditorLimits.js';

assert.equal(countWords('one two three'), 3);
assert.equal(clampWords('a b c d e', 3), 'a b c');
assert.ok(BLOG_EDITOR_LIMITS.titleMaxChars === 180);

const checklist = buildBlogEditorChecklist({
  title: 'Hello',
  slug: 'hello',
  excerpt: 'short excerpt words here now for test ok',
  contentJson: [],
  featuredImage: '',
  featuredImageAlt: '',
  categoryId: '',
  tagNames: [],
  seoTitle: '',
  seoDescription: '',
  faqs: [],
  enableArticleSchema: true,
  internalLinks: [],
  previewChecked: false,
});

assert.ok(checklist.find((i) => i.id === 'title')?.ok);
assert.equal(checklist.find((i) => i.id === 'featuredImage')?.ok, false);
assert.equal(checklist.find((i) => i.id === 'ready')?.ok, false);

console.log('blogEditorLimits.test.mjs: ok');
