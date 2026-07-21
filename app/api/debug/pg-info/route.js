import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

/** Print at most once per server process (temporary debug). */
let printedOnce = false;

const INFO_SQL = `
  SELECT
    current_database() AS database_name,
    current_user AS database_user,
    current_schema() AS current_schema,
    version() AS postgres_version
`;

/**
 * Temporary non-destructive PG identity check.
 * GET /api/debug/pg-info
 * - Dev only
 * - Does not log DATABASE_URL or passwords
 * - Prints result once to the server console
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(INFO_SQL);
    const info = {
      database_name: rows?.[0]?.database_name ?? null,
      database_user: rows?.[0]?.database_user ?? null,
      current_schema: rows?.[0]?.current_schema ?? null,
      postgres_version: rows?.[0]?.postgres_version ?? null,
    };

    if (!printedOnce) {
      printedOnce = true;
      console.log('[db] PostgreSQL session info (temporary debug, /api/debug/pg-info):');
      console.log(JSON.stringify(info, null, 2));
    }

    return NextResponse.json({ ok: true, info, printedToConsoleOnce: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[db] pg-info failed:', message.split('\n')[0]);
    return NextResponse.json({ ok: false, error: message.split('\n')[0] }, { status: 500 });
  }
}
