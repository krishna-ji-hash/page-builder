import { readFileSync } from 'node:fs';
import { getDbPool } from '../db.js';
import { prisma } from '../prisma.ts';
import { validateEnv } from '../envValidation.js';
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

export function checkRequiredEnvStatus() {
  const required = ['MYSQL_HOST', 'MYSQL_USER'];
  const missing = required.filter((key) => !process.env[key]);
  const productionRequired = ['MYSQL_DATABASE', 'AUTH_SECRET'];
  const isProd = process.env.NODE_ENV === 'production';

  const warnings = [];
  if (!process.env.MYSQL_DATABASE) warnings.push('MYSQL_DATABASE not set');
  if (!process.env.AUTH_SECRET) warnings.push('AUTH_SECRET not set');

  let status = 'ok';
  if (missing.length > 0) status = 'error';
  else if (isProd && productionRequired.some((k) => !process.env[k])) status = 'error';
  else if (warnings.length > 0) status = 'warn';

  return { status, missing, warnings };
}

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

export async function getDatabaseMeta() {
  const pool = getDbPool();
  const connection = await pool.getConnection();
  try {
    const database = process.env.MYSQL_DATABASE || 'documents';
    const [tables] = await connection.query('SHOW TABLES');
    const tableKey = `Tables_in_${database}`;
    const tableNames = tables.map((row) => row[tableKey]);
    const missingPrismaTables = findMissingPrismaTables(tableNames);
    return {
      name: database,
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

  const [mysql, prismaHealth, migrations, dbMeta] = await Promise.all([
    checkMysqlHealth(),
    checkPrismaHealth(),
    checkMigrationsHealth(),
    getDatabaseMeta().catch((error) => ({
      name: process.env.MYSQL_DATABASE || 'documents',
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
      host: maskHost(process.env.MYSQL_HOST || '127.0.0.1'),
      name: dbMeta.name,
      poolLimit: Number(process.env.MYSQL_POOL_LIMIT || 10),
      tableCount: dbMeta.tableCount,
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
    },
  };

  return report;
}
