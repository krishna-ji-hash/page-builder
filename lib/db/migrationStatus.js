import fs from 'node:fs/promises';
import path from 'node:path';

export const BOOTSTRAP_PREFIX = '000_';
export const MIGRATIONS_DIR = path.join(process.cwd(), 'database', 'migrations');

export async function listMigrationFileNames() {
  const names = await fs.readdir(MIGRATIONS_DIR);
  return names.filter((name) => name.endsWith('.sql')).sort();
}

export function splitMigrationNames(allNames) {
  const bootstrap = allNames.filter((name) => name.startsWith(BOOTSTRAP_PREFIX));
  const tracked = allNames.filter((name) => !name.startsWith(BOOTSTRAP_PREFIX));
  return { bootstrap, tracked };
}

export async function migrationsTableExists(connection) {
  const database = process.env.MYSQL_DATABASE || 'documents';
  const [rows] = await connection.query(
    `SELECT 1 AS ok
     FROM information_schema.tables
     WHERE table_schema = ? AND table_name = 'migrations'
     LIMIT 1`,
    [database]
  );
  return rows.length > 0;
}

export async function getAppliedMigrationRows(connection) {
  const exists = await migrationsTableExists(connection);
  if (!exists) return [];

  const [rows] = await connection.query(
    'SELECT name, applied_at FROM migrations ORDER BY applied_at ASC, name ASC'
  );
  return rows;
}

export async function getMigrationStatus(connection) {
  const allNames = await listMigrationFileNames();
  const { bootstrap, tracked } = splitMigrationNames(allNames);
  const tableExists = await migrationsTableExists(connection);
  const appliedRows = tableExists ? await getAppliedMigrationRows(connection) : [];
  const appliedNames = new Set(appliedRows.map((r) => r.name));
  const pending = tracked.filter((name) => !appliedNames.has(name));
  const latestApplied = appliedRows.length ? appliedRows[appliedRows.length - 1].name : null;

  let status = 'ok';
  if (!tableExists) status = 'missing_table';
  else if (pending.length > 0) status = 'pending';

  return {
    status,
    tableExists,
    bootstrapCount: bootstrap.length,
    trackedCount: tracked.length,
    appliedCount: appliedRows.length,
    pending,
    latestApplied,
    appliedNames: [...appliedNames],
    trackedNames: tracked,
  };
}
