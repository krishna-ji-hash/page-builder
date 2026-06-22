/**
 * Scan live/shared/template CSS for hard-coded color literals.
 * Used by tests and CLI: node scripts/audit-hardcoded-colors.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

export const AUDIT_CSS_REL_PATHS = [
  'styles/shared/live-semantic-tokens.css',
  'styles/shared/dark-surface-copy.css',
  'styles/shared/advanced-elements.css',
  'styles/shared/menu.css',
  'styles/shared/button.css',
  'styles/shared/feature-tabs.css',
  'styles/shared/faq-accordion.css',
  'styles/shared/template-sections.css',
  'styles/shared/get-in-touch.css',
  'styles/shared/pdp.css',
  'styles/live/live-site.css',
];

/** Banned on `color:` / `background:` in section-contrast audited CSS (see AGENTS.md). */
export const SECTION_CONTRAST_BANNED_NEUTRALS = [
  '#0f172a',
  '#111827',
  '#ffffff',
  '#f8fafc',
  '#64748b',
  '#475569',
];

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const RGBA_RE = /rgba?\(\s*\d+/gi;

/** Lines/patterns that are acceptable hard-coded color uses. */
const LINE_ALLOW_RE = [
  /var\s*\([^)]*,\s*#/i,
  /color-mix\s*\(/i,
  /mask-image:/i,
  /-webkit-mask-image:/i,
  /linear-gradient\s*\([^)]*transparent/i,
  /\/\*/,
  /\*\//,
  /--token-/,
  /--color-/,
  /--live-section-/,
  /--bld-/,
];

function isAllowedLine(line) {
  return LINE_ALLOW_RE.some((re) => re.test(line));
}

/**
 * @param {string} relPath
 * @param {string} css
 * @returns {{ file: string, line: number, match: string, text: string }[]}
 */
export function findHardcodedColorsInFile(relPath, css) {
  const findings = [];
  const lines = css.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isAllowedLine(line)) continue;
    for (const re of [HEX_RE, RGBA_RE]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        findings.push({
          file: relPath,
          line: i + 1,
          match: m[0],
          text: line.trim().slice(0, 160),
        });
      }
    }
  }
  return findings;
}

/**
 * @param {{ root?: string, paths?: string[] }} [opts]
 */
export function auditHardcodedColors(opts = {}) {
  const root = opts.root || ROOT;
  const paths = opts.paths || AUDIT_CSS_REL_PATHS;
  const all = [];
  for (const rel of paths) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    const css = fs.readFileSync(abs, 'utf8');
    all.push(...findHardcodedColorsInFile(rel, css));
  }
  return all;
}

/**
 * Section-contrast lint: banned neutrals used directly on color/background props.
 * @param {{ root?: string, paths?: string[] }} [opts]
 * @returns {{ file: string, line: number, match: string, text: string }[]}
 */
export function auditSectionContrastBannedProps(opts = {}) {
  const root = opts.root || ROOT;
  const paths = opts.paths || AUDIT_CSS_REL_PATHS;
  const banned = new Set(SECTION_CONTRAST_BANNED_NEUTRALS.map((h) => h.toLowerCase()));
  const findings = [];
  for (const rel of paths) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isAllowedLine(line)) continue;
      if (!/(?:^|\s)(?:color|background(?:-color)?|border-color):/i.test(line)) continue;
      for (const hex of banned) {
        if (line.toLowerCase().includes(hex)) {
          findings.push({
            file: rel,
            line: i + 1,
            match: hex,
            text: line.trim().slice(0, 160),
          });
          break;
        }
      }
    }
  }
  return findings;
}

const NEUTRAL_HEX = new Set([
  '#0f172a',
  '#111827',
  '#64748b',
  '#475569',
  '#334155',
  '#94a3b8',
  '#cbd5e1',
  '#e2e8f0',
  '#f1f5f9',
  '#f8fafc',
  '#ffffff',
  '#fff',
]);

const STATUS_LEGACY_HEX = new Set([
  '#fef2f2',
  '#eff6ff',
  '#ecfdf5',
  '#fffbeb',
  '#f0fdf4',
  '#f0f9ff',
  '#991b1b',
  '#065f46',
  '#92400e',
  '#1e3a8a',
]);

function isCriticalFinding(f) {
  const m = String(f.match).toLowerCase();
  const text = f.text || '';
  if (STATUS_LEGACY_HEX.has(m)) return true;
  if (NEUTRAL_HEX.has(m) && /(?:^|\s)(?:color|background|border-color):/.test(text)) return true;
  return false;
}

/**
 * Dark-mode health score (0–100): baseline from semantic migration + finalization bonuses,
 * minus penalties for critical neutral/status literals on color/background props.
 */
export function scoreDarkModeHealth(
  findings,
  { hasStatusTokens = true, hasGradients = true, hasOnPrimary = true, hasPdpTokens = true } = {}
) {
  let score = 87;
  if (hasStatusTokens) score += 4;
  if (hasGradients) score += 3;
  if (hasOnPrimary) score += 3;
  if (hasPdpTokens) score += 3;
  const critical = findings.filter(isCriticalFinding);
  score -= critical.length * 1.5;
  if (critical.length > 0) {
    const decorative = findings.length - critical.length;
    score -= Math.min(3, decorative * 0.01);
  }
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

/**
 * Section-contrast audit score (0–100): penalize banned neutrals on color/background
 * and critical neutral literals — not decorative brand colors or shadow rgba().
 */
export function scoreSectionContrastAudit(bannedProps, findings) {
  const critical = (findings || []).filter(isCriticalFinding);
  let score = 100;
  score -= (bannedProps || []).length * 12;
  score -= critical.length * 4;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export { isCriticalFinding, NEUTRAL_HEX, STATUS_LEGACY_HEX };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const warnNeutrals = process.argv.includes('--warn-neutrals') || process.argv.includes('--section-contrast');
  const findings = auditHardcodedColors();
  const byFile = {};
  for (const f of findings) {
    byFile[f.file] = (byFile[f.file] || 0) + 1;
  }
  const payload = { total: findings.length, byFile, sample: findings.slice(0, 30) };
  if (warnNeutrals) {
    const bannedProps = auditSectionContrastBannedProps();
    payload.sectionContrastBannedProps = bannedProps.length;
    payload.sectionContrastSample = bannedProps.slice(0, 20);
    if (bannedProps.length) {
      console.error(
        `[section-contrast] ${bannedProps.length} banned neutral(s) on color/background in audited CSS — use var(--live-section-fg*) or tokens (see AGENTS.md)`
      );
      for (const f of bannedProps.slice(0, 15)) {
        console.error(`  ${f.file}:${f.line} ${f.match} — ${f.text}`);
      }
    }
  }
  console.log(JSON.stringify(payload, null, 2));
  if (warnNeutrals && payload.sectionContrastBannedProps > 0) {
    process.exit(1);
  }
}
