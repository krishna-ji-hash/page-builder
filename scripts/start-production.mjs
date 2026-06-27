/**
 * Production start: optional admin bootstrap, then Next.js server.
 * Render injects env vars directly — no .env file required.
 */
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const execPath = process.execPath;

if (String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '').trim()) {
  const bootstrap = spawnSync(execPath, [path.join(root, 'scripts', 'bootstrap-admin.mjs')], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (bootstrap.status !== 0) {
    process.exit(bootstrap.status ?? 1);
  }
}

const port = String(process.env.PORT || 3000);
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const server = spawnSync(execPath, [nextBin, 'start', '-H', '0.0.0.0', '-p', port], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

process.exit(server.status ?? 0);
