import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_PATH = path.join(process.cwd(), 'battle-testing', 'lighthouse-history.json');

/**
 * @typedef {object} LighthouseMetricRun
 * @property {string} at — ISO timestamp
 * @property {string} url
 * @property {string} [project]
 * @property {string} [page]
 * @property {number|null} [lcpScore]
 * @property {number|null} [clsScore]
 * @property {number|null} [fcpScore]
 * @property {number|null} [tbtScore]
 * @property {string[]} [recommendations]
 */

function readStore(filePath = DEFAULT_PATH) {
  if (!existsSync(filePath)) {
    return { version: 1, runs: [] };
  }
  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf8'));
    if (!raw || typeof raw !== 'object') return { version: 1, runs: [] };
    return { version: 1, runs: Array.isArray(raw.runs) ? raw.runs : [] };
  } catch {
    return { version: 1, runs: [] };
  }
}

/**
 * @param {LighthouseMetricRun} entry
 * @param {string} [filePath]
 */
export function appendLighthouseRun(entry, filePath = DEFAULT_PATH) {
  const store = readStore(filePath);
  store.runs.push(entry);
  const maxRuns = 200;
  if (store.runs.length > maxRuns) {
    store.runs = store.runs.slice(store.runs.length - maxRuns);
  }
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
  return store;
}

/**
 * @param {string} project
 * @param {string} [filePath]
 */
export function lighthouseTrendForProject(project, filePath = DEFAULT_PATH) {
  const store = readStore(filePath);
  return store.runs.filter((r) => r.project === project).slice(-12);
}

/**
 * @param {object} lighthouseJson — raw Lighthouse JSON report
 */
/**
 * Composite performance score (0–100) from recent Lighthouse runs.
 * @param {LighthouseMetricRun[]} [runs]
 * @returns {number|null}
 */
export function scorePerformanceFromLighthouseRuns(runs) {
  const recent = (runs || []).slice(-12);
  if (!recent.length) return null;
  const keys = ['lcpScore', 'clsScore', 'fcpScore', 'tbtScore'];
  const weights = { lcpScore: 0.4, clsScore: 0.2, fcpScore: 0.15, tbtScore: 0.25 };
  let totalWeight = 0;
  let weighted = 0;
  for (const key of keys) {
    const vals = recent.map((r) => r[key]).filter((v) => typeof v === 'number');
    if (!vals.length) continue;
    const avg = vals.reduce((sum, v) => sum + v, 0) / vals.length;
    weighted += avg * weights[key];
    totalWeight += weights[key];
  }
  if (!totalWeight) return null;
  return Math.max(0, Math.min(100, Math.round(weighted / totalWeight)));
}

export function metricsFromLighthouseReport(lighthouseJson) {
  const audits = lighthouseJson?.audits || {};
  const score = (id) => {
    const s = audits[id]?.score;
    return typeof s === 'number' ? Math.round(s * 100) : null;
  };
  const recommendations = [];
  if (score('cumulative-layout-shift') != null && score('cumulative-layout-shift') < 90) {
    recommendations.push('Reduce layout shift: reserve image dimensions and stabilize hero/carousel height.');
  }
  if (score('largest-contentful-paint') != null && score('largest-contentful-paint') < 75) {
    recommendations.push('Improve LCP: prioritize hero image, compress assets, reduce main-thread work.');
  }
  if (audits['uses-responsive-images']?.score === 0) {
    recommendations.push('Serve appropriately sized responsive images.');
  }
  if (audits['modern-image-formats']?.score === 0) {
    recommendations.push('Use WebP/AVIF for large photographic images.');
  }
  return {
    lcpScore: score('largest-contentful-paint'),
    clsScore: score('cumulative-layout-shift'),
    fcpScore: score('first-contentful-paint'),
    tbtScore: score('total-blocking-time'),
    recommendations,
  };
}
