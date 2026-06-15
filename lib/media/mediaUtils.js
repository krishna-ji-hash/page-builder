import path from 'path';
import crypto from 'crypto';

export const MEDIA_LIMITS = {
  maxBytes: 25 * 1024 * 1024,
};

export const ALLOWED = {
  image: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  video: new Set(['video/mp4', 'video/webm']),
  svg: new Set(['image/svg+xml']),
  document: new Set(['application/pdf']),
};

/** Extension → MIME for uploads when browser omits or mislabels type */
export const MIME_FROM_EXT = Object.freeze({
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  pdf: 'application/pdf',
});

export const EXT_FROM_MIME = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
});

export function kindForMime(mime) {
  if (ALLOWED.image.has(mime)) return 'image';
  if (ALLOWED.video.has(mime)) return 'video';
  if (ALLOWED.svg.has(mime)) return 'svg';
  if (ALLOWED.document.has(mime)) return 'document';
  return null;
}

export function inferMimeFromFilename(name) {
  const ext = safeExtFromName(name);
  return ext ? MIME_FROM_EXT[ext] || '' : '';
}

/**
 * Resolve MIME from magic bytes, browser hint, then filename extension.
 */
export function resolveUploadMime({ detectedMime = '', providedMime = '', filename = '' } = {}) {
  const fromDetected = String(detectedMime || '').trim().toLowerCase();
  const fromProvided = String(providedMime || '').trim().toLowerCase();
  const fromName = inferMimeFromFilename(filename);

  const candidates = [fromDetected, fromProvided, fromName].filter(Boolean);
  for (const mime of candidates) {
    if (kindForMime(mime)) return mime;
  }
  return candidates[0] || '';
}

export function shouldConvertRasterToWebp(mime) {
  if (process.env.MEDIA_KEEP_ORIGINAL === 'true' || process.env.MEDIA_KEEP_ORIGINAL === '1') {
    return false;
  }
  return mime === 'image/jpeg' || mime === 'image/png';
}

export { formatLabelForMime } from './mediaLabels.js';

export function safeExtFromName(name) {
  const base = String(name || '').trim();
  const ext = path.extname(base).toLowerCase().replace('.', '');
  return ext && ext.length <= 8 ? ext : '';
}

export function randomStorageName(ext) {
  const id = crypto.randomUUID();
  return ext ? `${id}.${ext}` : id;
}

export function sanitizeSvgText(svgText) {
  const raw = String(svgText || '');
  const lowered = raw.toLowerCase();
  if (lowered.includes('<script') || lowered.includes('javascript:')) {
    throw new Error('Unsafe SVG');
  }
  // Remove script tags and common event handlers (best-effort; still treat as untrusted).
  let s = raw.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  s = s.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
  s = s.replace(/\shref\s*=\s*(['"])javascript:[\s\S]*?\1/gi, '');
  return s;
}

