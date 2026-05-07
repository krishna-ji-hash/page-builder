import { getDbPool } from '@/lib/db';

function safeJsonObject(obj, { maxKeys = 80, maxString = 2000 } = {}) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const out = {};
  const keys = Object.keys(obj).slice(0, maxKeys);
  for (const k of keys) {
    const key = String(k).slice(0, 64);
    const v = obj[k];
    if (v === null) {
      out[key] = null;
      continue;
    }
    if (typeof v === 'string') {
      out[key] = v.slice(0, maxString);
      continue;
    }
    if (typeof v === 'number') {
      out[key] = Number.isFinite(v) ? v : null;
      continue;
    }
    if (typeof v === 'boolean') {
      out[key] = v;
      continue;
    }
    // reject nested objects/arrays to keep payload predictable
    out[key] = String(v).slice(0, maxString);
  }
  return out;
}

export function sanitizeSubmissionValues(values) {
  return safeJsonObject(values, { maxKeys: 120, maxString: 4000 }) || {};
}

export function sanitizeSubmissionMeta(meta) {
  return safeJsonObject(meta, { maxKeys: 40, maxString: 1000 }) || {};
}

export async function createFormSubmission({ projectId, pageId, formNodeId, values, meta }) {
  const pid = Number(projectId);
  const pgid = Number(pageId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  if (!Number.isInteger(pgid) || pgid <= 0) throw new Error('Invalid pageId');
  const formId = typeof formNodeId === 'string' && formNodeId.trim() ? formNodeId.trim().slice(0, 96) : null;
  if (!formId) throw new Error('Invalid formId');

  const submissionJson = sanitizeSubmissionValues(values);
  const metaJson = sanitizeSubmissionMeta(meta);

  const pool = getDbPool();
  const [r] = await pool.query(
    `INSERT INTO form_submissions (project_id, page_id, form_node_id, submission_json, meta_json)
     VALUES (?, ?, ?, ?, ?)`,
    [pid, pgid, formId, JSON.stringify(submissionJson), JSON.stringify(metaJson)]
  );

  return { id: r.insertId, projectId: pid, pageId: pgid, formNodeId: formId };
}

