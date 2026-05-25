import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SECTION_WIDTH_MODES,
  resolveRootStripLayout,
  resolveSectionContentWidth,
  resolveSectionWidthMode,
  rowSectionStripDataAttrs,
  sectionContentDataAttrs,
} from '../lib/liveContentContainer.js';

const rootCtx = { isLiveDocRootRow: true, isHeaderRow: false, isFooterRow: false, isRootContentRow: true };

test('defaults root content sections to fullWidthContentBoxed', () => {
  assert.equal(resolveSectionWidthMode({}, rootCtx), SECTION_WIDTH_MODES.FULL_WIDTH_CONTENT_BOXED);
  assert.equal(resolveRootStripLayout({}, rootCtx), 'full');
  assert.equal(resolveSectionContentWidth({}, rootCtx), 'boxed');
  assert.deepEqual(rowSectionStripDataAttrs(true, {}, rootCtx), { 'data-live-root-strip': 'full' });
  assert.deepEqual(sectionContentDataAttrs({}, rootCtx), {
    'data-live-section-content': 'boxed',
    'data-live-content-band': 'true',
  });
});

test('boxed mode keeps section in content column', () => {
  const meta = { sectionWidthMode: 'boxed', rootStripLayout: 'boxed' };
  assert.equal(resolveSectionWidthMode(meta, rootCtx), SECTION_WIDTH_MODES.BOXED);
  assert.equal(resolveSectionContentWidth(meta, rootCtx), '');
  assert.deepEqual(rowSectionStripDataAttrs(true, meta, rootCtx), { 'data-live-root-strip': 'boxed' });
});

test('fullWidth mode bleeds without inner box', () => {
  const meta = { sectionWidthMode: 'fullWidth', rootStripLayout: 'full' };
  assert.equal(resolveSectionWidthMode(meta, rootCtx), SECTION_WIDTH_MODES.FULL_WIDTH);
  assert.equal(resolveSectionContentWidth(meta, rootCtx), '');
  assert.deepEqual(sectionContentDataAttrs(meta, rootCtx), {});
});

test('header rows do not use section width modes', () => {
  const ctx = { isLiveDocRootRow: true, isHeaderRow: true, isFooterRow: false };
  assert.equal(resolveSectionWidthMode({ rootStripLayout: 'full' }, ctx), '');
  assert.equal(resolveRootStripLayout({}, ctx), 'full');
});
