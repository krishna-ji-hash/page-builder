import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseBlogBodyToContentBlocks,
  serializeBlogContentToBody,
  normalizeBlogContentBlocks,
} from '../lib/blogPostContent.js';
import {
  extractWidgetPostsFromPageTree,
  findWidgetPostBySlug,
  widgetPostToDetailPost,
} from '../lib/publishedBlogPostUtils.js';

test('parseBlogBodyToContentBlocks splits heading and paragraphs', () => {
  const blocks = parseBlogBodyToContentBlocks('First heading\n\nBody copy here.\n\nSecond heading\n\nMore copy.', {
    title: 'Fallback title',
    description: 'Fallback description',
  });
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].heading, 'First heading');
  assert.equal(blocks[0].text, 'Body copy here.');
  assert.equal(blocks[1].heading, 'Second heading');
});

test('serializeBlogContentToBody round-trips structured blocks', () => {
  const content = [
    { heading: 'Intro', text: 'Hello world.' },
    { heading: 'Next', text: 'More text.' },
  ];
  const body = serializeBlogContentToBody(content);
  const parsed = parseBlogBodyToContentBlocks(body);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].heading, 'Intro');
  assert.equal(parsed[1].text, 'More text.');
});

test('extractWidgetPostsFromPageTree reads blog_full_page posts', () => {
  const nodes = [
    {
      nodeType: 'row',
      children: [
        {
          nodeType: 'blog_full_page',
          props: {
            featured: { title: '', description: '' },
            posts: [
              {
                id: 'post-1',
                slug: 'my-custom-post',
                title: 'My Custom Post',
                description: 'Summary',
                body: 'Section one\n\nBody one.',
                category: 'shipping-guide',
                image: 'https://example.com/a.jpg',
              },
            ],
          },
        },
      ],
    },
  ];
  const posts = extractWidgetPostsFromPageTree(nodes);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].slug, 'my-custom-post');
  const detail = widgetPostToDetailPost(posts[0]);
  assert.equal(detail.title, 'My Custom Post');
  assert.equal(detail.content.length, 1);
  assert.equal(detail.content[0].heading, 'Section one');
});

test('findWidgetPostBySlug resolves title-based slug', () => {
  const posts = [
    {
      id: 'post-1',
      slug: 'cod-remittance-ecommerce-shipping',
      title: 'How COD Remittance Works in eCommerce Shipping',
      description: 'Summary',
      body: 'Body',
      category: 'cod-wallet',
      image: '',
      href: '/blog/cod-remittance-ecommerce-shipping',
    },
  ];
  const match = findWidgetPostBySlug(posts, 'how-cod-remittance-works-in-ecommerce-shipping');
  assert.equal(match?.slug, 'cod-remittance-ecommerce-shipping');
});

test('normalizeBlogContentBlocks keeps structured content arrays', () => {
  const blocks = normalizeBlogContentBlocks([
    { heading: 'A', text: 'Alpha' },
    { heading: 'B', text: 'Beta' },
  ]);
  assert.deepEqual(blocks, [
    { heading: 'A', text: 'Alpha' },
    { heading: 'B', text: 'Beta' },
  ]);
});
