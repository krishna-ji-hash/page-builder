import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relPath) {
  return readFileSync(path.join(root, relPath), 'utf8');
}

const SURFACES = [
  { name: 'draft preview', file: 'components/live/DraftPreviewView.jsx' },
  { name: 'published live', file: 'lib/publicSitePage.jsx' },
];

const SHARED_RENDER_MARKERS = [
  'PublishedLiveTree',
  'LiveDoc',
  'live-site.css',
  'prepareNodesForLiveRender',
  'buildPublishedLiveRenderOptions',
  'data-token-mode',
  'themeTokens',
  'livePageCssVarOverridesForPage',
  'buildRenderNodesWithGlobals',
];

test('draft preview and published live share render surface markers', () => {
  for (const surface of SURFACES) {
    const src = read(surface.file);
    for (const marker of SHARED_RENDER_MARKERS) {
      assert.match(src, new RegExp(marker), `${surface.name} missing ${marker}`);
    }
  }
});

test('draft preview and published live expand CMS at read time', () => {
  assert.match(read('components/live/DraftPreviewView.jsx'), /expandCms/);
  assert.match(read('services/site/publishedPageService.js'), /expandCms/);
});

test('draft preview and published live expand linked global components', () => {
  assert.match(read('components/live/DraftPreviewView.jsx'), /expandLinkedGlobalComponents/);
  assert.match(read('services/site/publishedPageService.js'), /expandLinkedGlobalComponents/);
});

test('builder shell imports live-site.css for canvas parity', () => {
  assert.match(read('components/builder/BuilderShell.jsx'), /live-site\.css/);
});

test('liveRenderer is the shared leaf pipeline', () => {
  assert.match(read('lib/builderLiveParity.js'), /liveRenderer/);
  assert.match(read('lib/liveRenderer.js'), /export function renderNode/);
  assert.match(read('components/builder/BuilderCanvas.jsx'), /liveRenderer|builderLiveParity/);
});

test('interaction scroll observers bind in LiveDoc and builder canvas mirror', () => {
  const observerCleanup = /const unbindIx = bindInteractionObservers\([^)]+\)[\s\S]*return \(\) => \{[\s\S]*unbindIx\?\.\(\)/;
  assert.match(read('components/live/LiveDoc.jsx'), observerCleanup);
  const canvas = read('components/builder/BuilderCanvas.jsx');
  assert.match(canvas, /bindInteractionObservers/);
  assert.match(canvas, observerCleanup);
});
