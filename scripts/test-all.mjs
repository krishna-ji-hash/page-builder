/**
 * Run every tests/*.test.mjs file (parity + stability suite).
 */
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const tests = readdirSync(path.join(root, 'tests'))
  .filter((f) => f.endsWith('.test.mjs'))
  .sort()
  .map((f) => `./tests/${f}`);

const result = spawnSync(
  process.execPath,
  ['--loader', './tests/node-alias-loader.mjs', '--test', ...tests],
  { cwd: root, stdio: 'inherit', shell: false }
);

process.exit(result.status === 0 ? 0 : 1);
