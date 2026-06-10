import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_MAP_EMBED_URL,
  normalizeMapEmbedUrl,
  normalizeMapEmbedUrlForStorage,
} from '../lib/mapEmbedUrl.js';

test('normalizeMapEmbedUrl: bare Google Maps embed URL', () => {
  const url = 'https://www.google.com/maps/embed?pb=!1m18!1m12';
  assert.equal(normalizeMapEmbedUrl(url), url);
});

test('normalizeMapEmbedUrl: extracts src from iframe paste', () => {
  const embed = 'https://www.google.com/maps/embed?pb=abc123';
  const paste = `<iframe src="${embed}" width="600" height="450" style="border:0;" allowfullscreen loading="lazy"></iframe>`;
  assert.equal(normalizeMapEmbedUrl(paste), embed);
});

test('normalizeMapEmbedUrl: extracts src from iframe with single quotes', () => {
  const embed = 'https://www.google.com/maps/embed?pb=xyz';
  assert.equal(
    normalizeMapEmbedUrl(`<iframe src='${embed}' width="600"></iframe>`),
    embed
  );
});

test('normalizeMapEmbedUrl: decodes &amp; in pasted iframe src', () => {
  const embed = 'https://www.google.com/maps/embed?pb=a&b=c';
  const paste = `<iframe src="${embed.replace('&', '&amp;')}"></iframe>`;
  assert.equal(normalizeMapEmbedUrl(paste), embed);
});

test('normalizeMapEmbedUrlForStorage: keeps bare URL while typing', () => {
  assert.equal(normalizeMapEmbedUrlForStorage('https://www.goog'), 'https://www.goog');
});

test('normalizeMapEmbedUrlForStorage: cleans iframe paste', () => {
  const embed = 'https://www.google.com/maps/embed?pb=abc';
  assert.equal(
    normalizeMapEmbedUrlForStorage(`<iframe src="${embed}"></iframe>`),
    embed
  );
});

test('DEFAULT_MAP_EMBED_URL is a valid maps embed', () => {
  assert.match(DEFAULT_MAP_EMBED_URL, /^https:\/\/www\.google\.com\/maps\/embed\?/);
});
