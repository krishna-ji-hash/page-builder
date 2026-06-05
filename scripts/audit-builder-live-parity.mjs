/**
 * Audit CSS for builder-only layout overrides that can break preview/live parity.
 * CLI: node scripts/audit-builder-live-parity.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PARITY_BUILDER_CHROME_ALLOW,
  PARITY_RISKY_LAYOUT_PROPS,
  PARITY_SURFACE_SELECTOR,
} from '../lib/paritySurface.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

export const PARITY_AUDIT_CSS_DIRS = ['styles/shared', 'styles/builder', 'styles/live'];

const WIDGET_MARKERS = [
  'live-feature-tabs',
  'live-faq-accordion',
  'live-carousel',
  'bld-demo-feature-tabs',
  'bld-demo-faq-accordion',
  'bld-demo-carousel',
  'data-section-template',
  '.live-node.bld-row',
  '.live-node.bld-column',
  '.live-node.bld-stack',
];

/** Files that must not duplicate section layout — use styles/shared/section-template-parity.css */
export const PARITY_DUPLICATE_LAYOUT_FILES = [
  'styles/live/live-site.css',
  'styles/builder/builder-live-mirror.css',
];

const BUILDER_ONLY_MARKERS = ['.bld-canvas__page', '.bld-builder-root', '.bld-demo-'];

function listCssFiles(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    if (ent.isFile() && ent.name.endsWith('.css')) out.push(path.join(dir, ent.name));
    if (ent.isDirectory()) out.push(...listCssFiles(path.join(dir, ent.name)));
  }
  return out;
}

function splitRules(css) {
  const rules = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        rules.push(css.slice(start, i + 1));
        start = i + 1;
      }
    }
  }
  return rules;
}

function parseRule(block) {
  const idx = block.indexOf('{');
  if (idx < 0) return null;
  const selector = block.slice(0, idx).trim();
  const body = block.slice(idx + 1, -1);
  return { selector, body };
}

function touchesWidget(selector) {
  return WIDGET_MARKERS.some((m) => selector.includes(m));
}

function isBuilderOnlySelector(selector) {
  return BUILDER_ONLY_MARKERS.some((m) => selector.includes(m));
}

function hasParitySurface(selector) {
  return (
    selector.includes(PARITY_SURFACE_SELECTOR) ||
    selector.includes('.live-doc') ||
    selector.includes('.bld-canvas__live-mirror')
  );
}

/** Strict check — bare `.live-doc` alone is not an explicit parity surface. */
function hasExplicitParitySurface(selector) {
  return (
    selector.includes(PARITY_SURFACE_SELECTOR) ||
    selector.includes('.bld-canvas__live-mirror')
  );
}

function isChromeOnly(rule) {
  const { selector, body } = rule;
  if (PARITY_BUILDER_CHROME_ALLOW.some((m) => selector.includes(m))) return true;
  const props = PARITY_RISKY_LAYOUT_PROPS.filter((p) => new RegExp(`\\b${p}\\s*:`, 'i').test(body));
  if (!props.length) return true;
  const onlyPointer =
    /\bpointer-events\s*:/i.test(body) &&
    !PARITY_RISKY_LAYOUT_PROPS.some(
      (p) => p !== 'overflow' && new RegExp(`\\b${p}\\s*:`, 'i').test(body)
    );
  return onlyPointer;
}

function riskyPropsInBody(body) {
  return PARITY_RISKY_LAYOUT_PROPS.filter((p) => new RegExp(`\\b${p}\\s*:`, 'i').test(body));
}

/**
 * @param {string} relPath
 * @param {string} css
 */
export function auditBuilderLiveParityCss(relPath, css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const violations = [];
  for (const block of splitRules(stripped)) {
    const rule = parseRule(block);
    if (!rule || !rule.selector || rule.selector.startsWith('@')) continue;
    if (!touchesWidget(rule.selector)) continue;
    if (!isBuilderOnlySelector(rule.selector)) continue;
    if (hasParitySurface(rule.selector)) continue;
    if (isChromeOnly(rule)) continue;
    const risky = riskyPropsInBody(rule.body);
    if (!risky.length) continue;
    violations.push({
      file: relPath,
      selector: rule.selector.replace(/\s+/g, ' ').trim(),
      props: risky,
    });
  }
  return violations;
}

/**
 * Section template layout in live-site / builder-live-mirror must use the parity surface,
 * not bare `.live-doc` (prevents builder-only mirror duplicates).
 *
 * @param {string} relPath
 * @param {string} css
 */
export function auditSectionTemplateParitySurfaceCss(relPath, css) {
  if (!PARITY_DUPLICATE_LAYOUT_FILES.includes(relPath.replace(/\\/g, '/'))) return [];
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const violations = [];
  for (const block of splitRules(stripped)) {
    const rule = parseRule(block);
    if (!rule || !rule.selector || rule.selector.startsWith('@')) continue;
    if (!/\[data-section-template\s*=/.test(rule.selector)) continue;
    if (!rule.selector.includes('.live-doc')) continue;
    if (hasExplicitParitySurface(rule.selector)) continue;
    const risky = riskyPropsInBody(rule.body);
    if (!risky.length) continue;
    violations.push({
      file: relPath,
      selector: rule.selector.replace(/\s+/g, ' ').trim(),
      props: risky,
      kind: 'section-template-without-parity-surface',
    });
  }
  return violations;
}

export function runBuilderLiveParityAudit() {
  const files = PARITY_AUDIT_CSS_DIRS.flatMap((d) => listCssFiles(d));
  const all = [];
  for (const rel of files.sort()) {
    const css = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    all.push(...auditBuilderLiveParityCss(rel, css));
    all.push(...auditSectionTemplateParitySurfaceCss(rel, css));
  }
  return all;
}

function main() {
  const violations = runBuilderLiveParityAudit();
  if (!violations.length) {
    console.log('builder-live-parity audit: OK (no builder-only widget layout overrides)');
    process.exit(0);
  }
  console.error(`builder-live-parity audit: ${violations.length} issue(s)`);
  for (const v of violations) {
    console.error(`  ${v.file}`);
    console.error(`    ${v.selector}`);
    console.error(`    risky: ${v.props.join(', ')}`);
  }
  console.error(
    `\nFix: use ${PARITY_SURFACE_SELECTOR} in styles/shared/* or inline styles from lib/* (see lib/paritySurface.js).`
  );
  process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
