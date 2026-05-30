/**
 * Clears leaked MySQL connections after Next.js dev HMR (ER_CON_COUNT_ERROR / 1040).
 * Uses a single direct connection — does not use the app pool.
 *
 * Usage: node --env-file=.env scripts/db-recover-connections.mjs
 */
import mysql from 'mysql2/promise';

function env(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === null || v === '' ? fallback : String(v);
}

async function main() {
  const user = env('MYSQL_USER', 'root');
  const host = env('MYSQL_HOST', '127.0.0.1');
  const port = Number(env('MYSQL_PORT', '3306'));
  const database = env('MYSQL_DATABASE', 'documents');
  const password = env('MYSQL_PASSWORD', '');

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  try {
    const [statusRows] = await conn.query(`SHOW STATUS LIKE 'Threads_connected'`);
    const before = statusRows?.[0]?.Value ?? '?';
    console.log(`Threads connected (before): ${before}`);

    const [processes] = await conn.query(`SHOW FULL PROCESSLIST`);
    const mine = (processes || []).filter(
      (p) => String(p.User) === user && Number(p.Id) !== Number(conn.threadId)
    );
    let killed = 0;
    for (const p of mine) {
      try {
        await conn.query(`KILL ?`, [p.Id]);
        killed += 1;
      } catch {
        // already gone
      }
    }

    const [statusAfter] = await conn.query(`SHOW STATUS LIKE 'Threads_connected'`);
    const after = statusAfter?.[0]?.Value ?? '?';
    console.log(`Killed ${killed} connection(s) for user "${user}".`);
    console.log(`Threads connected (after): ${after}`);
    console.log('Restart `npm run dev` so the app uses the fixed global pool (lib/db.js).');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
