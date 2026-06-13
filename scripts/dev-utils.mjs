import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Bind dev server on all interfaces so LAN devices can connect (0.0.0.0). */
export function getDevHost() {
  const host = String(process.env.DEV_HOST || process.env.HOST || '0.0.0.0').trim();
  return host || '0.0.0.0';
}

function isPrivateIpv4(ip) {
  const parts = String(ip).split('.').map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
}

/** IPv4 addresses on this machine reachable from the local network. */
export function getLanIpv4Addresses() {
  const ips = new Set();
  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const entry of entries || []) {
      if (!entry || entry.family !== 'IPv4' || entry.internal) continue;
      if (isPrivateIpv4(entry.address)) ips.add(entry.address);
    }
  }
  return Array.from(ips);
}

export function getLanDevUrls(port = 3000) {
  const p = Number(port) || 3000;
  return getLanIpv4Addresses().map((ip) => `http://${ip}:${p}`);
}

export function printDevNetworkHints(port = 3000) {
  const urls = getLanDevUrls(port);
  process.stdout.write(`[dev] Local:   http://localhost:${port}\n`);
  if (!urls.length) {
    process.stdout.write('[dev] LAN:     (no private IPv4 found — check Wi‑Fi / Ethernet)\n');
    return;
  }
  process.stdout.write('[dev] LAN URLs (other Mac/PC on same Wi‑Fi):\n');
  for (const url of urls) {
    process.stdout.write(`[dev]   ${url}/admin/login\n`);
  }
  process.stdout.write('[dev] If LAN device cannot connect: run scripts/open-dev-firewall.ps1 as Administrator (Windows Firewall)\n');
}

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

const BUILDER_WARMUP_ROUTES = ['/admin/login', '/admin/dashboard'];

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
