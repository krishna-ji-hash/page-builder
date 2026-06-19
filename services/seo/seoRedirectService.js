import { getDbPool } from '@/lib/db';
import { normalizeRedirectPath, validateRedirectLoops } from '@/lib/seo/seoRedirectHelpers';

function parseRow(r) {
  return {
    id: r.id,
    projectId: r.project_id,
    sourcePath: r.source_path,
    destinationPath: r.destination_path,
    redirectType: r.redirect_type,
    active: Boolean(r.active),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listSeoRedirects(projectId) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  const [rows] = await getDbPool().query(
    `SELECT * FROM seo_redirects WHERE project_id = ? ORDER BY source_path ASC`,
    [pid]
  );
  return rows.map(parseRow);
}

export async function createSeoRedirect(projectId, input) {
  const pid = Number(projectId);
  const sourcePath = normalizeRedirectPath(input?.sourcePath);
  const destinationPath = normalizeRedirectPath(input?.destinationPath);
  if (!sourcePath || !destinationPath) throw new Error('Source and destination paths are required');
  if (sourcePath === destinationPath) throw new Error('Source and destination must differ');
  const redirectType = input?.redirectType === '302' ? '302' : '301';
  const active = input?.active === false ? 0 : 1;

  const existing = await listSeoRedirects(pid);
  const loops = validateRedirectLoops([
    ...existing.filter((r) => r.active),
    { sourcePath, destinationPath, active: true },
  ]);
  if (loops.length) throw new Error(`Redirect loop detected: ${loops[0]}`);

  const [res] = await getDbPool().query(
    `INSERT INTO seo_redirects (project_id, source_path, destination_path, redirect_type, active)
     VALUES (?, ?, ?, ?, ?)`,
    [pid, sourcePath, destinationPath, redirectType, active]
  );
  const [rows] = await getDbPool().query(`SELECT * FROM seo_redirects WHERE id = ? LIMIT 1`, [res.insertId]);
  return parseRow(rows[0]);
}

export async function updateSeoRedirect(projectId, redirectId, input) {
  const pid = Number(projectId);
  const id = Number(redirectId);
  const existing = await listSeoRedirects(pid);
  const current = existing.find((r) => r.id === id);
  if (!current) throw new Error('Redirect not found');

  const sourcePath = input?.sourcePath != null ? normalizeRedirectPath(input.sourcePath) : current.sourcePath;
  const destinationPath =
    input?.destinationPath != null ? normalizeRedirectPath(input.destinationPath) : current.destinationPath;
  if (sourcePath === destinationPath) throw new Error('Source and destination must differ');

  const next = existing.map((r) =>
    r.id === id
      ? {
          ...r,
          sourcePath,
          destinationPath,
          redirectType: input?.redirectType === '302' ? '302' : input?.redirectType === '301' ? '301' : r.redirectType,
          active: input?.active === false ? false : input?.active === true ? true : r.active,
        }
      : r
  );
  const loops = validateRedirectLoops(next.filter((r) => r.active));
  if (loops.length) throw new Error(`Redirect loop detected: ${loops[0]}`);

  const redirectType = input?.redirectType === '302' ? '302' : input?.redirectType === '301' ? '301' : current.redirectType;
  const active = input?.active === false ? 0 : input?.active === true ? 1 : current.active ? 1 : 0;

  await getDbPool().query(
    `UPDATE seo_redirects SET source_path = ?, destination_path = ?, redirect_type = ?, active = ? WHERE id = ? AND project_id = ?`,
    [sourcePath, destinationPath, redirectType, active, id, pid]
  );
  const [rows] = await getDbPool().query(`SELECT * FROM seo_redirects WHERE id = ? LIMIT 1`, [id]);
  return parseRow(rows[0]);
}

export async function deleteSeoRedirect(projectId, redirectId) {
  const pid = Number(projectId);
  const id = Number(redirectId);
  const [res] = await getDbPool().query(`DELETE FROM seo_redirects WHERE id = ? AND project_id = ?`, [id, pid]);
  if (!res.affectedRows) throw new Error('Redirect not found');
  return true;
}

export { validateRedirectLoops } from '@/lib/seo/seoRedirectHelpers';

export async function resolveSeoRedirect(projectId, requestPath) {
  const pid = Number(projectId);
  const path = normalizeRedirectPath(requestPath);
  if (!path) return null;
  const [rows] = await getDbPool().query(
    `SELECT destination_path, redirect_type FROM seo_redirects
     WHERE project_id = ? AND source_path = ? AND active = 1 LIMIT 1`,
    [pid, path]
  );
  if (!rows.length) return null;
  return {
    destination: rows[0].destination_path,
    status: rows[0].redirect_type === '302' ? 302 : 301,
  };
}
