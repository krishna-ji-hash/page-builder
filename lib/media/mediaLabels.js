/** Client-safe media label helpers (no Node imports). */

export function formatLabelForMime(mime) {
  const m = String(mime || '').toLowerCase();
  if (m === 'image/webp') return 'WebP';
  if (m === 'image/jpeg') return 'JPEG';
  if (m === 'image/png') return 'PNG';
  if (m === 'image/gif') return 'GIF';
  if (m === 'image/svg+xml') return 'SVG';
  if (m === 'video/mp4') return 'MP4';
  if (m === 'video/webm') return 'WebM';
  if (m === 'application/pdf') return 'PDF';
  return 'File';
}
