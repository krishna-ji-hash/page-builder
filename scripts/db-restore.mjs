#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { spawn } from 'node:child_process';
import { createGunzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import {
  buildMysqldumpArgs,
  canRestoreInProduction,
  isInteractiveRestore,
  mysqlClientAvailable,
  validateBackupEnv,
  validateRestorePath,
} from '../lib/db/backupRestore.js';
import { maskHost } from '../lib/db/maskSecrets.js';

function getRestoreFileArg() {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  return args[0] || '';
}

async function decompressIfNeeded(filePath) {
  if (!filePath.toLowerCase().endsWith('.gz')) return filePath;
  const tempSql = path.join(tmpdir(), `restore-${Date.now()}.sql`);
  await pipeline(createReadStream(filePath), createGunzip(), createWriteStream(tempSql));
  return tempSql;
}

async function confirmRestore(database) {
  if (!isInteractiveRestore()) return true;
  const rl = readline.createInterface({ input, output });
  try {
    process.stdout.write(
      `\nWARNING: This will overwrite database "${database}" on host ${maskHost(process.env.MYSQL_HOST)}.\n`
    );
    const answer = await rl.question('Type the database name to confirm restore: ');
    return answer.trim() === database;
  } finally {
    rl.close();
  }
}

async function main() {
  const fileArg = getRestoreFileArg();
  const pathCheck = validateRestorePath(fileArg);
  if (!pathCheck.ok) {
    process.stderr.write(`${pathCheck.error}\n`);
    process.exit(1);
  }

  const prodCheck = canRestoreInProduction();
  if (!prodCheck.allowed) {
    process.stderr.write(`${prodCheck.reason}\n`);
    process.exit(1);
  }

  const envCheck = validateBackupEnv();
  if (!envCheck.ok) {
    process.stderr.write(`${envCheck.error}\n`);
    process.exit(1);
  }

  const clientCheck = mysqlClientAvailable();
  if (!clientCheck.available) {
    process.stderr.write('mysql client not found. Install MySQL client tools or set MYSQL_BIN_DIR.\n');
    process.exit(1);
  }

  const database = process.env.MYSQL_DATABASE || 'documents';
  const confirmed = await confirmRestore(database);
  if (!confirmed) {
    process.stderr.write('Restore cancelled.\n');
    process.exit(1);
  }

  let sqlPath = pathCheck.path;
  let tempFile = null;
  if (sqlPath.toLowerCase().endsWith('.gz')) {
    tempFile = await decompressIfNeeded(sqlPath);
    sqlPath = tempFile;
  }

  const { host, user } = buildMysqldumpArgs();
  const port = process.env.MYSQL_PORT || '3306';
  const password = process.env.MYSQL_PASSWORD ?? '';
  const mysqlArgs = [`-h${host}`, `-P${port}`, `-u${user}`];
  if (password) mysqlArgs.unshift(`-p${password}`);
  mysqlArgs.push(database);

  process.stdout.write(`Restoring ${path.basename(pathCheck.path)} → ${database} (${maskHost(host)})\n`);

  await new Promise((resolve, reject) => {
    const child = spawn(clientCheck.binary, mysqlArgs, { stdio: ['pipe', 'inherit', 'pipe'] });
    const inputStream = createReadStream(sqlPath);
    inputStream.pipe(child.stdin);
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
      else reject(new Error(stderr || `mysql import exited with code ${code}`));
    });
  });

  if (tempFile && fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }

  process.stdout.write('Restore complete.\n');
  process.stdout.write('Run: npm run db:status && npm run db:migrate\n');
}

main().catch((error) => {
  process.stderr.write(`Restore failed: ${error.message}\n`);
  process.exit(1);
});
