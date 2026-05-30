import mysql from 'mysql2/promise';

/** Survive Next.js dev HMR — without this each reload leaks a new pool (→ ER_CON_COUNT_ERROR). */
const POOL_KEY = Symbol.for('builder.custom.mysql.pool');

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function mysqlPassword() {
  const raw = process.env.MYSQL_PASSWORD;
  if (raw === undefined || raw === null) return '';
  return String(raw);
}

function attachPoolDiagnostics(pool) {
  pool.on('error', (err) => {
    console.error('[db] pool error:', err?.code || err?.message || err);
  });
}

function createPool() {
  const pool = mysql.createPool({
    host: requiredEnv('MYSQL_HOST'),
    port: Number(process.env.MYSQL_PORT || 3306),
    user: requiredEnv('MYSQL_USER'),
    password: mysqlPassword(),
    database: process.env.MYSQL_DATABASE || 'documents',
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_LIMIT || 10),
    maxIdle: Number(process.env.MYSQL_POOL_MAX_IDLE || 5),
    idleTimeout: Number(process.env.MYSQL_POOL_IDLE_TIMEOUT_MS || 60_000),
    queueLimit: 0,
    namedPlaceholders: true,
    dateStrings: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
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
