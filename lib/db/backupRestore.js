import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { maskHost, maskUser } from './maskSecrets.js';

const REQUIRED_BACKUP_ENV = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_DATABASE'];

export function validateBackupEnv(env = process.env) {
  const missing = REQUIRED_BACKUP_ENV.filter((key) => !env[key]);
  if (missing.length) {
    return { ok: false, error: `Missing required env: ${missing.join(', ')}` };
  }
  return { ok: true, error: null };
}

export function resolveMysqlBinary(binaryName, env = process.env) {
  const exe = process.platform === 'win32' ? `${binaryName}.exe` : binaryName;
  const binDir = String(env.MYSQL_BIN_DIR || '').trim();
  if (binDir) {
    const full = path.join(binDir, exe);
    if (fs.existsSync(full)) return full;
  }

  const winCandidates = [
    'C:\\xampp\\mysql\\bin',
    'D:\\xampp\\mysql\\bin',
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin',
    'C:\\Program Files\\MariaDB 10.11\\bin',
  ];
  if (process.platform === 'win32') {
    for (const dir of winCandidates) {
      const full = path.join(dir, exe);
      if (fs.existsSync(full)) return full;
    }
  }

  return exe;
}

export function mysqldumpAvailable(env = process.env) {
  const bin = resolveMysqlBinary('mysqldump', env);
  if (bin.includes(path.sep) || bin.includes('/')) {
    return { available: fs.existsSync(bin), binary: bin };
  }
  const result = spawnSync(bin, ['--version'], { encoding: 'utf8' });
  return { available: result.status === 0, binary: bin };
}

export function mysqlClientAvailable(env = process.env) {
  const bin = resolveMysqlBinary('mysql', env);
  if (bin.includes(path.sep) || bin.includes('/')) {
    return { available: fs.existsSync(bin), binary: bin };
  }
  const result = spawnSync(bin, ['--version'], { encoding: 'utf8' });
  return { available: result.status === 0, binary: bin };
}

export function formatBackupStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

export function buildMysqldumpArgs(env = process.env) {
  const host = env.MYSQL_HOST || '127.0.0.1';
  const port = String(env.MYSQL_PORT || 3306);
  const user = env.MYSQL_USER || 'root';
  const database = env.MYSQL_DATABASE || 'documents';
  const password = env.MYSQL_PASSWORD ?? '';

  const args = [
    `-h${host}`,
    `-P${port}`,
    `-u${user}`,
    '--single-transaction',
    '--routines',
    '--triggers',
    database,
  ];

  const extra = String(env.MYSQL_DUMP_EXTRA_ARGS || '').trim();
  if (extra) {
    args.push(...extra.split(/\s+/).filter(Boolean));
  }

  if (password) {
    args.unshift(`-p${password}`);
  }

  return { args, database, host, user };
}

export function logBackupTarget(env = process.env) {
  return `host=${maskHost(env.MYSQL_HOST)} user=${maskUser(env.MYSQL_USER)} db=${env.MYSQL_DATABASE || 'documents'}`;
}

export function validateRestorePath(filePath) {
  const raw = String(filePath || '').trim();
  if (!raw) {
    return { ok: false, error: 'Restore requires an explicit file path: npm run db:restore -- backups/file.sql' };
  }
  const resolved = path.resolve(raw);
  if (!fs.existsSync(resolved)) {
    return { ok: false, error: `Backup file not found: ${resolved}` };
  }
  if (!resolved.toLowerCase().endsWith('.sql') && !resolved.toLowerCase().endsWith('.gz')) {
    return { ok: false, error: 'Restore file must be a .sql or .sql.gz backup' };
  }
  return { ok: true, path: resolved, error: null };
}

export function canRestoreInProduction(env = process.env) {
  if (env.NODE_ENV !== 'production') return { allowed: true, reason: null };
  const confirm = String(env.RESTORE_CONFIRM || '').trim().toUpperCase();
  if (confirm === 'YES') return { allowed: true, reason: null };
  return {
    allowed: false,
    reason: 'Production restore blocked. Set RESTORE_CONFIRM=YES to proceed.',
  };
}

export function isInteractiveRestore(env = process.env) {
  return env.RESTORE_NON_INTERACTIVE !== '1' && process.stdin.isTTY;
}
