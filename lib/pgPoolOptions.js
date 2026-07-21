import { isPostgresDatabaseUrl } from './envValidation.js';

function envTruthy(name) {
  const value = String(process.env[name] ?? '').trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function envFalsy(name) {
  const value = String(process.env[name] ?? '').trim().toLowerCase();
  return value === '0' || value === 'false' || value === 'no';
}

/**
 * @param {string} [databaseUrl]
 * @returns {string}
 */
export function requirePostgresDatabaseUrl(databaseUrl = process.env.DATABASE_URL) {
  const url = String(databaseUrl || '').trim();
  if (!url || !isPostgresDatabaseUrl(url)) {
    throw new Error('DATABASE_URL is required and must be a PostgreSQL connection URL.');
  }
  return url;
}

/**
 * Optional SSL for managed Postgres. Localhost defaults to no SSL.
 * PG_SSL=true|false|auto (default auto).
 * @param {string} connectionString
 */
export function resolvePgSsl(connectionString) {
  const mode = String(process.env.PG_SSL ?? process.env.DATABASE_SSL ?? 'auto')
    .trim()
    .toLowerCase();
  if (mode === 'false' || mode === '0' || mode === 'no') return undefined;
  if (mode === 'true' || mode === '1' || mode === 'yes') {
    return { rejectUnauthorized: !envFalsy('PG_SSL_REJECT_UNAUTHORIZED') };
  }

  try {
    const host = new URL(connectionString).hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return undefined;
    }
    // Managed hosts: enable SSL without requiring a CA file by default (local-friendly).
    if (envTruthy('PG_SSL_REJECT_UNAUTHORIZED')) {
      return { rejectUnauthorized: true };
    }
    return { rejectUnauthorized: false };
  } catch {
    return undefined;
  }
}

/**
 * Build node-postgres Pool config from DATABASE_URL.
 * Does not log credentials.
 *
 * @param {Record<string, unknown>} [overrides]
 */
export function buildPgPoolConfig(overrides = {}) {
  const connectionString = requirePostgresDatabaseUrl(
    /** @type {string | undefined} */ (overrides.connectionString ?? process.env.DATABASE_URL)
  );

  const ssl = Object.prototype.hasOwnProperty.call(overrides, 'ssl')
    ? overrides.ssl
    : resolvePgSsl(connectionString);

  const config = {
    connectionString,
    max: Number(overrides.max ?? process.env.PG_POOL_MAX ?? process.env.MYSQL_POOL_LIMIT ?? 10),
    idleTimeoutMillis: Number(
      overrides.idleTimeoutMillis ?? process.env.PG_POOL_IDLE_TIMEOUT_MS ?? 60_000
    ),
    connectionTimeoutMillis: Number(
      overrides.connectionTimeoutMillis ?? process.env.PG_POOL_CONNECTION_TIMEOUT_MS ?? 10_000
    ),
    ...overrides,
    connectionString,
  };

  if (ssl) config.ssl = ssl;
  else delete config.ssl;

  return config;
}

/** Applied on every new pool connection. */
export const PG_SEARCH_PATH_SQL = 'SET search_path TO documents, public';
