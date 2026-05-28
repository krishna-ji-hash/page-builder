/**
 * Run DB migrations (if possible), then start Next dev server.
 * Uses .env when present (same as db:migrate); otherwise relies on process env.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const root = process.cwd();
const envFile = path.join(root, '.env');
const nextDir = path.join(root, '.next');
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

// Defensive: Next 15 + webpack dev can occasionally leave a corrupt `.next/server/vendor-chunks/*` map on Windows.
// Wiping `.next` before starting keeps dev stable across restarts.
try {
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
} catch {
  // ignore
}

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, 'dev'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
child.on('exit', (code) => process.exit(code ?? 0));
