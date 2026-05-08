import { fail, ok } from '@/lib/api';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { createMediaAsset, listMediaAssets } from '@/services/builder/mediaService';
import { ALLOWED, kindForMime, MEDIA_LIMITS, randomStorageName, safeExtFromName, sanitizeSvgText } from '@/lib/media/mediaUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function uploadRootDir() {
  return path.join(process.cwd(), 'public', 'uploads');
}

function publicBase(projectId) {
  return `/uploads/p${projectId}`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const kind = searchParams.get('kind') || '';
  const folder = searchParams.get('folder');
  const sort = searchParams.get('sort') || 'created_desc';
  const page = clampInt(searchParams.get('page'), 1, 100000, 1);
  const pageSize = clampInt(searchParams.get('pageSize'), 1, 120, 48);
  const recentOnly = searchParams.get('recent') === '1';

  try {
    const data = await listMediaAssets({ projectId, q, kind, folder, sort, page, pageSize, recentOnly });
    return ok(data);
  } catch (error) {
    return fail('Failed to list media', 500, error?.message);
  }
}

export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);

  let form;
  try {
    form = await request.formData();
  } catch (error) {
    return fail('Invalid form data', 400, error?.message);
  }

  const file = form.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') return fail('file is required', 400);

  const folder = form.get('folder');
  const title = form.get('title');
  const altText = form.get('altText');

  if (typeof file.size === 'number' && file.size > MEDIA_LIMITS.maxBytes) {
    return fail(`File too large (max ${MEDIA_LIMITS.maxBytes} bytes)`, 413);
  }

  let buf;
  try {
    buf = Buffer.from(await file.arrayBuffer());
  } catch (error) {
    return fail('Failed to read file', 400, error?.message);
  }

  if (buf.length > MEDIA_LIMITS.maxBytes) {
    return fail(`File too large (max ${MEDIA_LIMITS.maxBytes} bytes)`, 413);
  }

  const providedMime = typeof file.type === 'string' ? file.type : '';
  const detected = await fileTypeFromBuffer(buf).catch(() => null);
  const detectedMime = detected?.mime || '';
  const detectedExt = detected?.ext || '';

  const mime = detectedMime || providedMime;
  const kind = kindForMime(mime);
  if (!kind) return fail('Unsupported file type', 415, { mime });

  // Extension mismatch (best-effort): if we could detect and it differs from the filename extension.
  const nameFromClient = typeof file.name === 'string' ? file.name : 'upload';
  const filenameExt = safeExtFromName(nameFromClient);
  if (detectedExt && filenameExt && detectedExt !== filenameExt && mime !== 'image/svg+xml') {
    return fail('File extension mismatch', 400, { detectedExt, filenameExt });
  }

  // Additional safety: block executables by mime and by extension.
  const blockedExt = new Set(['exe', 'dll', 'bat', 'cmd', 'sh', 'ps1', 'msi', 'com', 'jar']);
  if (blockedExt.has(filenameExt)) return fail('Executable uploads are not allowed', 400);

  // SVG sanitization (treat as text).
  let safeSvgText = null;
  if (mime === 'image/svg+xml') {
    try {
      safeSvgText = sanitizeSvgText(buf.toString('utf8'));
      buf = Buffer.from(safeSvgText, 'utf8');
    } catch (error) {
      return fail('Unsafe SVG', 400, error?.message);
    }
  }

  const projectDir = path.join(uploadRootDir(), `p${projectId}`);
  const thumbDir = path.join(projectDir, 'thumbs');
  await ensureDir(projectDir);
  await ensureDir(thumbDir);

  const ext = mime === 'image/svg+xml' ? 'svg' : detectedExt || filenameExt || '';
  const storageName = randomStorageName(ext);
  const absPath = path.join(projectDir, storageName);

  try {
    await fs.writeFile(absPath, buf);
  } catch (error) {
    return fail('Failed to write file', 500, error?.message);
  }

  let width = null;
  let height = null;
  let thumbUrl = null;

  // Thumbnails for images + svg only.
  if (kind === 'image' || kind === 'svg') {
    try {
      const image = sharp(buf, { failOn: 'none' });
      const meta = await image.metadata();
      width = meta?.width || null;
      height = meta?.height || null;

      const thumbName = storageName.replace(/\.[^.]+$/, '') + '.webp';
      const thumbAbs = path.join(thumbDir, thumbName);
      await sharp(buf, { failOn: 'none' })
        .resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 72 })
        .toFile(thumbAbs);

      thumbUrl = `${publicBase(projectId)}/thumbs/${thumbName}`;
    } catch {
      // thumb is best-effort; proceed without
      thumbUrl = null;
    }
  }

  const publicUrl = `${publicBase(projectId)}/${storageName}`;
  try {
    const created = await createMediaAsset({
      projectId,
      folder: typeof folder === 'string' ? folder : null,
      kind,
      mimeType: mime,
      originalName: nameFromClient,
      storageName,
      storagePath: absPath,
      publicUrl,
      thumbUrl,
      width,
      height,
      bytes: buf.length,
      title: typeof title === 'string' ? title : null,
      altText: typeof altText === 'string' ? altText : null,
    });
    return ok({ item: created }, 201);
  } catch (error) {
    // If DB insert fails, try to delete file to avoid orphaned storage.
    await fs.unlink(absPath).catch(() => {});
    if (thumbUrl) {
      const thumbAbs = path.join(uploadRootDir(), thumbUrl);
      await fs.unlink(thumbAbs).catch(() => {});
    }
    return fail('Failed to save media metadata', 500, error?.message);
  }
}

