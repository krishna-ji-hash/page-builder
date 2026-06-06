/**
 * Wait for MySQL (127.0.0.1:3306). On Windows + XAMPP, try to start mysqld if offline.
 * Usage: node --env-file=.env scripts/ensure-mysql.mjs
 */
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import mysql from 'mysql2/promise';

function env(name, fallback = '') {
  const v = process.env[name];
  return v === undefined || v === null || v === '' ? fallback : String(v);
}

function portOpen(host, port, timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => {
      socket.removeAllListeners();
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

async function waitForPort(host, port, maxMs = 45_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await portOpen(host, port)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function xamppMysqlStartBat() {
  const candidates = [
    process.env.XAMPP_MYSQL_START,
    'C:\\xampp\\mysql_start.bat',
    'D:\\xampp\\mysql_start.bat',
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function tryStartXamppMysql() {
  if (process.platform !== 'win32') return false;
  const bat = xamppMysqlStartBat();
  if (!bat) return false;
  try {
    spawn('cmd.exe', ['/c', bat], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref();
    return true;
  } catch {
    return false;
  }
}

async function pingDatabase() {
  const host = env('MYSQL_HOST', '127.0.0.1');
  const port = Number(env('MYSQL_PORT', '3306'));
  const user = env('MYSQL_USER', 'root');
  const password = env('MYSQL_PASSWORD', '');
  const database = env('MYSQL_DATABASE', 'documents');
  const conn = await mysql.createConnection({ host, port, user, password, database, connectTimeout: 5000 });
  try {
    await conn.query('SELECT 1');
    return true;
  } finally {
    await conn.end();
  }
}

async function main() {
  const host = env('MYSQL_HOST', '127.0.0.1');
  const port = Number(env('MYSQL_PORT', '3306'));

  if (await portOpen(host, port)) {
    try {
      await pingDatabase();
      console.log(`[db] MySQL ready at ${host}:${port}`);
      return;
    } catch (e) {
      console.warn('[db] Port open but login failed:', e?.message || e);
      process.exit(1);
    }
  }

  console.warn(`[db] MySQL offline at ${host}:${port}`);

  if (tryStartXamppMysql()) {
    console.log('[db] Starting XAMPP MySQL…');
    const up = await waitForPort(host, port);
    if (!up) {
      console.error('[db] XAMPP MySQL did not start in time. Open XAMPP Control Panel → Start MySQL.');
      process.exit(1);
    }
    try {
      await pingDatabase();
      console.log(`[db] MySQL ready at ${host}:${port}`);
      return;
    } catch (e) {
      console.error('[db] MySQL started but connection failed:', e?.message || e);
      console.error('[db] Check MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE in .env');
      process.exit(1);
    }
  }

  console.error('[db] Start MySQL first:');
  console.error('  • XAMPP: Control Panel → MySQL → Start  (or npm run db:xampp)');
  console.error('  • Docker: npm run db:up');
  process.exit(1);
}

main().catch((err) => {
  console.error('[db]', err?.message || err);
  process.exit(1);
});
