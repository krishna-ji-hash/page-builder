import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relPath) {
  return readFileSync(path.join(root, relPath), 'utf8');
}

/** Published live pipeline (route delegates to shared module). */
const LIVE_PIPELINE = ['lib/publicSitePage.jsx', 'app/[projectSlug]/[pageSlug]/page.jsx'];

test('public live route uses getPublishedPageForPublic only', () => {
  const pageRoute = read('app/[projectSlug]/[pageSlug]/page.jsx');
  const liveSrc = read('lib/publicSitePage.jsx');
  assert.match(pageRoute, /publicSitePage/);
  assert.match(liveSrc, /getPublishedPageForPublic/);
  assert.doesNotMatch(liveSrc, /getBuilderState|getDraftPageForBuilder|builder_nodes/);
  assert.doesNotMatch(pageRoute, /getBuilderState|getDraftPageForBuilder|builder_nodes/);
});

test('draft preview uses getDraftPageForBuilder not published service', () => {
  const src = read('components/live/DraftPreviewView.jsx');
  assert.match(src, /getDraftPageForBuilder/);
  assert.doesNotMatch(src, /getPublishedPageForPublic/);
});

test('draft preview metadata uses draft loader not published service', () => {
  const src = read('lib/draftPreviewMetadata.js');
  assert.match(src, /getDraftPageForBuilder/);
  assert.doesNotMatch(src, /getPublishedPageForPublic|builder_nodes/);
});

test('publishedPageService requires published_version_id and published status', () => {
  const src = read('services/site/publishedPageService.js');
  assert.match(src, /published_version_id IS NOT NULL/);
  assert.match(src, /pv\.status = 'published'/);
  assert.doesNotMatch(src, /FROM builder_nodes/i);
});

test('publishPage creates new published version without flipping draft row', () => {
  const src = read('services/builder/builderService.js');
  const publishBlock = src.slice(src.indexOf('export async function publishPage'));
  assert.match(publishBlock, /INSERT INTO page_versions/);
  assert.doesNotMatch(publishBlock, /SET status = 'published'\s+WHERE id = \?\s*,\s*\[fullDraft/);
  assert.match(src, /assertVersionMutableForDraftWrites/);
  assert.match(publishBlock, /freezeGlobalSectionsForPublish/);
  assert.match(publishBlock, /globalSections:/);
});

test('unpublishPage clears live pointer and archives snapshot without deleting versions', () => {
  const src = read('services/builder/builderService.js');
  const block = src.slice(src.indexOf('export async function unpublishPage'));
  assert.match(block, /published_version_id = NULL/);
  assert.match(block, /status = 'draft'/);
  assert.match(block, /status = 'archived'/);
  assert.doesNotMatch(block, /DELETE FROM page_versions/);
});

test('live page uses publishedGlobalSections via publicSitePage', () => {
  const liveSrc = read('lib/publicSitePage.jsx');
  assert.match(liveSrc, /publishedGlobalSections/);
  assert.doesNotMatch(liveSrc, /projectConfig\?\.globalSections/);
});

test('save draft route does not revalidate public live path', () => {
  const snapshotRoute = read('app/api/pages/[pageId]/snapshot/route.js');
  assert.doesNotMatch(snapshotRoute, /revalidatePath|revalidateTag/);
  const publishRoute = read('app/api/pages/[pageId]/publish/route.js');
  assert.match(publishRoute, /revalidatePath/);
});
