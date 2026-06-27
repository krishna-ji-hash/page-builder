/**
 * Production start: migrations, optional admin bootstrap, then Next.js server.
 * Render injects env vars directly — no .env file required.
 */
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const execPath = process.execPath;

function runStep(label, scriptPath) {
  process.stdout.write(`[start] ${label}…\n`);
  const result = spawnSync(execPath, [scriptPath], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.stderr.write(`[start] ${label} failed (exit ${result.status ?? 1})\n`);
    process.exit(result.status ?? 1);
  }
}

runStep('Running migrations', path.join(root, 'scripts', 'migrate.mjs'));

if (String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '').trim()) {
  runStep('Bootstrapping admin user', path.join(root, 'scripts', 'bootstrap-admin.mjs'));
}

const port = String(process.env.PORT || 3000);
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
process.stdout.write(`[start] Next.js on 0.0.0.0:${port}\n`);

const server = spawnSync(execPath, [nextBin, 'start', '-H', '0.0.0.0', '-p', port], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

process.exit(server.status ?? 0);
