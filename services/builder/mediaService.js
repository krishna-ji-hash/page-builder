import fs from 'fs/promises';
import path from 'path';
import { getDbPool } from '@/lib/db';

function asFolder(value) {
  const v = String(value || '').trim();
  if (!v) return null;
  // prevent traversal and weirdness; folders are logical only
  if (v.includes('..') || v.includes('\\') || v.startsWith('/')) return null;
  return v.slice(0, 255);
}

export function normalizeMediaRow(row) {
  return {
    id: Number(row.id),
    projectId: Number(row.project_id),
    folder: row.folder ?? null,
    kind: row.kind,
    mimeType: row.mime_type,
    originalName: row.original_name,
    storageName: row.storage_name,
    storagePath: row.storage_path ?? null,
    publicUrl: row.public_url,
    thumbUrl: row.thumb_url ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    bytes: Number(row.bytes || 0),
    title: row.title ?? null,
    altText: row.alt_text ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createMediaAsset({
  projectId,
  folder,
  kind,
  mimeType,
  originalName,
  storageName,
  storagePath,
  publicUrl,
  thumbUrl,
  width,
  height,
  bytes,
  title,
  altText,
}) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  const pool = getDbPool();
  const safeFolder = asFolder(folder);
  const [res] = await pool.query(
    `INSERT INTO media_assets
      (project_id, folder, kind, mime_type, original_name, storage_name, storage_path, public_url, thumb_url, width, height, bytes, title, alt_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      pid,
      safeFolder,
      String(kind),
      String(mimeType),
      String(originalName),
      String(storageName),
      String(storagePath),
      String(publicUrl),
      thumbUrl ? String(thumbUrl) : null,
      width != null ? Number(width) : null,
      height != null ? Number(height) : null,
      Number(bytes || 0),
      title ? String(title).slice(0, 255) : null,
      altText ? String(altText).slice(0, 255) : null,
    ]
  );
  const id = res.insertId;
  const [rows] = await pool.query(`SELECT * FROM media_assets WHERE id = ? AND project_id = ? LIMIT 1`, [id, pid]);
  return rows.length ? normalizeMediaRow(rows[0]) : null;
}

export async function listMediaAssets({
  projectId,
  q,
  kind,
  folder,
  sort = 'created_desc',
  page = 1,
  pageSize = 48,
  recentOnly = false,
}) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  const safePageSize = Math.max(1, Math.min(120, Number(pageSize) || 48));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safePageSize;

  const where = ['project_id = ?'];
  const args = [pid];

  const query = String(q || '').trim();
  if (query) {
    where.push('(original_name LIKE ? OR title LIKE ? OR alt_text LIKE ?)');
    const like = `%${query}%`;
    args.push(like, like, like);
  }
  const k = String(kind || '').trim();
  if (k) {
    where.push('kind = ?');
    args.push(k);
  }
  const f = asFolder(folder);
  if (folder !== undefined && folder !== null) {
    if (f) {
      where.push('folder = ?');
      args.push(f);
    } else {
      where.push('folder IS NULL');
    }
  }
  if (recentOnly) {
    where.push('created_at >= (NOW() - INTERVAL 14 DAY)');
  }

  const orderBy =
    sort === 'name_asc'
      ? 'original_name ASC, id DESC'
      : sort === 'size_desc'
        ? 'bytes DESC, id DESC'
        : sort === 'size_asc'
          ? 'bytes ASC, id DESC'
          : sort === 'created_asc'
            ? 'created_at ASC, id ASC'
            : 'created_at DESC, id DESC';

  const pool = getDbPool();
  const [countRows] = await pool.query(`SELECT COUNT(*) AS c FROM media_assets WHERE ${where.join(' AND ')}`, args);
  const total = Number(countRows?.[0]?.c || 0);

  const [rows] = await pool.query(
    `SELECT * FROM media_assets WHERE ${where.join(' AND ')} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...args, safePageSize, offset]
  );
  return {
    page: safePage,
    pageSize: safePageSize,
    total,
    items: rows.map(normalizeMediaRow),
  };
}

export async function updateMediaAssetMetadata({ projectId, mediaId, title, altText, folder }) {
  const pid = Number(projectId);
  const id = Number(mediaId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid mediaId');
  const pool = getDbPool();
  const safeFolder = folder === undefined ? undefined : asFolder(folder);
  await pool.query(
    `UPDATE media_assets
      SET title = COALESCE(?, title),
          alt_text = COALESCE(?, alt_text),
          folder = ${safeFolder === undefined ? 'folder' : '?'}
      WHERE id = ? AND project_id = ?`,
    safeFolder === undefined
      ? [title != null ? String(title).slice(0, 255) : null, altText != null ? String(altText).slice(0, 255) : null, id, pid]
      : [title != null ? String(title).slice(0, 255) : null, altText != null ? String(altText).slice(0, 255) : null, safeFolder, id, pid]
  );
  const [rows] = await pool.query(`SELECT * FROM media_assets WHERE id = ? AND project_id = ? LIMIT 1`, [id, pid]);
  return rows.length ? normalizeMediaRow(rows[0]) : null;
}

/**
 * Delete a media asset (DB row + files on disk). Idempotent if already removed.
 * @param {{ projectId: number, mediaId: number }} params
 */
export async function deleteMediaAsset({ projectId, mediaId }) {
  const pid = Number(projectId);
  const id = Number(mediaId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid mediaId');

  const pool = getDbPool();
  const [rows] = await pool.query(`SELECT * FROM media_assets WHERE id = ? AND project_id = ? LIMIT 1`, [id, pid]);
  if (!rows.length) return { deleted: false };

  const row = rows[0];
  await pool.query(`DELETE FROM media_assets WHERE id = ? AND project_id = ?`, [id, pid]);

  const storagePath = String(row.storage_path || '').trim();
  if (storagePath) {
    await fs.unlink(storagePath).catch(() => {});
  }
  const thumbUrl = String(row.thumb_url || '').trim();
  if (thumbUrl.startsWith('/')) {
    const thumbAbs = path.join(process.cwd(), 'public', thumbUrl.replace(/^\//, ''));
    await fs.unlink(thumbAbs).catch(() => {});
  }

  return { deleted: true, id };
}

