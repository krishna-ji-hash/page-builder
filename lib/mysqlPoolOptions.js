import fs from 'node:fs';

const MANAGED_MYSQL_HOST_MARKERS = [
  '.aivencloud.com',
  '.rds.amazonaws.com',
  '.database.azure.com',
  '.psdb.cloud',
];

function envTruthy(name) {
  const value = String(process.env[name] ?? '').trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function envFalsy(name) {
  const value = String(process.env[name] ?? '').trim().toLowerCase();
  return value === '0' || value === 'false' || value === 'no';
}

export function mysqlPassword() {
  const raw = process.env.MYSQL_PASSWORD;
  if (raw === undefined || raw === null) return '';
  return String(raw);
}

/** `MYSQL_SSL=auto` (default) | true | false */
export function shouldUseMysqlSsl(host = process.env.MYSQL_HOST) {
  const mode = String(process.env.MYSQL_SSL ?? 'auto').trim().toLowerCase();
  if (mode === 'true' || mode === '1' || mode === 'yes') return true;
  if (mode === 'false' || mode === '0' || mode === 'no') return false;

  const normalizedHost = String(host || '').toLowerCase();
  return MANAGED_MYSQL_HOST_MARKERS.some((marker) => normalizedHost.includes(marker));
}

export function resolveMysqlSsl(host = process.env.MYSQL_HOST) {
  if (!shouldUseMysqlSsl(host)) return undefined;

  const caPath = String(process.env.MYSQL_SSL_CA || '').trim();
  if (caPath) {
    return {
      ca: fs.readFileSync(caPath),
      rejectUnauthorized: !envFalsy('MYSQL_SSL_REJECT_UNAUTHORIZED'),
    };
  }

  // Managed hosts (e.g. Aiven) without a CA file — typical dev/staging setup.
  return {
    rejectUnauthorized: envTruthy('MYSQL_SSL_REJECT_UNAUTHORIZED'),
  };
}

export function buildMysqlBaseConfig(overrides = {}) {
  const host = overrides.host ?? process.env.MYSQL_HOST ?? '127.0.0.1';
  const config = {
    host,
    port: Number(overrides.port ?? process.env.MYSQL_PORT ?? 3306),
    user: overrides.user ?? process.env.MYSQL_USER ?? 'root',
    password: overrides.password ?? mysqlPassword(),
    database: overrides.database ?? process.env.MYSQL_DATABASE ?? 'documents',
    ...overrides,
  };

  const ssl = resolveMysqlSsl(host);
  if (ssl) config.ssl = ssl;

  return config;
}

export function buildMysqlPoolConfig(overrides = {}) {
  return {
    ...buildMysqlBaseConfig(overrides),
    charset: 'utf8mb4_unicode_ci',
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_LIMIT || 10),
    maxIdle: Number(process.env.MYSQL_POOL_MAX_IDLE || 5),
    idleTimeout: Number(process.env.MYSQL_POOL_IDLE_TIMEOUT_MS || 60_000),
    queueLimit: 0,
    namedPlaceholders: true,
    dateStrings: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };
}
