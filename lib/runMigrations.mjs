import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { buildMysqlBaseConfig } from './mysqlPoolOptions.js';
import {
  BOOTSTRAP_PREFIX,
  MIGRATIONS_DIR,
  getMigrationStatus,
  listMigrationFileNames,
  splitMigrationNames,
} from './db/migrationStatus.js';

/**
 * Apply SQL migrations under database/migrations.
 * Safe to call repeatedly: tracked migrations are skipped via `migrations` table.
 */
export async function runMigrations() {
  const connection = await mysql.createConnection({
    ...buildMysqlBaseConfig(),
    multipleStatements: true,
  });

  const database = process.env.MYSQL_DATABASE || 'documents';
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await connection.query(`USE \`${database}\``);

  const allNames = await listMigrationFileNames();
  const { bootstrap: bootstrapNames, tracked: trackedNames } = splitMigrationNames(allNames);

  for (const name of bootstrapNames) {
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, name), 'utf8');
    await connection.query(sql);
    process.stdout.write(`Bootstrap: ${name}\n`);
  }

  let applied = 0;
  let skipped = 0;

  for (const name of trackedNames) {
    const [existing] = await connection.query('SELECT 1 AS ok FROM migrations WHERE name = ? LIMIT 1', [name]);
    if (existing.length > 0) {
      process.stdout.write(`Skipped (already applied): ${name}\n`);
      skipped += 1;
      continue;
    }

    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, name), 'utf8');

    try {
      await connection.query(sql);
      try {
        await connection.query('INSERT INTO migrations (name) VALUES (?)', [name]);
      } catch (insertError) {
        if (insertError?.code === 'ER_DUP_ENTRY') {
          process.stdout.write(`Skipped (duplicate migration record): ${name}\n`);
          skipped += 1;
          continue;
        }
        throw insertError;
      }
      applied += 1;
      process.stdout.write(`Applied migration: ${name}\n`);
    } catch (error) {
      throw new Error(
        `Migration failed: ${name}\n${error.message}\n` +
          'Fix the SQL or restore from backup before retrying. Applied migrations are recorded in `migrations`.',
        { cause: error }
      );
    }
  }

  const status = await getMigrationStatus(connection);
  process.stdout.write(
    `\nMigration summary: applied=${applied} skipped=${skipped} pending=${status.pending.length} latest=${status.latestApplied || 'none'}\n`
  );

  if (status.pending.length > 0) {
    process.stderr.write(`Warning: pending migrations remain: ${status.pending.join(', ')}\n`);
  }

  await connection.end();
  return status;
}

export { getMigrationStatus, listMigrationFileNames, BOOTSTRAP_PREFIX };
