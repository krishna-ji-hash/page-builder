import { readFileSync } from 'node:fs';
import { getDbPool } from '../db.js';
import { prisma } from '../prisma.ts';
import { isPostgresDatabaseUrl, validateEnv } from '../envValidation.js';
import { maskHost, redactSecrets } from './maskSecrets.js';
import { getMigrationStatus } from './migrationStatus.js';
import { findMissingPrismaTables } from './prismaSchemaTables.js';

export function getAppVersion() {
  if (process.env.APP_VERSION) return String(process.env.APP_VERSION).trim();
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    return pkg.version || pkg.name || 'dev';
  } catch {
    return 'dev';
  }
}

/** Parse host/db name from DATABASE_URL for reporting (no network I/O). */
export function getDatabaseUrlMeta() {
  const raw = String(process.env.DATABASE_URL || '').trim();
  if (!raw) {
    return { host: null, name: null, schema: null, isPostgres: false };
  }
  try {
    const url = new URL(raw);
    return {
      host: url.hostname || null,
      name: url.pathname.replace(/^\//, '') || null,
      schema: url.searchParams.get('schema') || null,
      isPostgres: isPostgresDatabaseUrl(raw),
    };
  } catch {
    return { host: null, name: null, schema: null, isPostgres: false };
  }
}

export function checkRequiredEnvStatus() {
  const required = ['DATABASE_URL'];
  const missing = required.filter((key) => !String(process.env[key] || '').trim());
  const productionRequired = ['AUTH_SECRET'];
  const isProd = process.env.NODE_ENV === 'production';

  const warnings = [];
  if (!process.env.AUTH_SECRET) warnings.push('AUTH_SECRET not set');
  if (process.env.DATABASE_URL && !isPostgresDatabaseUrl()) {
    warnings.push('DATABASE_URL must use postgresql:// or postgres://');
  }

  let status = 'ok';
  if (missing.length > 0) status = 'error';
  else if (process.env.DATABASE_URL && !isPostgresDatabaseUrl()) status = 'error';
  else if (isProd && productionRequired.some((k) => !process.env[k])) status = 'error';
  else if (warnings.length > 0) status = 'warn';

  return { status, missing, warnings };
}

/**
 * LEGACY (Phase P1 blocker): uses mysql2 pool via getDbPool().
 * Not a PostgreSQL health check — still MySQL-shaped until lib/db.js is migrated.
 */
export async function checkMysqlHealth() {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT 1 AS ok');
    return { status: rows[0]?.ok === 1 ? 'ok' : 'error', error: null };
  } catch (error) {
    return { status: 'error', error: error?.message || String(error) };
  }
}

export async function checkPrismaHealth() {
  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
    return { status: 'ok', error: null };
  } catch (error) {
    return { status: 'error', error: error?.message || String(error) };
  }
}

/**
 * LEGACY (Phase P1 blocker): migration tracker via mysql2 + information_schema.
 */
export async function checkMigrationsHealth() {
  try {
    const pool = getDbPool();
    const connection = await pool.getConnection();
    try {
      const migrationStatus = await getMigrationStatus(connection);
      return {
        status: migrationStatus.status === 'ok' ? 'ok' : migrationStatus.status === 'pending' ? 'pending' : 'error',
        ...migrationStatus,
        error: null,
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    return { status: 'error', error: error?.message || String(error), pending: [] };
  }
}

/**
 * LEGACY (Phase P1 blocker): SHOW TABLES is MySQL-specific; still runs on mysql2 pool.
 * Database *name* for the report prefers DATABASE_URL when set.
 */
export async function getDatabaseMeta() {
  const urlMeta = getDatabaseUrlMeta();
  const pool = getDbPool();
  const connection = await pool.getConnection();
  try {
    const database = urlMeta.name || process.env.MYSQL_DATABASE || 'documents';
    const [tables] = await connection.query('SHOW TABLES');
    const tableKey = `Tables_in_${database}`;
    const tableNames = tables.map((row) => row[tableKey]);
    const missingPrismaTables = findMissingPrismaTables(tableNames);
    return {
      name: database,
      schema: urlMeta.schema,
      tableCount: tableNames.length,
      missingPrismaTables,
    };
  } finally {
    connection.release();
  }
}

/**
 * Full health report for /api/health and scripts.
 * @param {{ strictEnv?: boolean }} [options]
 */
export async function buildHealthReport(options = {}) {
  const envCheck = checkRequiredEnvStatus();
  if (options.strictEnv) {
    try {
      validateEnv({ strict: true });
    } catch (error) {
      envCheck.status = 'error';
      envCheck.strictError = error.message;
    }
  }

  const urlMeta = getDatabaseUrlMeta();

  const [mysql, prismaHealth, migrations, dbMeta] = await Promise.all([
    checkMysqlHealth(),
    checkPrismaHealth(),
    checkMigrationsHealth(),
    getDatabaseMeta().catch((error) => ({
      name: urlMeta.name || process.env.MYSQL_DATABASE || 'documents',
      schema: urlMeta.schema,
      tableCount: null,
      missingPrismaTables: [],
      error: error?.message || String(error),
    })),
  ]);

  const checks = {
    app: 'ok',
    mysql: mysql.status,
    prisma: prismaHealth.status,
    migrations: migrations.status === 'pending' ? 'pending' : migrations.status,
    environment: envCheck.status,
  };

  const allOk =
    checks.mysql === 'ok' &&
    checks.prisma === 'ok' &&
    (checks.migrations === 'ok' || checks.migrations === 'pending') &&
    checks.environment !== 'error';

  const report = {
    status: allOk ? (checks.migrations === 'pending' ? 'degraded' : 'ok') : 'error',
    app: checks.app,
    mysql: checks.mysql,
    prisma: checks.prisma,
    migrations: checks.migrations,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    version: getAppVersion(),
    database: {
      host: maskHost(urlMeta.host || process.env.MYSQL_HOST || '127.0.0.1'),
      name: dbMeta.name,
      schema: dbMeta.schema || urlMeta.schema || null,
      poolLimit: Number(process.env.MYSQL_POOL_LIMIT || 10),
      tableCount: dbMeta.tableCount,
      /** mysql check still depends on legacy mysql2 pool (Phase P1). */
      legacyMysql2Pool: true,
    },
    details: {
      env: envCheck,
      mysqlError: redactSecrets(mysql.error),
      prismaError: redactSecrets(prismaHealth.error),
      migrationPending: migrations.pending || [],
      latestMigration: migrations.latestApplied || null,
      missingPrismaTables: dbMeta.missingPrismaTables || [],
      dbMetaError: redactSecrets(dbMeta.error),
      strictEnvError: redactSecrets(envCheck.strictError),
      note:
        'mysql / migrations / SHOW TABLES health paths still use lib/db.js (mysql2). Prisma uses DATABASE_URL.',
    },
  };

  return report;
}
