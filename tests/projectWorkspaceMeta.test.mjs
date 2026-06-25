import assert from 'node:assert/strict';
import {
  formatProjectWorkspaceMeta,
  projectSidebarLabel,
} from '../lib/admin/projectWorkspaceMeta.js';

const project = { id: 14, name: 'Dispatch', slug: 'd', type: 'website' };

assert.deepEqual(formatProjectWorkspaceMeta(project, { activeProjectId: 14 }), [
  { key: 'default', label: 'localhost default' },
  { key: 'type', label: 'website' },
]);

assert.deepEqual(formatProjectWorkspaceMeta({ id: 8, slug: 'dispatch', type: 'website' }, { activeProjectId: 14, primaryDomain: 'dispatch.local' }), [
  { key: 'domain', label: 'dispatch.local' },
  { key: 'type', label: 'website' },
]);

assert.equal(projectSidebarLabel(project, 14), 'Dispatch · localhost');
assert.equal(projectSidebarLabel({ id: 8, name: 'Dispatch', slug: 'dispatch', domain: 'dispatch.local' }, 14), 'Dispatch · dispatch.local');

console.log('projectWorkspaceMeta.test.mjs — all assertions passed');
