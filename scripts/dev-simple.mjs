/** Start Next dev without running migrations (same port + warmup as npm run dev). */
import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  killPort,
  getDevHost,
  printDevNetworkHints,
  waitForBuilderPageChunk,
  waitForDevReady,
  warmupDevRoutes,
} from './dev-utils.mjs';

const root = process.cwd();
const PORT = Number(process.env.PORT || 3000);
const HOST = getDevHost();

killPort(PORT);
killPort(3001);

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, 'dev', '-H', HOST, '-p', String(PORT)], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, PORT: String(PORT), HOST },
});

void (async () => {
  await new Promise((r) => setTimeout(r, 1500));
  if (!(await waitForDevReady(PORT))) return;
  process.stdout.write('[dev] Pre-compiling builder routes…\n');
  await warmupDevRoutes(PORT);
  if (await waitForBuilderPageChunk(root)) {
    printDevNetworkHints(PORT);
    process.stdout.write('[dev] Builder ready — http://localhost:' + PORT + '/admin/builder/dispatch/home\n');
  }
})();

child.on('exit', (code) => process.exit(code ?? 0));
