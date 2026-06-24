import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { createMediaAsset } from '@/services/builder/mediaService';
import {
  EXT_FROM_MIME,
  inferMimeFromFilename,
  kindForMime,
  MEDIA_LIMITS,
  randomStorageName,
  resolveUploadMime,
  safeExtFromName,
  sanitizeSvgText,
  shouldConvertRasterToWebp,
} from '@/lib/media/mediaUtils';

function uploadRootDir() {
  return path.join(process.cwd(), 'public', 'uploads');
}

function publicBase(projectId) {
  return `/uploads/p${projectId}`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Process multipart upload into project media storage + DB row.
 * @param {{ projectId: number, form: FormData }} params
 * @returns {Promise<{ item: import('@/services/builder/mediaService').normalizeMediaRow extends Function ? ReturnType<typeof import('@/services/builder/mediaService').normalizeMediaRow> : object }>}
 */
export async function processProjectMediaUpload({ projectId, form }) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) {
    const err = new Error('Invalid projectId');
    err.status = 400;
    throw err;
  }

  const file = form.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') {
    const err = new Error('file is required');
    err.status = 400;
    throw err;
  }

  const folder = form.get('folder');
  const title = form.get('title');
  const altText = form.get('altText');

  if (typeof file.size === 'number' && file.size > MEDIA_LIMITS.maxBytes) {
    const err = new Error(`File too large (max ${MEDIA_LIMITS.maxBytes} bytes)`);
    err.status = 413;
    throw err;
  }

  let buf;
  try {
    buf = Buffer.from(await file.arrayBuffer());
  } catch (error) {
    const err = new Error('Failed to read file');
    err.status = 400;
    err.cause = error;
    throw err;
  }

  if (buf.length > MEDIA_LIMITS.maxBytes) {
    const err = new Error(`File too large (max ${MEDIA_LIMITS.maxBytes} bytes)`);
    err.status = 413;
    throw err;
  }

  const providedMime = typeof file.type === 'string' ? file.type : '';
  const detected = await fileTypeFromBuffer(buf).catch(() => null);
  const detectedMime = detected?.mime || '';
  const detectedExt = detected?.ext || '';
  const nameFromClient = typeof file.name === 'string' ? file.name : 'upload';
  const filenameExt = safeExtFromName(nameFromClient);

  let mime = resolveUploadMime({
    detectedMime,
    providedMime,
    filename: nameFromClient,
  });
  const kind = kindForMime(mime);
  if (!kind) {
    const err = new Error('Unsupported file type');
    err.status = 415;
    err.details = { mime: mime || providedMime || detectedMime };
    throw err;
  }

  const mimeFromName = inferMimeFromFilename(nameFromClient);
  const trustedFilenameMime = Boolean(mimeFromName && mimeFromName === mime);
  if (
    detectedExt &&
    filenameExt &&
    detectedExt !== filenameExt &&
    mime !== 'image/svg+xml' &&
    !trustedFilenameMime
  ) {
    const err = new Error('File extension mismatch');
    err.status = 400;
    err.details = { detectedExt, filenameExt };
    throw err;
  }

  const blockedExt = new Set(['exe', 'dll', 'bat', 'cmd', 'sh', 'ps1', 'msi', 'com', 'jar']);
  if (blockedExt.has(filenameExt)) {
    const err = new Error('Executable uploads are not allowed');
    err.status = 400;
    throw err;
  }

  if (mime === 'image/svg+xml') {
    try {
      const safeSvgText = sanitizeSvgText(buf.toString('utf8'));
      buf = Buffer.from(safeSvgText, 'utf8');
    } catch (error) {
      const err = new Error('Unsafe SVG');
      err.status = 400;
      err.cause = error;
      throw err;
    }
  }

  if (kind === 'image' && shouldConvertRasterToWebp(mime)) {
    try {
      const webpBuf = await sharp(buf, { failOn: 'none' })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      if (webpBuf?.length) {
        buf = webpBuf;
        mime = 'image/webp';
      }
    } catch {
      // keep original bytes if conversion fails
    }
  }

  const projectDir = path.join(uploadRootDir(), `p${pid}`);
  const thumbDir = path.join(projectDir, 'thumbs');
  await ensureDir(projectDir);
  await ensureDir(thumbDir);

  const ext =
    mime === 'image/svg+xml'
      ? 'svg'
      : EXT_FROM_MIME[mime] || detectedExt || filenameExt || '';
  const storageName = randomStorageName(ext);
  const absPath = path.join(projectDir, storageName);

  try {
    await fs.writeFile(absPath, buf);
  } catch (error) {
    const err = new Error('Failed to write file');
    err.status = 500;
    err.cause = error;
    throw err;
  }

  let width = null;
  let height = null;
  let thumbUrl = null;

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
        .webp({ quality: 72, effort: 4 })
        .toFile(thumbAbs);

      thumbUrl = `${publicBase(pid)}/thumbs/${thumbName}`;
    } catch {
      if (mime === 'image/webp') {
        thumbUrl = `${publicBase(pid)}/${storageName}`;
      }
    }
  }

  const publicUrl = `${publicBase(pid)}/${storageName}`;
  try {
    const created = await createMediaAsset({
      projectId: pid,
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
    return { item: created };
  } catch (error) {
    await fs.unlink(absPath).catch(() => {});
    if (thumbUrl) {
      const thumbAbs = path.join(uploadRootDir(), thumbUrl.replace(/^\/uploads\//, ''));
      await fs.unlink(thumbAbs).catch(() => {});
    }
    const err = new Error('Failed to save media metadata');
    err.status = 500;
    err.cause = error;
    throw err;
  }
}
