import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { closeDbPool } from '../lib/db.js';
import { disconnectPrisma } from '../lib/prisma.ts';
import { buildHealthReport } from '../lib/db/dbHealth.js';
import {
  logBackupTarget,
  validateBackupEnv,
  validateRestorePath,
} from '../lib/db/backupRestore.js';
import { maskHost } from '../lib/db/maskSecrets.js';
import { listMigrationFileNames } from '../lib/db/migrationStatus.js';

test.after(async () => {
  await disconnectPrisma().catch(() => {});
  await closeDbPool().catch(() => {});
});

function assertReportHasNoSecrets(report) {
  const serialized = JSON.stringify(report);
  if (process.env.MYSQL_PASSWORD) {
    assert.doesNotMatch(serialized, new RegExp(escapeRegExp(process.env.MYSQL_PASSWORD)));
  }
  if (process.env.AUTH_SECRET) {
    assert.doesNotMatch(serialized, new RegExp(escapeRegExp(process.env.AUTH_SECRET)));
  }
  if (process.env.DATABASE_URL) {
    assert.doesNotMatch(serialized, new RegExp(escapeRegExp(process.env.DATABASE_URL)));
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const DOC_FILES = [
  'docs/DB_OWNERSHIP.md',
  'docs/NEW_FEATURE_DB_CHECKLIST.md',
  'docs/PRODUCTION_DB_CHECKLIST.md',
];

const SCRIPT_FILES = [
  'scripts/db-status.mjs',
  'scripts/db-backup.mjs',
  'scripts/db-restore.mjs',
  'scripts/health-check.mjs',
  'app/api/health/route.js',
];

const UNSAFE_LOG_PATTERNS = [
  /console\.log\([^)]*MYSQL_PASSWORD/i,
  /console\.log\([^)]*password/i,
  /process\.stdout\.write\([^)]*MYSQL_PASSWORD/i,
  /process\.stderr\.write\([^)]*MYSQL_PASSWORD/i,
];

for (const file of SCRIPT_FILES) {
  test(`script exists: ${file}`, () => {
    assert.ok(fs.existsSync(path.join(process.cwd(), file)), `${file} is missing`);
  });
}

for (const file of DOC_FILES) {
  test(`documentation exists: ${file}`, () => {
    assert.ok(fs.existsSync(path.join(process.cwd(), file)), `${file} is missing`);
  });
}

for (const file of ['scripts/db-backup.mjs', 'scripts/db-restore.mjs', 'scripts/db-status.mjs', 'scripts/health-check.mjs']) {
  test(`${file} does not log raw password patterns`, () => {
    const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
    for (const pattern of UNSAFE_LOG_PATTERNS) {
      assert.doesNotMatch(source, pattern, `unsafe pattern in ${file}: ${pattern}`);
    }
  });
}

test('validateBackupEnv requires MYSQL_*', () => {
  const result = validateBackupEnv({});
  assert.equal(result.ok, false);
  assert.match(result.error, /MYSQL_HOST/);
});

test('validateRestorePath requires explicit file', () => {
  const empty = validateRestorePath('');
  assert.equal(empty.ok, false);
  assert.match(empty.error, /explicit file path/i);

  const missing = validateRestorePath('backups/does-not-exist-xyz.sql');
  assert.equal(missing.ok, false);
  assert.match(missing.error, /not found/i);
});

test('logBackupTarget does not expose password', () => {
  const line = logBackupTarget({
    MYSQL_HOST: 'db.example.com',
    MYSQL_USER: 'root',
    MYSQL_PASSWORD: 'super-secret',
    MYSQL_DATABASE: 'documents',
  });
  assert.doesNotMatch(line, /super-secret/);
  assert.match(line, /host=/);
  assert.match(line, /db=documents/);
});

test('maskHost masks remote hosts', () => {
  assert.equal(maskHost('db.production.example.com'), 'db***om');
  assert.equal(maskHost('127.0.0.1'), '127.0.0.1');
});

test('migration files are discoverable', async () => {
  const names = await listMigrationFileNames();
  assert.ok(names.length > 0);
  assert.ok(names.some((n) => n.startsWith('000_')));
  assert.ok(names.some((n) => n.endsWith('.sql')));
});

test('buildHealthReport response shape', async () => {
  let report;
  try {
    report = await buildHealthReport();
  } catch (error) {
    assert.fail(`buildHealthReport should not throw: ${error.message}`);
  }

  const requiredKeys = [
    'status',
    'app',
    'mysql',
    'prisma',
    'migrations',
    'environment',
    'timestamp',
    'version',
    'database',
  ];
  for (const key of requiredKeys) {
    assert.ok(key in report, `missing key: ${key}`);
  }

  assert.ok(['ok', 'degraded', 'error'].includes(report.status));
  assert.ok(['ok', 'error', 'pending', 'missing_table'].includes(report.migrations) || report.migrations === 'warn');
  assert.equal(typeof report.database.host, 'string');
  assert.equal(typeof report.database.name, 'string');
  assert.equal(typeof report.database.poolLimit, 'number');
  assertReportHasNoSecrets(report);
});

test('health report database host is masked for non-local hosts', async () => {
  const prev = process.env.MYSQL_HOST;
  process.env.MYSQL_HOST = 'mysql.cluster.example.net';
  try {
    const report = await buildHealthReport();
    assert.ok(report.database.host.includes('***'));
    assert.doesNotMatch(report.database.host, /cluster\.example\.net/);
  } finally {
    if (prev === undefined) delete process.env.MYSQL_HOST;
    else process.env.MYSQL_HOST = prev;
  }
});
