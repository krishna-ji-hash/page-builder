import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { previewPagePath, previewVersionPath } from '../lib/builder/adminBuilderRoutes.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relPath) {
  return readFileSync(path.join(root, relPath), 'utf8');
}

assert.equal(previewVersionPath(42), '/preview/version/42');
assert.equal(previewVersionPath('bad'), null);
assert.equal(previewPagePath('dispatch', 'home', { versionId: 9 }), '/preview/dispatch/home?versionId=9');

const versionView = read('components/live/VersionPreviewView.jsx');
assert.match(versionView, /PublishedLiveTree/);
assert.match(versionView, /getVersionPreviewPageState/);
assert.match(versionView, /data-route-kind="version-preview"/);
assert.doesNotMatch(versionView, /BuilderCanvas/);

const service = read('services/site/versionPreviewService.js');
assert.match(service, /parsePublishedSnapshot/);
assert.match(service, /status IN \('published', 'archived'\)/);
assert.doesNotMatch(service, /builder_nodes/);

const modal = read('components/platform/VersionHistoryModal.jsx');
assert.match(modal, /previewVersionPath/);
assert.match(modal, /Restore to draft/);
assert.doesNotMatch(modal, /Preview JSON/);

console.log('versionPreview.test.mjs — all assertions passed');
