import assert from 'node:assert/strict';
import {
  BACKUP_EXPORT_TYPES,
  backupFilename,
  normalizeBackupExportType,
  sanitizeBackupSlug,
} from '../lib/admin/backupExport.js';

assert.equal(normalizeBackupExportType('project'), BACKUP_EXPORT_TYPES.PROJECT);
assert.equal(normalizeBackupExportType('forms'), BACKUP_EXPORT_TYPES.FORMS);
assert.equal(normalizeBackupExportType('invalid'), null);

assert.equal(sanitizeBackupSlug('Dispatch Site!'), 'dispatch-site');
assert.equal(sanitizeBackupSlug(''), 'project');

const name = backupFilename('dispatch', 'pages', 'json');
assert.match(name, /^dispatch-pages-backup-\d{4}-\d{2}-\d{2}\.json$/);

console.log('projectBackup.test.mjs: ok');
