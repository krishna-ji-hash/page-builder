import mysql from 'mysql2/promise';
import { buildMysqlPoolConfig } from './mysqlPoolOptions.js';
import { ensureEnvValidated } from './startupEnv.js';

/** Survive Next.js dev HMR — without this each reload leaks a new pool (→ ER_CON_COUNT_ERROR). */
const POOL_KEY = Symbol.for('builder.custom.mysql.pool');

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function attachPoolDiagnostics(pool) {
  pool.on('error', (err) => {
    console.error('[db] pool error:', err?.code || err?.message || err);
  });
}

function createPool() {
  ensureEnvValidated();
  requiredEnv('MYSQL_HOST');
  requiredEnv('MYSQL_USER');
  const pool = mysql.createPool(buildMysqlPoolConfig());
  attachPoolDiagnostics(pool);
  return pool;
}

export function getDbPool() {
  if (!globalThis[POOL_KEY]) {
    globalThis[POOL_KEY] = createPool();
  }
  return globalThis[POOL_KEY];
}

/** Graceful shutdown (scripts / tests). */
export async function closeDbPool() {
  const existing = globalThis[POOL_KEY];
  if (!existing) return;
  await existing.end();
  delete globalThis[POOL_KEY];
}

export async function withTransaction(callback) {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
