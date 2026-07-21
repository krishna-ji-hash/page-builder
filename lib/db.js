import pg from 'pg';
import { ensureEnvValidated } from './startupEnv.js';
import { buildPgPoolConfig, PG_SEARCH_PATH_SQL } from './pgPoolOptions.js';
import { convertSqlPlaceholders } from './sqlPlaceholders.js';

const { Pool } = pg;

/** Survive Next.js dev HMR — without this each reload leaks a new pool. */
const POOL_KEY = Symbol.for('builder.custom.pg.compatiblePool');
const SEARCH_PATH_FLAG = Symbol.for('builder.custom.pg.searchPathSet');

/**
 * Attach optional mysql2-compatible error aliases without overwriting PG `code`.
 * @param {unknown} error
 */
export function attachMysqlErrorAliases(error) {
  if (!error || typeof error !== 'object') return error;
  const err = /** @type {Record<string, unknown>} */ (error);
  if (err.code === '23505') err.mysqlCode = 'ER_DUP_ENTRY';
  if (err.code === '23503') err.mysqlCode = 'ER_NO_REFERENCED_ROW_2';
  return error;
}

/**
 * Map node-postgres Result → mysql2-style `[rows|header, fields]`.
 *
 * INSERT without RETURNING → insertId: 0 (call sites must add RETURNING id later).
 * INSERT … RETURNING id → insertId from row.id; full rows on `header.rows`.
 *
 * @param {import('pg').QueryResult} result
 * @returns {[unknown, unknown]}
 */
export function toMysqlStyleResult(result) {
  const rows = result.rows ?? [];
  const fields = result.fields ?? null;
  const command = String(result.command || '').toUpperCase();

  if (command === 'SELECT' || command === 'WITH' || command === 'SHOW' || command === 'EXPLAIN') {
    return [rows, fields];
  }

  if (command === 'INSERT' || command === 'UPDATE' || command === 'DELETE') {
    /** @type {Record<string, unknown>} */
    const header = {
      affectedRows: result.rowCount ?? 0,
      changedRows: result.rowCount ?? 0,
      insertId: 0,
      warningStatus: 0,
    };
    if (rows.length > 0) {
      header.rows = rows;
      const id = rows[0]?.id;
      if (id !== undefined && id !== null) {
        header.insertId = id;
      }
    }
    return [header, fields];
  }

  // Fallback: row-producing statements without a known DML command
  if (rows.length > 0 && (result.rowCount == null || result.rowCount === rows.length)) {
    return [rows, fields];
  }

  return [
    {
      affectedRows: result.rowCount ?? 0,
      changedRows: result.rowCount ?? 0,
      insertId: 0,
      warningStatus: 0,
    },
    fields,
  ];
}

/**
 * @param {{ query: Function }} client
 */
async function ensureSearchPath(client) {
  if (client[SEARCH_PATH_FLAG]) return;
  await client.query(PG_SEARCH_PATH_SQL);
  client[SEARCH_PATH_FLAG] = true;
}

/**
 * @param {{ query: Function }} client
 * @param {string} sql
 * @param {unknown} [params]
 */
async function runCompatibleQuery(client, sql, params) {
  await ensureSearchPath(client);
  const { text, values } = convertSqlPlaceholders(sql, params);
  try {
    const result = await client.query(text, values);
    return toMysqlStyleResult(result);
  } catch (error) {
    throw attachMysqlErrorAliases(error);
  }
}

export class CompatibleConnection {
  /**
   * @param {import('pg').PoolClient} client
   */
  constructor(client) {
    this._client = client;
    this._released = false;
  }

  query(sql, params) {
    return runCompatibleQuery(this._client, sql, params);
  }

  execute(sql, params) {
    return this.query(sql, params);
  }

  async beginTransaction() {
    await ensureSearchPath(this._client);
    await this._client.query('BEGIN');
  }

  async commit() {
    await this._client.query('COMMIT');
  }

  async rollback() {
    await this._client.query('ROLLBACK');
  }

  release() {
    if (this._released) return;
    this._released = true;
    this._client.release();
  }
}

export class CompatiblePool {
  /**
   * @param {import('pg').Pool} pool
   */
  constructor(pool) {
    this._pool = pool;
  }

  query(sql, params) {
    return runCompatibleQuery(this._pool, sql, params);
  }

  execute(sql, params) {
    return this.query(sql, params);
  }

  async getConnection() {
    const client = await this._pool.connect();
    try {
      await ensureSearchPath(client);
    } catch (error) {
      client.release();
      throw attachMysqlErrorAliases(error);
    }
    return new CompatibleConnection(client);
  }

  async end() {
    await this._pool.end();
  }
}

function createPool() {
  ensureEnvValidated();
  const config = buildPgPoolConfig();
  const pool = new Pool(config);
  pool.on('error', (err) => {
    console.error('[db] pool error:', err?.code || err?.message || err);
  });
  return new CompatiblePool(pool);
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
    try {
      await connection.rollback();
    } catch {
      // ignore rollback errors; rethrow original
    }
    throw error;
  } finally {
    connection.release();
  }
}
