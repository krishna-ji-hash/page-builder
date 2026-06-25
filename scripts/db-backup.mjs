#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import {
  buildMysqldumpArgs,
  formatBackupStamp,
  logBackupTarget,
  mysqldumpAvailable,
  validateBackupEnv,
} from '../lib/db/backupRestore.js';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');

async function maybeGzip(sourcePath) {
  if (process.env.BACKUP_GZIP !== '1') return sourcePath;
  const gzPath = `${sourcePath}.gz`;
  await pipeline(createReadStream(sourcePath), createGzip(), createWriteStream(gzPath));
  fs.unlinkSync(sourcePath);
  return gzPath;
}

async function main() {
  const envCheck = validateBackupEnv();
  if (!envCheck.ok) {
    process.stderr.write(`${envCheck.error}\n`);
    process.exit(1);
  }

  const dumpCheck = mysqldumpAvailable();
  if (!dumpCheck.available) {
    process.stderr.write(
      'mysqldump not found. Install MySQL client tools or set MYSQL_BIN_DIR to the bin folder.\n'
    );
    process.exit(1);
  }

  fs.mkdirSync(BACKUPS_DIR, { recursive: true });

  const stamp = formatBackupStamp();
  const database = process.env.MYSQL_DATABASE || 'documents';
  const outfile = path.join(BACKUPS_DIR, `${stamp}-${database}.sql`);
  const latestPath = path.join(BACKUPS_DIR, 'latest.sql');

  const { args } = buildMysqldumpArgs();
  process.stdout.write(`Backing up ${logBackupTarget()} → ${path.basename(outfile)}\n`);

  await new Promise((resolve, reject) => {
    const out = createWriteStream(outfile);
    const child = spawn(dumpCheck.binary, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(out);
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      const text = String(chunk);
      if (!/Using a password on the command line interface can be insecure/i.test(text)) {
        stderr += text;
      }
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `mysqldump exited with code ${code}`));
    });
  });

  fs.copyFileSync(outfile, latestPath);
  const finalPath = await maybeGzip(outfile);

  process.stdout.write(`Backup complete: ${finalPath}\n`);
  process.stdout.write(`Latest copy: ${latestPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`Backup failed: ${error.message}\n`);
  process.exit(1);
});
