import { prisma } from '@/lib/prisma';
import { AdminMediaValidationError, parseMediaId, parseProjectId } from '@/lib/admin/adminMediaInput';
import {
  deleteMediaAsset,
  listMediaAssets,
  normalizeMediaRow,
} from '@/services/builder/mediaService';
import { processProjectMediaUpload } from '@/lib/media/processProjectMediaUpload';

export type SerializedMediaAsset = {
  id: number;
  projectId: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  storageKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  publicUrl: string;
  thumbUrl: string | null;
  kind: string;
  folder: string | null;
  width: number | null;
  height: number | null;
  title: string | null;
  altText: string | null;
};

function serializeFromLegacyRow(row: ReturnType<typeof normalizeMediaRow>): SerializedMediaAsset {
  return {
    id: row.id,
    projectId: row.projectId,
    fileName: row.storageName || row.originalName,
    originalName: row.originalName,
    mimeType: row.mimeType,
    size: row.bytes,
    url: row.publicUrl,
    storageKey: row.storagePath || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publicUrl: row.publicUrl,
    thumbUrl: row.thumbUrl,
    kind: row.kind,
    folder: row.folder,
    width: row.width,
    height: row.height,
    title: row.title,
    altText: row.altText,
  };
}

export async function listAdminProjectMedia(
  projectIdRaw: string,
  query: {
    q?: string;
    kind?: string;
    folder?: string | null;
    sort?: string;
    page?: number;
    pageSize?: number;
    recentOnly?: boolean;
  } = {}
) {
  const projectId = parseProjectId(projectIdRaw);
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw new AdminMediaValidationError('Project not found', 'NOT_FOUND');

  const data = await listMediaAssets({
    projectId: Number(projectId),
    q: query.q,
    kind: query.kind,
    folder: query.folder,
    sort: query.sort,
    page: query.page,
    pageSize: query.pageSize,
    recentOnly: query.recentOnly,
  });

  return {
    page: data.page,
    pageSize: data.pageSize,
    total: data.total,
    items: data.items.map(serializeFromLegacyRow),
  };
}

export async function uploadAdminProjectMedia(projectIdRaw: string, form: FormData) {
  const projectId = parseProjectId(projectIdRaw);
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw new AdminMediaValidationError('Project not found', 'NOT_FOUND');

  try {
    const { item } = await processProjectMediaUpload({ projectId: Number(projectId), form });
    if (!item) throw new AdminMediaValidationError('Upload failed');
    return { item: serializeFromLegacyRow(item) };
  } catch (error) {
    const err = error as Error & { status?: number };
    if (err.status === 413 || err.status === 415 || err.status === 400) {
      throw new AdminMediaValidationError(err.message);
    }
    throw error;
  }
}

export async function resolveMediaProjectId(mediaIdRaw: string): Promise<string | null> {
  try {
    const mediaId = parseMediaId(mediaIdRaw);
    const { getDbPool } = await import('@/lib/db');
    const pool = getDbPool();
    const [rows] = await pool.query(`SELECT project_id FROM media_assets WHERE id = ? LIMIT 1`, [
      Number(mediaId),
    ]);
    const legacy = (rows as { project_id?: bigint }[])?.[0];
    return legacy?.project_id != null ? String(legacy.project_id) : null;
  } catch {
    return null;
  }
}

export async function deleteAdminMedia(mediaIdRaw: string) {
  const mediaId = parseMediaId(mediaIdRaw);
  const projectIdRaw = await resolveMediaProjectId(mediaIdRaw);
  if (!projectIdRaw) throw new AdminMediaValidationError('Media not found', 'NOT_FOUND');

  const result = await deleteMediaAsset({
    projectId: Number(projectIdRaw),
    mediaId: Number(mediaId),
  });
  if (!result.deleted) throw new AdminMediaValidationError('Media not found', 'NOT_FOUND');
  return { deleted: true, mediaId: Number(mediaId) };
}
