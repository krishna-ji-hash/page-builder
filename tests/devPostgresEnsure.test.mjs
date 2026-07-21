import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  formatPostgresConnectionError,
  isLegacyMysqlEnsureInvocation,
  validatePostgresDatabaseUrl,
} from '../lib/devPostgresEnsure.js';

// valid PG URL
{
  const r = validatePostgresDatabaseUrl(
    'postgresql://postgres:secret@localhost:5432/documents_pg?schema=documents'
  );
  assert.equal(r.ok, true);
  assert.equal(r.host, 'localhost');
  assert.equal(r.port, 5432);
  assert.equal(r.database, 'documents_pg');
  assert.equal(r.schema, 'documents');
}

{
  const r = validatePostgresDatabaseUrl('postgres://u:p@127.0.0.1/documents_pg');
  assert.equal(r.ok, true);
  assert.equal(r.host, '127.0.0.1');
  assert.equal(r.port, 5432);
}

// missing
{
  const r = validatePostgresDatabaseUrl('');
  assert.equal(r.ok, false);
  assert.equal(r.errorCode, 'MISSING');
}

{
  const r = validatePostgresDatabaseUrl(undefined);
  assert.equal(r.ok, false);
  assert.equal(r.errorCode, 'MISSING');
}

// invalid scheme
{
  const r = validatePostgresDatabaseUrl('mysql://root@127.0.0.1:3306/documents');
  assert.equal(r.ok, false);
  assert.equal(r.errorCode, 'INVALID_SCHEME');
}

{
  const r = validatePostgresDatabaseUrl('http://localhost:5432/documents_pg');
  assert.equal(r.ok, false);
  assert.equal(r.errorCode, 'INVALID_SCHEME');
}

// invalid URL
{
  const r = validatePostgresDatabaseUrl('postgresql://');
  assert.equal(r.ok, false);
  assert.ok(r.errorCode === 'INVALID_URL' || r.errorCode === 'INVALID_SCHEME' || !r.ok);
}

// connection failure formatting
{
  const unreachable = formatPostgresConnectionError({ code: 'ECONNREFUSED', message: 'connect ECONNREFUSED' });
  assert.equal(unreachable.errorCode, 'UNREACHABLE');
  assert.equal(/PostgreSQL server is unreachable/i.test(unreachable.message), true);
}

{
  const auth = formatPostgresConnectionError({ code: '28P01', message: 'password authentication failed for user' });
  assert.equal(auth.errorCode, 'AUTH_FAILED');
  assert.equal(/authentication failed/i.test(auth.message), true);
  assert.equal(/password authentication failed for user \"/i.test(auth.message), false);
}

{
  const other = formatPostgresConnectionError({ code: 'XX000', message: 'boom\nsecret=should-not-multi' });
  assert.equal(other.errorCode, 'CONNECT_FAILED');
  assert.equal(other.message.includes('\n'), false);
}

// no MySQL/XAMPP launch attempt from new ensure script / helpers
assert.equal(isLegacyMysqlEnsureInvocation(['scripts/ensure-postgres.mjs']), false);
assert.equal(isLegacyMysqlEnsureInvocation(['--env-file=.env', 'scripts/ensure-mysql.mjs']), true);
assert.equal(isLegacyMysqlEnsureInvocation(['C:\\xampp\\mysql_start.bat']), true);

{
  const ensurePg = fs.readFileSync(path.join(process.cwd(), 'scripts', 'ensure-postgres.mjs'), 'utf8');
  assert.equal(/mysql_start/i.test(ensurePg), false);
  assert.equal(/mysqladmin/i.test(ensurePg), false);
  assert.equal(/MYSQL_HOST/.test(ensurePg), false);
  assert.equal(/ensure-mysql/.test(ensurePg), false);
  assert.equal(/xampp\\mysql/i.test(ensurePg), false);
  assert.equal(/SELECT 1/.test(ensurePg), true);
  assert.equal(/getDbPool/.test(ensurePg), true);
}

{
  const dev = fs.readFileSync(path.join(process.cwd(), 'scripts', 'dev.mjs'), 'utf8');
  assert.equal(/ensure-mysql/.test(dev), false);
  assert.equal(/ensure-postgres/.test(dev), true);
  assert.equal(/npm run db:xampp/i.test(dev), false);
  assert.equal(/scripts\/migrate\.mjs/.test(dev), false);
  assert.equal(/scripts\/bootstrap-admin\.mjs/.test(dev), false);
  assert.equal(/mysql_start/i.test(dev), false);
}

console.log('devPostgresEnsure.test.mjs: ok');
