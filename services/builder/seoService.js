import { getDbPool } from '@/lib/db';

function parseJsonValue(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

export async function getProjectSeo(projectId) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  const [rows] = await getDbPool().query(`SELECT id, config_json FROM projects WHERE id = ? LIMIT 1`, [pid]);
  if (!rows.length) throw new Error('Project not found');
  const config = parseJsonValue(rows[0].config_json, {}) || {};
  const seo = isPlainObject(config.seo) ? config.seo : {};
  return { seo, config };
}

export async function saveProjectSeo(projectId, patch) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  const nextPatch = isPlainObject(patch) ? patch : {};
  const { config } = await getProjectSeo(pid);
  const prevSeo = isPlainObject(config.seo) ? config.seo : {};
  const nextConfig = { ...config, seo: { ...prevSeo, ...nextPatch } };
  await getDbPool().query(`UPDATE projects SET config_json = ? WHERE id = ?`, [JSON.stringify(nextConfig), pid]);
  return nextConfig.seo;
}

export async function getPageSeo(pageId) {
  const id = Number(pageId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid pageId');
  const [rows] = await getDbPool().query(
    `SELECT id, seo_json FROM pages WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) throw new Error('Page not found');
  return parseJsonValue(rows[0].seo_json, {}) || {};
}

export async function savePageSeo(pageId, patch) {
  const id = Number(pageId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid pageId');
  const nextPatch = isPlainObject(patch) ? patch : {};
  const prev = await getPageSeo(id);
  const next = { ...(isPlainObject(prev) ? prev : {}), ...nextPatch };
  await getDbPool().query(`UPDATE pages SET seo_json = ? WHERE id = ?`, [JSON.stringify(next), id]);
  return next;
}

