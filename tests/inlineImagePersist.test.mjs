import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isDataImageUrl,
  mergeCarouselPropsForBulkPersist,
  mergeFeatureTabsPropsForBulkPersist,
  mergeImageNodePropsForBulkPersist,
  prepareTreeForBulkSave,
  slimNodePropsForBulkSave,
} from '../lib/inlineImagePersist.js';

test('isDataImageUrl detects inline images', () => {
  assert.equal(isDataImageUrl('data:image/png;base64,abc'), true);
  assert.equal(isDataImageUrl('/uploads/foo.png'), false);
  assert.equal(isDataImageUrl('https://cdn.example.com/a.jpg'), false);
});

test('slimNodePropsForBulkSave strips tab base64 images', () => {
  const props = {
    tabs: [{ id: 'a', label: 'A', imageSrc: 'data:image/png;base64,xxx', heading: 'Hi' }],
  };
  const slim = slimNodePropsForBulkSave(props, 'tabs');
  assert.equal(slim.tabs[0].imageSrc, undefined);
  assert.equal(slim.tabs[0].heading, 'Hi');
});

test('mergeFeatureTabsPropsForBulkPersist keeps DB media URL', () => {
  const existing = {
    tabs: [{ id: 'a', label: 'A', imageSrc: '/media/tab-a.png', heading: 'Old' }],
  };
  const incoming = {
    tabs: [{ id: 'a', label: 'A', heading: 'New' }],
  };
  const merged = mergeFeatureTabsPropsForBulkPersist(incoming, existing);
  assert.equal(merged.tabs[0].imageSrc, '/media/tab-a.png');
  assert.equal(merged.tabs[0].heading, 'New');
});

test('mergeCarouselPropsForBulkPersist keeps DB slide URLs', () => {
  const existing = {
    slides: [{ id: 'shc-1', imageSrc: '/uploads/hero.png', title: 'Hero' }],
  };
  const incoming = {
    slides: [{ id: 'shc-1', title: 'Updated hero' }],
  };
  const merged = mergeCarouselPropsForBulkPersist(incoming, existing);
  assert.equal(merged.slides[0].imageSrc, '/uploads/hero.png');
  assert.equal(merged.slides[0].title, 'Updated hero');
});

test('mergeImageNodePropsForBulkPersist keeps DB src URL', () => {
  const existing = { src: '/uploads/block.png', alt: 'Logo' };
  const incoming = { alt: 'Brand logo' };
  const merged = mergeImageNodePropsForBulkPersist(incoming, existing);
  assert.equal(merged.src, '/uploads/block.png');
  assert.equal(merged.alt, 'Brand logo');
});

test('slimNodePropsForBulkSave strips carousel slide base64', () => {
  const props = {
    slides: [{ id: 's1', imageSrc: 'data:image/png;base64,xxx' }],
  };
  const slim = slimNodePropsForBulkSave(props, 'carousel');
  assert.equal(slim.slides[0].imageSrc, undefined);
});

test('prepareTreeForBulkSave walks nested tree', () => {
  const tree = [
    {
      id: 1,
      nodeType: 'row',
      children: [
        {
          id: 2,
          nodeType: 'tabs',
          props: { tabs: [{ id: 't', imageSrc: 'data:image/jpeg;base64,ab' }] },
          children: [],
        },
      ],
    },
  ];
  const out = prepareTreeForBulkSave(tree);
  assert.equal(out[0].children[0].props.tabs[0].imageSrc, undefined);
});
