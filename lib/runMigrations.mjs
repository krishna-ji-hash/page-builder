import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { buildMysqlBaseConfig } from './mysqlPoolOptions.js';

const BOOTSTRAP_PREFIX = '000_';

/**
 * Apply SQL migrations under database/migrations (same rules as scripts/migrate.mjs).
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

  const migrationsDir = path.join(process.cwd(), 'database', 'migrations');
  const allNames = (await fs.readdir(migrationsDir))
    .filter((name) => name.endsWith('.sql'))
    .sort();

  const bootstrapNames = allNames.filter((name) => name.startsWith(BOOTSTRAP_PREFIX));
  const trackedNames = allNames.filter((name) => !name.startsWith(BOOTSTRAP_PREFIX));

  for (const name of bootstrapNames) {
    const sql = await fs.readFile(path.join(migrationsDir, name), 'utf8');
    await connection.query(sql);
    process.stdout.write(`Bootstrap: ${name}\n`);
  }

  for (const name of trackedNames) {
    const [applied] = await connection.query('SELECT 1 AS ok FROM migrations WHERE name = ? LIMIT 1', [name]);
    if (applied.length > 0) {
      process.stdout.write(`Skipped (already applied): ${name}\n`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, name), 'utf8');

    try {
      await connection.query(sql);
      await connection.query('INSERT INTO migrations (name) VALUES (?)', [name]);
    } catch (error) {
      throw new Error(`Migration failed: ${name}\n${error.message}`, { cause: error });
    }

    process.stdout.write(`Applied migration: ${name}\n`);
  }

  await connection.end();
}
