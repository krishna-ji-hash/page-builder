import { isPostgresDatabaseUrl } from './envValidation.js';

/**
 * Validate DATABASE_URL for PostgreSQL without connecting or logging secrets.
 * @param {string | undefined | null} databaseUrl
 * @returns {{
 *   ok: boolean,
 *   errorCode?: 'MISSING' | 'INVALID_SCHEME' | 'INVALID_URL',
 *   message?: string,
 *   host?: string,
 *   port?: number,
 *   database?: string,
 *   schema?: string | null,
 * }}
 */
export function validatePostgresDatabaseUrl(databaseUrl = process.env.DATABASE_URL) {
  const raw = String(databaseUrl || '').trim();
  if (!raw) {
    return {
      ok: false,
      errorCode: 'MISSING',
      message: 'DATABASE_URL is missing. Set a PostgreSQL URL in .env (see .env.example).',
    };
  }

  const lower = raw.toLowerCase();
  if (!lower.startsWith('postgresql://') && !lower.startsWith('postgres://')) {
    return {
      ok: false,
      errorCode: 'INVALID_SCHEME',
      message:
        'DATABASE_URL must start with postgresql:// or postgres:// (MySQL URLs are not supported for npm run dev).',
    };
  }

  if (!isPostgresDatabaseUrl(raw)) {
    return {
      ok: false,
      errorCode: 'INVALID_SCHEME',
      message: 'DATABASE_URL is not a valid PostgreSQL connection URL.',
    };
  }

  try {
    const url = new URL(raw);
    const database = decodeURIComponent(url.pathname.replace(/^\//, '') || '');
    if (!url.hostname) {
      return {
        ok: false,
        errorCode: 'INVALID_URL',
        message: 'DATABASE_URL host is missing.',
      };
    }
    const port = url.port ? Number(url.port) : 5432;
    return {
      ok: true,
      host: url.hostname,
      port: Number.isFinite(port) ? port : 5432,
      database: database || null,
      schema: url.searchParams.get('schema'),
    };
  } catch {
    return {
      ok: false,
      errorCode: 'INVALID_URL',
      message: 'DATABASE_URL could not be parsed. Example: postgresql://USER:PASSWORD@localhost:5432/documents_pg?schema=documents',
    };
  }
}

/**
 * Map node-postgres / network errors to clear startup messages (no credentials).
 * @param {unknown} error
 */
export function formatPostgresConnectionError(error) {
  const err = /** @type {{ code?: string, message?: string }} */ (error || {});
  const code = String(err.code || '');
  const message = String(err.message || error || 'Unknown database error');

  if (code === '28P01' || /password authentication failed/i.test(message)) {
    return {
      errorCode: 'AUTH_FAILED',
      message:
        'PostgreSQL authentication failed. Check DATABASE_URL username/password (credentials are not logged).',
    };
  }
  if (code === '3D000' || /database .+ does not exist/i.test(message)) {
    return {
      errorCode: 'DB_MISSING',
      message: 'PostgreSQL database from DATABASE_URL does not exist. Create it first (do not use migrate reset from this app).',
    };
  }
  if (
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    /connect ECONNREFUSED/i.test(message) ||
    /timeout/i.test(message)
  ) {
    return {
      errorCode: 'UNREACHABLE',
      message:
        'PostgreSQL server is unreachable. Start PostgreSQL on the host/port in DATABASE_URL (typically localhost:5432).',
    };
  }
  return {
    errorCode: 'CONNECT_FAILED',
    message: `PostgreSQL connection failed: ${message.split('\n')[0]}`,
  };
}

/** True when a script path/args refer to legacy MySQL/XAMPP ensure. */
export function isLegacyMysqlEnsureInvocation(args = []) {
  const joined = args.map(String).join(' ').toLowerCase();
  return (
    joined.includes('ensure-mysql') ||
    joined.includes('xampp') ||
    joined.includes('mysql_start') ||
    joined.includes('mysqladmin')
  );
}
