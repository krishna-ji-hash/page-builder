/**
 * Non-destructive smoke: SELECT 1 against DATABASE_URL (PostgreSQL only).
 * Skips when DATABASE_URL is missing or not postgres.
 *
 * Usage: node --env-file=.env tests/pgPoolSmoke.test.mjs
 */
import assert from 'node:assert/strict';
import { isPostgresDatabaseUrl } from '../lib/envValidation.js';
import { closeDbPool, getDbPool } from '../lib/db.js';

const url = String(process.env.DATABASE_URL || '').trim();
if (!url || !isPostgresDatabaseUrl(url)) {
  console.log('pgPoolSmoke.test.mjs: skip (DATABASE_URL not set to PostgreSQL)');
  process.exit(0);
}

try {
  const pool = getDbPool();
  const [rows] = await pool.query('SELECT 1 AS ok');
  assert.equal(Number(rows[0]?.ok), 1);
  console.log('pgPoolSmoke.test.mjs: SELECT 1 ok');
} finally {
  await closeDbPool();
}
