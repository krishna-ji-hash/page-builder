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
  getDevHost,
  printDevNetworkHints,
  waitForBuilderPageChunk,
  waitForDevReady,
  warmupDevRoutes,
} from './dev-utils.mjs';

const root = process.cwd();
const envFile = path.join(root, '.env');
const nextDir = path.join(root, '.next');
const PORT = Number(process.env.PORT || 3000);
const HOST = getDevHost();
const LOCAL_URL = `http://localhost:${PORT}`;

function printSingleDevUrl() {
  process.stdout.write('\n[dev] ═══════════════════════════════════════\n');
  process.stdout.write(`[dev]  ONE URL → ${LOCAL_URL}\n`);
  process.stdout.write('[dev] ═══════════════════════════════════════\n');
  process.stdout.write(`[dev]  Public site:      ${LOCAL_URL}/\n`);
  process.stdout.write(`[dev]  Projects/Builder: ${LOCAL_URL}/admin/projects\n`);
  process.stdout.write(`[dev]  Admin login:      ${LOCAL_URL}/admin/login\n`);
  process.stdout.write('[dev]  Other project home: /admin/projects → Set default → refresh /\n');
  process.stdout.write('[dev] ═══════════════════════════════════════\n\n');
}

const ensureMysqlArgs = fs.existsSync(envFile)
  ? ['--env-file=.env', path.join(root, 'scripts', 'ensure-mysql.mjs')]
  : [path.join(root, 'scripts', 'ensure-mysql.mjs')];
const ensureDb = spawnSync(process.execPath, ensureMysqlArgs, { cwd: root, stdio: 'inherit' });
if (ensureDb.status !== 0) {
  process.exit(ensureDb.status ?? 1);
}

const migrateArgs = fs.existsSync(envFile)
  ? ['--env-file=.env', path.join(root, 'scripts', 'migrate.mjs')]
  : [path.join(root, 'scripts', 'migrate.mjs')];

const mig = spawnSync(process.execPath, migrateArgs, { cwd: root, stdio: 'inherit' });
if (mig.status !== 0) {
  process.stderr.write(
    '\n[dev] Migration step failed. Start DB (npm run db:xampp or XAMPP MySQL), fix .env (see .env.example), or skip migrate with: npm run dev:simple\n\n'
  );
  process.exit(mig.status ?? 1);
}

if (fs.existsSync(envFile) && process.env.ADMIN_BOOTSTRAP_PASSWORD) {
  const bootstrapArgs = ['--env-file=.env', path.join(root, 'scripts', 'bootstrap-admin.mjs')];
  spawnSync(process.execPath, bootstrapArgs, { cwd: root, stdio: 'inherit' });
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
const devEnv = { ...process.env, PORT: String(PORT), HOST };
// Stale NODE_ENV=production (e.g. from prior `npm run build` in the same shell) breaks Edge middleware in dev.
delete devEnv.NODE_ENV;
const child = spawn(process.execPath, [nextBin, 'dev', '-H', HOST, '-p', String(PORT)], {
  cwd: root,
  stdio: 'inherit',
  env: devEnv,
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
      printDevNetworkHints(PORT);
      printSingleDevUrl();
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
