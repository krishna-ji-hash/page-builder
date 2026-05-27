/**
 * Run Lighthouse on battle home pages and append metrics to battle-testing/lighthouse-history.json
 *
 * Usage:
 *   npm run build && PORT=3001 npm run start
 *   npm run battle-test:lighthouse
 *
 * Env:
 *   BATTLE_BASE_URL=http://localhost:3001
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendLighthouseRun, metricsFromLighthouseReport } from '../lib/lighthouseHistory.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.env.BATTLE_BASE_URL || 'http://localhost:3001').replace(/\/+$/, '');

const TARGETS = [
  { project: 'battle-real-estate', page: 'home', path: '/battle-real-estate/home' },
  { project: 'battle-ecommerce', page: 'home', path: '/battle-ecommerce/home' },
  { project: 'battle-logistics', page: 'home', path: '/battle-logistics/home' },
];

function runLighthouse(url, outFile) {
  const args = [
    url,
    '--only-categories=performance',
    '--chrome-flags=--headless --no-sandbox',
    '--output=json',
    `--output-path=${outFile}`,
    '--quiet',
  ];
  const r = spawnSync('npx', ['--yes', 'lighthouse', ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  return r.status === 0;
}

async function main() {
  const tmpDir = path.join(root, 'battle-testing', '.lighthouse-runs');
  mkdirSync(tmpDir, { recursive: true });
  for (const t of TARGETS) {
    const url = `${BASE}${t.path}`;
    const outFile = path.join(tmpDir, `${t.project}-${t.page}.json`);
    process.stdout.write(`\nLighthouse → ${url}\n`);
    const ok = runLighthouse(url, outFile);
    if (!ok) {
      process.stderr.write(`  [FAIL] Lighthouse could not complete for ${url}\n`);
      continue;
    }
    const { readFileSync } = await import('node:fs');
    const report = JSON.parse(readFileSync(outFile, 'utf8'));
    const metrics = metricsFromLighthouseReport(report);
    appendLighthouseRun({
      at: new Date().toISOString(),
      url,
      project: t.project,
      page: t.page,
      ...metrics,
    });
    process.stdout.write(
      `  [OK] LCP audit ${metrics.lcpScore ?? '—'} CLS ${metrics.clsScore ?? '—'} FCP ${metrics.fcpScore ?? '—'}\n`
    );
  }
  process.stdout.write(`\nHistory → battle-testing/lighthouse-history.json\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
