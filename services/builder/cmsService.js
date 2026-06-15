import { getDbPool } from '@/lib/db';
import { normalizeCmsRepeatQuery } from '@/lib/cms/cmsQuery';

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function safeSlug(s) {
  const raw = typeof s === 'string' ? s.trim().toLowerCase() : '';
  // Conservative; keep URL-safe and predictable.
  return raw
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function parseJsonValue(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function listCollections(projectId) {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT id, project_id, name, slug, type, schema_json, created_at, updated_at
     FROM cms_collections
     WHERE project_id = ?
     ORDER BY created_at ASC, id ASC`,
    [projectId]
  );
  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    slug: r.slug,
    type: r.type,
    schema: parseJsonValue(r.schema_json, {}) || {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getCollectionBySlug(projectId, slug) {
  const pool = getDbPool();
  const s = safeSlug(slug);
  const [rows] = await pool.query(
    `SELECT id, project_id, name, slug, type, schema_json
     FROM cms_collections
     WHERE project_id = ? AND slug = ?
     LIMIT 1`,
    [projectId, s]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    slug: r.slug,
    type: r.type,
    schema: parseJsonValue(r.schema_json, {}) || {},
  };
}

export async function createCollection(projectId, input) {
  const pool = getDbPool();
  const name = typeof input?.name === 'string' ? input.name.trim().slice(0, 120) : 'Collection';
  const slug = safeSlug(input?.slug || name);
  const type = typeof input?.type === 'string' ? input.type.trim().slice(0, 64) : 'custom';
  const schema = isPlainObject(input?.schema) ? input.schema : { fields: [] };
  const [res] = await pool.query(
    `INSERT INTO cms_collections (project_id, name, slug, type, schema_json)
     VALUES (?, ?, ?, ?, ?)`,
    [projectId, name, slug, type, JSON.stringify(schema)]
  );
  return { id: res.insertId, projectId, name, slug, type, schema };
}

export async function updateCollectionSchema(projectId, collectionId, schema) {
  const pool = getDbPool();
  const next = isPlainObject(schema) ? schema : { fields: [] };
  await pool.query(
    `UPDATE cms_collections
     SET schema_json = ?
     WHERE id = ? AND project_id = ?`,
    [JSON.stringify(next), collectionId, projectId]
  );
  return true;
}

function normalizeItemRow(r) {
  return {
    id: r.id,
    collectionId: r.collection_id,
    status: r.status,
    slug: r.slug,
    title: r.title || '',
    data: parseJsonValue(r.data_json, {}) || {},
    seo: parseJsonValue(r.seo_json, {}) || {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    publishedAt: r.published_at,
  };
}

function sqlJsonPathForField(field) {
  if (field === 'title') return null;
  if (field === 'slug') return null;
  if (field.startsWith('data.')) {
    const id = field.slice('data.'.length);
    // JSON path: $.<id>
    return `$.${id}`;
  }
  return null;
}

function buildFilterSql(filterGroup, params) {
  const walk = (g) => {
    if (!g || typeof g !== 'object') return '';
    const comb = g.combinator === 'or' ? 'OR' : 'AND';
    const parts = [];
    for (const r of g.rules || []) {
      const field = r.field;
      const op = r.op;
      if (!field || !op) continue;
      if (field === 'title' || field === 'slug') {
        const col = field === 'title' ? 'i.title' : 'i.slug';
        if (op === 'eq') {
          parts.push(`${col} = ?`);
          params.push(String(r.value ?? ''));
        } else if (op === 'neq') {
          parts.push(`${col} <> ?`);
          params.push(String(r.value ?? ''));
        } else if (op === 'contains') {
          parts.push(`${col} LIKE ?`);
          params.push(`%${String(r.value ?? '')}%`);
        } else if (op === 'starts_with') {
          parts.push(`${col} LIKE ?`);
          params.push(`${String(r.value ?? '')}%`);
        } else if (op === 'ends_with') {
          parts.push(`${col} LIKE ?`);
          params.push(`%${String(r.value ?? '')}`);
        } else if (op === 'in' && Array.isArray(r.value)) {
          const vals = r.value.map((v) => String(v ?? '')).filter(Boolean).slice(0, 50);
          if (vals.length) {
            parts.push(`${col} IN (${vals.map(() => '?').join(',')})`);
            params.push(...vals);
          }
        }
      } else if (typeof field === 'string' && field.startsWith('data.')) {
        const jp = sqlJsonPathForField(field);
        if (!jp) continue;
        // Extract as string for contains and as number for comparisons.
        const jsonStr = `JSON_UNQUOTE(JSON_EXTRACT(i.data_json, ?))`;
        params.push(jp);
        if (op === 'eq') {
          parts.push(`${jsonStr} = ?`);
          params.push(String(r.value ?? ''));
        } else if (op === 'neq') {
          parts.push(`${jsonStr} <> ?`);
          params.push(String(r.value ?? ''));
        } else if (op === 'contains') {
          parts.push(`${jsonStr} LIKE ?`);
          params.push(`%${String(r.value ?? '')}%`);
        } else if (op === 'starts_with') {
          parts.push(`${jsonStr} LIKE ?`);
          params.push(`${String(r.value ?? '')}%`);
        } else if (op === 'ends_with') {
          parts.push(`${jsonStr} LIKE ?`);
          params.push(`%${String(r.value ?? '')}`);
        } else if (op === 'gt' || op === 'gte' || op === 'lt' || op === 'lte') {
          // numeric compare; CAST invalid to NULL
          const cmp = op === 'gt' ? '>' : op === 'gte' ? '>=' : op === 'lt' ? '<' : '<=';
          parts.push(`CAST(${jsonStr} AS DECIMAL(20,6)) ${cmp} CAST(? AS DECIMAL(20,6))`);
          params.push(String(r.value ?? '0'));
        } else if (op === 'between' && Array.isArray(r.value) && r.value.length >= 2) {
          parts.push(`CAST(${jsonStr} AS DECIMAL(20,6)) BETWEEN CAST(? AS DECIMAL(20,6)) AND CAST(? AS DECIMAL(20,6))`);
          params.push(String(r.value[0] ?? '0'), String(r.value[1] ?? '0'));
        } else if (op === 'in' && Array.isArray(r.value)) {
          const vals = r.value.map((v) => String(v ?? '')).filter(Boolean).slice(0, 50);
          if (vals.length) {
            parts.push(`${jsonStr} IN (${vals.map(() => '?').join(',')})`);
            params.push(...vals);
          }
        } else if (op === 'has_any' && Array.isArray(r.value)) {
          // Array field contains any of values: JSON_OVERLAPS(JSON_EXTRACT(..), JSON_ARRAY(...))
          const vals = r.value.map((v) => String(v ?? '')).filter(Boolean).slice(0, 20);
          if (vals.length) {
            const jsonArr = `JSON_ARRAY(${vals.map(() => '?').join(',')})`;
            parts.push(`JSON_OVERLAPS(JSON_EXTRACT(i.data_json, ?), ${jsonArr})`);
            // note: JSON path already pushed above for jsonStr; need another for array path
            params.push(jp, ...vals);
          }
        }
      }
    }
    for (const child of g.groups || []) {
      const sub = walk(child);
      if (sub) parts.push(sub);
    }
    if (!parts.length) return '';
    return parts.length === 1 ? parts[0] : `(${parts.join(` ${comb} `)})`;
  };
  return walk(filterGroup);
}

export async function listItemsByCollectionId(projectId, collectionId, query = {}) {
  const pool = getDbPool();
  const q = normalizeCmsRepeatQuery(query);
  const status = q.status === 'draft' ? 'draft' : q.status === 'all' ? 'all' : 'published';
  const limit = Number.isFinite(Number(q.limit)) ? Math.max(0, Math.min(200, Number(q.limit))) : 50;
  const offset = Number.isFinite(Number(q.offset)) ? Math.max(0, Math.min(100000, Number(q.offset))) : 0;
  const sortBy = typeof q.sortBy === 'string' && q.sortBy ? q.sortBy : 'published_at';
  const sortDir = q.sortDir === 'asc' ? 'ASC' : 'DESC';

  // Whitelist sort columns to avoid SQL injection.
  const sortCol =
    sortBy === 'created_at' ? 'created_at' : sortBy === 'updated_at' ? 'updated_at' : sortBy === 'title' ? 'title' : 'published_at';

  const where = ['c.project_id = ?', 'i.collection_id = ?'];
  const params = [projectId, collectionId];
  if (status !== 'all') {
    where.push('i.status = ?');
    params.push(status);
  }

  // Presets + quick filters
  if (q.featuredOnly) {
    where.push(`JSON_EXTRACT(i.data_json, '$.featured') = true`);
  }
  if (q.byCategory) {
    where.push(`JSON_UNQUOTE(JSON_EXTRACT(i.data_json, '$.category')) = ?`);
    params.push(q.byCategory);
  }
  if (q.byTag) {
    // tags is expected to be JSON array of strings
    where.push(`JSON_CONTAINS(JSON_EXTRACT(i.data_json, '$.tags'), JSON_QUOTE(?))`);
    params.push(q.byTag);
  }
  const filterParams = [];
  const filterSql = q.filterGroup ? buildFilterSql(q.filterGroup, filterParams) : '';
  if (filterSql) {
    where.push(filterSql);
    params.push(...filterParams);
  }

  const [rows] = await pool.query(
    `
    SELECT i.*
    FROM cms_items i
    JOIN cms_collections c ON c.id = i.collection_id
    WHERE ${where.join(' AND ')}
    ORDER BY i.${sortCol} ${sortDir}, i.id ${sortDir}
    ${limit > 0 ? 'LIMIT ? OFFSET ?' : ''}
    `,
    limit > 0 ? [...params, limit, offset] : params
  );
  return rows.map(normalizeItemRow);
}

export async function listItemsByCollectionSlug(projectId, collectionSlug, query = {}) {
  const col = await getCollectionBySlug(projectId, collectionSlug);
  if (!col) return [];
  return listItemsByCollectionId(projectId, col.id, query);
}

export async function getItemBySlug(projectId, collectionSlug, itemSlug, { status } = {}) {
  const pool = getDbPool();
  const col = await getCollectionBySlug(projectId, collectionSlug);
  if (!col) return null;
  const slug = safeSlug(itemSlug).slice(0, 180);
  const st = status === 'draft' ? 'draft' : 'published';
  const [rows] = await pool.query(
    `
    SELECT i.*
    FROM cms_items i
    WHERE i.collection_id = ? AND i.slug = ? AND i.status = ?
    LIMIT 1
    `,
    [col.id, slug, st]
  );
  return rows.length ? normalizeItemRow(rows[0]) : null;
}

export async function createItem(projectId, collectionSlug, input) {
  const pool = getDbPool();
  const col = await getCollectionBySlug(projectId, collectionSlug);
  if (!col) throw new Error('Collection not found');
  const status = input?.status === 'published' ? 'published' : 'draft';
  const slug = safeSlug(input?.slug || input?.title || 'item').slice(0, 180);
  const title = typeof input?.title === 'string' ? input.title.trim().slice(0, 220) : '';
  const data = isPlainObject(input?.data) ? input.data : {};
  const seo = isPlainObject(input?.seo) ? input.seo : {};
  const publishedAt = status === 'published' ? new Date() : null;
  const [res] = await pool.query(
    `INSERT INTO cms_items (collection_id, status, slug, title, data_json, seo_json, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [col.id, status, slug, title, JSON.stringify(data), JSON.stringify(seo), publishedAt]
  );
  return { id: res.insertId, collectionId: col.id, status, slug, title, data, seo, publishedAt };
}

export async function updateItem(projectId, collectionSlug, itemId, input) {
  const pool = getDbPool();
  const col = await getCollectionBySlug(projectId, collectionSlug);
  if (!col) throw new Error('Collection not found');
  const id = Number(itemId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid item id');

  const status = input?.status === 'published' ? 'published' : input?.status === 'draft' ? 'draft' : null;
  const slug = input?.slug != null ? safeSlug(input.slug).slice(0, 180) : null;
  const title = input?.title != null ? String(input.title).trim().slice(0, 220) : null;
  const data = input?.data != null ? (isPlainObject(input.data) ? input.data : {}) : null;
  const seo = input?.seo != null ? (isPlainObject(input.seo) ? input.seo : {}) : null;
  const publishedAt = status === 'published' ? new Date() : status === 'draft' ? null : undefined;

  const sets = [];
  const params = [];
  if (status) {
    sets.push('status = ?');
    params.push(status);
    if (publishedAt !== undefined) {
      sets.push('published_at = ?');
      params.push(publishedAt);
    }
  }
  if (slug != null) {
    sets.push('slug = ?');
    params.push(slug);
  }
  if (title != null) {
    sets.push('title = ?');
    params.push(title);
  }
  if (data != null) {
    sets.push('data_json = ?');
    params.push(JSON.stringify(data));
  }
  if (seo != null) {
    sets.push('seo_json = ?');
    params.push(JSON.stringify(seo));
  }
  if (!sets.length) return true;

  await pool.query(
    `UPDATE cms_items
     SET ${sets.join(', ')}
     WHERE id = ? AND collection_id = ?`,
    [...params, id, col.id]
  );
  return true;
}

export async function deleteItem(projectId, collectionSlug, itemId) {
  const pool = getDbPool();
  const col = await getCollectionBySlug(projectId, collectionSlug);
  if (!col) throw new Error('Collection not found');
  const id = Number(itemId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid item id');
  await pool.query(`DELETE FROM cms_items WHERE id = ? AND collection_id = ?`, [id, col.id]);
  return true;
}

