/**
 * Validate DATABASE_URL and run non-destructive SELECT 1 against PostgreSQL.
 * Usage: node --env-file=.env scripts/ensure-postgres.mjs
 *
 * Does not start legacy MySQL servers, does not migrate/reset/seed, does not modify data.
 */
import { closeDbPool, getDbPool } from '../lib/db.js';
import {
  formatPostgresConnectionError,
  validatePostgresDatabaseUrl,
} from '../lib/devPostgresEnsure.js';

function maskHostPort(host, port) {
  return `${host || '?'}:${port || '?'}`;
}

async function main() {
  const parsed = validatePostgresDatabaseUrl(process.env.DATABASE_URL);
  if (!parsed.ok) {
    console.error(`[db] ${parsed.message}`);
    console.error('[db] Example: DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/documents_pg?schema=documents"');
    process.exit(1);
  }

  console.log(
    `[db] Checking PostgreSQL at ${maskHostPort(parsed.host, parsed.port)}` +
      (parsed.database ? ` db=${parsed.database}` : '') +
      (parsed.schema ? ` schema=${parsed.schema}` : '')
  );

  try {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT 1 AS ok');
    const ok = Number(rows?.[0]?.ok) === 1;
    if (!ok) {
      console.error('[db] PostgreSQL responded but SELECT 1 did not return ok=1');
      process.exit(1);
    }
    console.log('[db] PostgreSQL ready (SELECT 1 ok)');

    // Temporary non-destructive identity dump (no password / DATABASE_URL).
    const [infoRows] = await pool.query(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        current_schema() AS current_schema,
        version() AS postgres_version
    `);
    const info = infoRows?.[0] || {};
    console.log('[db] PostgreSQL session info (temporary debug):');
    console.log(
      JSON.stringify(
        {
          database_name: info.database_name ?? null,
          database_user: info.database_user ?? null,
          current_schema: info.current_schema ?? null,
          postgres_version: info.postgres_version ?? null,
        },
        null,
        2
      )
    );
  } catch (error) {
    const formatted = formatPostgresConnectionError(error);
    console.error(`[db] ${formatted.message}`);
    process.exit(1);
  } finally {
    try {
      await closeDbPool();
    } catch {
      // ignore
    }
  }
}

main();
