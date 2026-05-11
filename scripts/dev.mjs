/**
 * Run DB migrations (if possible), then start Next dev server.
 * Uses .env when present (same as db:migrate); otherwise relies on process env.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const root = process.cwd();
const envFile = path.join(root, '.env');
const migrateArgs = fs.existsSync(envFile)
  ? ['--env-file=.env', path.join(root, 'scripts', 'migrate.mjs')]
  : [path.join(root, 'scripts', 'migrate.mjs')];

const mig = spawnSync(process.execPath, migrateArgs, { cwd: root, stdio: 'inherit' });
if (mig.status !== 0) {
  process.stderr.write(
    '\n[dev] Migration step failed. Start DB (e.g. npm run db:up), fix .env (see .env.example), or skip migrate with: npm run dev:simple\n\n'
  );
  process.exit(mig.status ?? 1);
}

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, 'dev'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
child.on('exit', (code) => process.exit(code ?? 0));
