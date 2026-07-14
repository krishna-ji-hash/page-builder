import assert from 'node:assert/strict';
import {
  blogSchemaToPageSeoFields,
  normalizeBlogSchemaType,
  parseBlogSchemaJsonLd,
  stringifyBlogSchemaJsonLd,
} from '../lib/blogSchemaMarkup.js';

assert.equal(normalizeBlogSchemaType('custom'), 'custom');
assert.equal(normalizeBlogSchemaType('BlogPosting'), 'article');
assert.equal(normalizeBlogSchemaType('nope'), 'article');

const ok = parseBlogSchemaJsonLd('{"@type":"BlogPosting","headline":"Hi"}');
assert.equal(ok.ok, true);
assert.equal(ok.value['@type'], 'BlogPosting');

const bad = parseBlogSchemaJsonLd('{bad');
assert.equal(bad.ok, false);

const mapped = blogSchemaToPageSeoFields('article', null);
assert.equal(mapped.schemaType, 'BlogPosting');
assert.equal(mapped.schemaJsonLd, null);

const custom = blogSchemaToPageSeoFields('custom', { '@type': 'Product', name: 'X' });
assert.equal(custom.schemaType, '');
assert.equal(custom.schemaJsonLd.name, 'X');

assert.ok(stringifyBlogSchemaJsonLd({ a: 1 }).includes('"a"'));

console.log('blogSchemaMarkup.test.mjs: ok');
