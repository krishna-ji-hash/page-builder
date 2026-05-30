/**
 * Run DB migrations (if possible), then start Next dev server on a fixed port.
 * - Kills stale dev servers on the same port (avoids 3000 vs 3001 split-brain ENOENT)
 * - Pre-compiles builder routes before you open the browser (avoids missing page.js)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import {
  killPort,
  waitForBuilderPageChunk,
  waitForDevReady,
  warmupDevRoutes,
} from './dev-utils.mjs';

const root = process.cwd();
const envFile = path.join(root, '.env');
const nextDir = path.join(root, '.next');
const PORT = Number(process.env.PORT || 3000);

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

if (process.env.BLD_DEV_CLEAN === '1') {
  try {
    if (fs.existsSync(nextDir)) {
      fs.rmSync(nextDir, { recursive: true, force: true });
      process.stdout.write('[dev] Cleared .next\n');
    }
    const webpackCache = path.join(root, 'node_modules', '.cache');
    if (fs.existsSync(webpackCache)) {
      fs.rmSync(webpackCache, { recursive: true, force: true });
      process.stdout.write('[dev] Cleared node_modules/.cache\n');
    }
  } catch {
    // ignore
  }
}

killPort(PORT);
killPort(3001);

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, 'dev', '-p', String(PORT)], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, PORT: String(PORT) },
});

let warmupStarted = false;
const startWarmup = () => {
  if (warmupStarted) return;
  warmupStarted = true;
  void (async () => {
    process.stdout.write(`[dev] Waiting for http://localhost:${PORT} …\n`);
    const ready = await waitForDevReady(PORT);
    if (!ready) {
      process.stderr.write('[dev] Dev server did not become ready in time.\n');
      return;
    }
    process.stdout.write('[dev] Pre-compiling builder routes (fixes ENOENT on first open)…\n');
    await warmupDevRoutes(PORT);
    const compiled = await waitForBuilderPageChunk(root);
    if (compiled) {
      process.stdout.write('[dev] Builder ready — open http://localhost:' + PORT + '/admin/builder/dispatch/home\n');
    } else {
      process.stderr.write(
        '[dev] Builder chunk still compiling. Wait for "✓ Compiled" in the log, then refresh.\n'
      );
    }
  })();
};

setTimeout(startWarmup, 1500);
child.on('spawn', startWarmup);
child.on('exit', (code) => process.exit(code ?? 0));

process.on('SIGINT', () => {
  try {
    child.kill('SIGINT');
  } catch {
    // ignore
  }
});
process.on('SIGTERM', () => {
  try {
    child.kill('SIGTERM');
  } catch {
    // ignore
  }
});
