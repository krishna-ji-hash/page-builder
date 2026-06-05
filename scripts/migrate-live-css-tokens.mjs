/**
 * One-off migrator: replace audit-list neutrals with semantic token vars.
 * Safe to re-run; skips live-semantic-tokens.css fallbacks.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const FILES = [
  'styles/shared/advanced-elements.css',
  'styles/shared/menu.css',
  'styles/shared/button.css',
  'styles/shared/feature-tabs.css',
  'styles/shared/section-template-parity.css',
  'styles/shared/faq-accordion.css',
  'styles/shared/template-sections.css',
  'styles/shared/get-in-touch.css',
  'styles/live/live-site.css',
];

const HEX_MAP = [
  ['#ffffff', 'var(--token-button-text)'],
  ['#FFFFFF', 'var(--token-button-text)'],
  ['#f8fafc', 'var(--token-bg-primary)'],
  ['#e2e8f0', 'var(--token-border-default)'],
  ['#cbd5e1', 'var(--token-border-default)'],
  ['#94a3b8', 'var(--token-text-muted)'],
  ['#64748b', 'var(--token-text-muted)'],
  ['#475569', 'var(--token-text-muted)'],
  ['#334155', 'var(--token-text-muted)'],
  ['#1e293b', 'var(--token-bg-primary)'],
  ['#111827', 'var(--token-text-primary)'],
  ['#0f172a', 'var(--token-text-primary)'],
];

for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  let s = fs.readFileSync(file, 'utf8');
  for (const [hex, rep] of HEX_MAP) {
    s = s.split(hex).join(rep);
  }
  s = s.replace(/var\(--token-button-text\)ff\b/g, 'var(--token-button-text)');
  s = s.replace(/var\(--token-bg-surface\)ff\b/g, 'var(--token-bg-surface)');
  fs.writeFileSync(file, s);
  console.log('migrated', rel);
}
