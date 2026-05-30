import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Stop processes listening on a TCP port (Windows + Unix). */
export function killPort(port) {
  const p = Number(port);
  if (!Number.isInteger(p) || p <= 0) return;

  if (process.platform === 'win32') {
    try {
      const out = execSync(`netstat -ano | findstr ":${p}" | findstr LISTENING`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const pids = new Set();
      for (const line of out.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(/\s+/);
        const pid = Number(parts[parts.length - 1]);
        if (Number.isInteger(pid) && pid > 0) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        } catch {
          // already gone
        }
      }
      if (pids.size) {
        process.stdout.write(`[dev] Freed port ${p} (stopped ${pids.size} old dev server(s))\n`);
      }
    } catch {
      // no listener
    }
    return;
  }

  try {
    execSync(`lsof -ti:${p} | xargs kill -9 2>/dev/null`, { stdio: 'ignore', shell: true });
  } catch {
    // no listener
  }
}

export async function waitForDevReady(port, maxMs = 120_000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, { redirect: 'manual' });
      if (res.status < 500) return true;
    } catch {
      // not up yet
    }
    await sleep(400);
  }
  return false;
}

const BUILDER_WARMUP_ROUTES = ['/admin/builder', '/admin/builder/dispatch/home'];

export async function warmupDevRoutes(port) {
  for (const route of BUILDER_WARMUP_ROUTES) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}${route}`, {
        redirect: 'manual',
        headers: { 'x-dev-warmup': '1' },
      });
      process.stdout.write(`[dev] Warmup ${route} → HTTP ${res.status}\n`);
    } catch (err) {
      process.stderr.write(`[dev] Warmup ${route} failed: ${err?.message || err}\n`);
    }
  }
}

/** Builder catch-all server chunk (Windows literal brackets in path). */
export function builderSlugPageChunkPath(rootDir = process.cwd()) {
  return path.join(rootDir, '.next', 'server', 'app', 'admin', 'builder', '[...slug]', 'page.js');
}

export async function waitForBuilderPageChunk(rootDir = process.cwd(), maxMs = 180_000) {
  const target = builderSlugPageChunkPath(rootDir);
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      if (fs.existsSync(target)) return true;
    } catch {
      // ignore
    }
    await sleep(500);
  }
  return fs.existsSync(target);
}
