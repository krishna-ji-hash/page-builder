export const BACKUP_EXPORT_TYPES = Object.freeze({
  PROJECT: 'project',
  PAGES: 'pages',
  CMS: 'cms',
  FORMS: 'forms',
});

export function sanitizeBackupSlug(slug) {
  return String(slug || 'project')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64) || 'project';
}

export function backupFilename(projectSlug, type, ext) {
  const safe = sanitizeBackupSlug(projectSlug);
  const stamp = new Date().toISOString().slice(0, 10);
  return `${safe}-${type}-backup-${stamp}.${ext}`;
}

export function jsonDownloadResponse(data, filename) {
  const body = JSON.stringify(data, null, 2);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export function csvDownloadResponse(csv, filename) {
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export function normalizeBackupExportType(value) {
  const type = String(value || '').trim().toLowerCase();
  if (Object.values(BACKUP_EXPORT_TYPES).includes(type)) return type;
  return null;
}
