import { getDbPool } from '../lib/db.js';

const pool = getDbPool();
const [rows] = await pool.query(`SELECT config_json FROM projects WHERE slug='dispatch' LIMIT 1`);
const cfg = typeof rows[0].config_json === 'string' ? JSON.parse(rows[0].config_json) : rows[0].config_json;
const foot = cfg?.globalSections?.footer;

function summarize(n, d = 0) {
  if (!n) return;
  const pad = '  '.repeat(d);
  const sj = n.style_json || {};
  const lo = sj.desktop?.layout || sj.layout || {};
  const sz = sj.desktop?.size || sj.size || {};
  console.log(
    `${pad}${n.nodeType} "${n.displayName || ''}" flex=${lo.flexDirection || '-'} wrap=${lo.flexWrap || '-'} w=${sz.width || lo.width || '-'}`
  );
  (n.children || []).forEach((c) => summarize(c, d + 1));
}
summarize(foot);
console.log('meta:', foot?.props?.meta);
await pool.end();
