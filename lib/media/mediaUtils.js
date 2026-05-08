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

export function kindForMime(mime) {
  if (ALLOWED.image.has(mime)) return 'image';
  if (ALLOWED.video.has(mime)) return 'video';
  if (ALLOWED.svg.has(mime)) return 'svg';
  if (ALLOWED.document.has(mime)) return 'document';
  return null;
}

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

