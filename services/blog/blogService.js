/**
 * First-class Blog CMS — mysql2 service (project-scoped).
 * Posts are not pages; public detail uses shared blog-post template + slug lookup.
 */
import { getDbPool, withTransaction } from '@/lib/db';
import {
  normalizeBlogContentBlocks,
  serializeBlogContentToBody,
} from '@/lib/blogPostContent';
import {
  normalizeBlogSchemaType,
  parseBlogSchemaJsonLd,
} from '@/lib/blogSchemaMarkup';

export { blogPostToDetailPost, blogPostToWidgetPost } from '@/lib/blogCmsMappers';
export const BLOG_STATUSES = Object.freeze(['draft', 'published', 'scheduled', 'archived']);

function parseStoredSchemaJsonLd(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'object') return value;
  const parsed = parseBlogSchemaJsonLd(value);
  return parsed.ok ? parsed.value : null;
}

function resolveSchemaWriteFields(input, existing) {
  const schemaType = normalizeBlogSchemaType(input?.schemaType ?? existing?.schemaType ?? 'article');
  if (schemaType !== 'custom') {
    return { schemaType, schemaJsonLd: null };
  }
  const raw = input?.schemaJsonLd !== undefined ? input.schemaJsonLd : existing?.schemaJsonLd;
  const parsed = parseBlogSchemaJsonLd(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  return { schemaType, schemaJsonLd: parsed.value };
}

function safeSlug(s, max = 160) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, max);
}

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toMysqlDateTime(value) {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function blocksToHtml(blocks) {
  const normalized = normalizeBlogContentBlocks(blocks);
  if (!normalized.length) return '';
  return normalized
    .map((block) => {
      const h = escapeHtml(block.heading);
      const body = escapeHtml(block.text).replace(/\n/g, '<br/>');
      return `<section class="blog-article-block"><h2>${h}</h2><p>${body}</p></section>`;
    })
    .join('\n');
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeFaqs(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item && typeof item === 'object' ? item : {};
      return {
        question: String(row.question || row.q || '').trim(),
        answer: String(row.answer || row.a || '').trim(),
      };
    })
    .filter((f) => f.question || f.answer);
}

function normalizeTakeaways(value) {
  if (!Array.isArray(value)) return [];
  return value.map((t) => String(t || '').trim()).filter(Boolean);
}

function normalizeRobots(value) {
  const raw = String(value || 'index,follow')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  if (raw === 'noindex' || raw.includes('noindex')) return 'noindex,nofollow';
  return 'index,follow';
}

function normalizeVisibility(value) {
  const raw = String(value || 'public').trim().toLowerCase();
  return ['public', 'private', 'unlisted'].includes(raw) ? raw : 'public';
}

function normalizeLinkList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => ({
      label: String(row?.label || '').trim().slice(0, 160),
      url: String(row?.url || '').trim().slice(0, 500),
    }))
    .filter((row) => row.label || row.url)
    .slice(0, 40);
}

function normalizeTocItems(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => (typeof row === 'string' ? row : row?.label || row?.heading || ''))
    .map((s) => String(s || '').trim().slice(0, 240))
    .filter(Boolean)
    .slice(0, 40);
}

function asBool(value, fallback = false) {
  if (value == null) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const raw = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  return fallback;
}

function normalizeStatus(value) {
  const raw = String(value || 'draft').trim().toLowerCase();
  return BLOG_STATUSES.includes(raw) ? raw : 'draft';
}

async function loadTagsForPosts(pool, postIds) {
  if (!postIds.length) return new Map();
  const [rows] = await pool.query(
    `SELECT pt.post_id, t.id, t.name, t.slug
     FROM blog_post_tags pt
     INNER JOIN blog_tags t ON t.id = pt.tag_id
     WHERE pt.post_id IN (?)
     ORDER BY t.name ASC`,
    [postIds]
  );
  const map = new Map();
  for (const row of rows) {
    const list = map.get(row.post_id) || [];
    list.push({ id: row.id, name: row.name, slug: row.slug });
    map.set(row.post_id, list);
  }
  return map;
}

function mapPostRow(row, tags = []) {
  const contentJson = parseJson(row.content_json, []);
  const faqs = normalizeFaqs(parseJson(row.faqs_json, []));
  const keyTakeaways = normalizeTakeaways(parseJson(row.key_takeaways_json, []));
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title || '',
    slug: row.slug || '',
    excerpt: row.excerpt || '',
    featuredImage: row.featured_image || '',
    featuredImageAlt: row.featured_image_alt || '',
    featuredImageCaption: row.featured_image_caption || '',
    categoryId: row.category_id ?? null,
    authorId: row.author_id ?? null,
    category: row.category_name
      ? { id: row.category_id, name: row.category_name, slug: row.category_slug }
      : null,
    author: row.author_name
      ? {
          id: row.author_id,
          name: row.author_name,
          designation: row.author_designation || '',
          bio: row.author_bio || '',
          avatar: row.author_avatar || '',
        }
      : null,
    tags,
    contentJson: normalizeBlogContentBlocks(contentJson),
    contentHtml: row.content_html || '',
    faqs,
    keyTakeaways,
    tocItems: normalizeTocItems(parseJson(row.toc_items_json, [])),
    internalLinks: normalizeLinkList(parseJson(row.internal_links_json, [])),
    externalLinks: normalizeLinkList(parseJson(row.external_links_json, [])),
    status: row.status || 'draft',
    publishedAt: row.published_at || null,
    scheduledAt: row.scheduled_at || null,
    readTime: row.read_time || '',
    seoTitle: row.seo_title || '',
    seoDescription: row.seo_description || '',
    focusKeywords: row.focus_keywords || '',
    metaKeywords: row.meta_keywords || '',
    canonicalUrl: row.canonical_url || '',
    ogImage: row.og_image || '',
    ogTitle: row.og_title || '',
    ogDescription: row.og_description || '',
    socialImage: row.social_image || '',
    robots: normalizeRobots(row.robots),
    visibility: normalizeVisibility(row.visibility),
    schemaType: normalizeBlogSchemaType(row.schema_type),
    schemaJsonLd: parseStoredSchemaJsonLd(row.schema_json_ld),
    enableArticleSchema: asBool(row.enable_article_schema, true),
    enableFaqSchema: asBool(row.enable_faq_schema, false),
    previewChecked: asBool(row.preview_checked, false),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    deletedAt: row.deleted_at || null,
  };
}

const POST_SELECT = `
  SELECT p.*,
    c.name AS category_name, c.slug AS category_slug,
    a.name AS author_name, a.designation AS author_designation,
    a.bio AS author_bio, a.avatar AS author_avatar
  FROM blog_posts p
  LEFT JOIN blog_categories c ON c.id = p.category_id AND c.project_id = p.project_id
  LEFT JOIN blog_authors a ON a.id = p.author_id AND a.project_id = p.project_id
`;

/** ---------- Categories ---------- */

export async function listBlogCategories(projectId) {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT id, project_id, name, slug, description, created_at, updated_at
     FROM blog_categories WHERE project_id = ? ORDER BY name ASC`,
    [projectId]
  );
  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    slug: r.slug,
    description: r.description || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createBlogCategory(projectId, input) {
  const pool = getDbPool();
  const name = String(input?.name || '').trim().slice(0, 160);
  if (!name) throw new Error('Category name is required');
  const slug = safeSlug(input?.slug || name, 180);
  if (!slug) throw new Error('Category slug is required');
  const description = String(input?.description || '').trim();
  try {
    const [res] = await pool.query(
      `INSERT INTO blog_categories (project_id, name, slug, description) VALUES (?, ?, ?, ?)`,
      [projectId, name, slug, description || null]
    );
    return (await listBlogCategories(projectId)).find((c) => c.id === res.insertId);
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY') throw new Error('Category slug already exists in this project');
    throw e;
  }
}

export async function updateBlogCategory(projectId, categoryId, input) {
  const pool = getDbPool();
  const name = String(input?.name || '').trim().slice(0, 160);
  if (!name) throw new Error('Category name is required');
  const slug = safeSlug(input?.slug || name, 180);
  const description = String(input?.description || '').trim();
  try {
    const [res] = await pool.query(
      `UPDATE blog_categories SET name = ?, slug = ?, description = ?
       WHERE id = ? AND project_id = ?`,
      [name, slug, description || null, categoryId, projectId]
    );
    if (!res.affectedRows) throw new Error('Category not found');
    return (await listBlogCategories(projectId)).find((c) => c.id === Number(categoryId));
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY') throw new Error('Category slug already exists in this project');
    throw e;
  }
}

export async function deleteBlogCategory(projectId, categoryId) {
  const pool = getDbPool();
  await pool.query(`UPDATE blog_posts SET category_id = NULL WHERE project_id = ? AND category_id = ?`, [
    projectId,
    categoryId,
  ]);
  const [res] = await pool.query(`DELETE FROM blog_categories WHERE id = ? AND project_id = ?`, [
    categoryId,
    projectId,
  ]);
  return res.affectedRows > 0;
}

/** ---------- Tags ---------- */

export async function listBlogTags(projectId) {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT id, project_id, name, slug, created_at, updated_at
     FROM blog_tags WHERE project_id = ? ORDER BY name ASC`,
    [projectId]
  );
  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    slug: r.slug,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createBlogTag(projectId, input) {
  const pool = getDbPool();
  const name = String(input?.name || '').trim().slice(0, 120);
  if (!name) throw new Error('Tag name is required');
  const slug = safeSlug(input?.slug || name, 160);
  try {
    const [res] = await pool.query(
      `INSERT INTO blog_tags (project_id, name, slug) VALUES (?, ?, ?)`,
      [projectId, name, slug]
    );
    return (await listBlogTags(projectId)).find((t) => t.id === res.insertId);
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY') throw new Error('Tag slug already exists in this project');
    throw e;
  }
}

export async function updateBlogTag(projectId, tagId, input) {
  const pool = getDbPool();
  const name = String(input?.name || '').trim().slice(0, 120);
  if (!name) throw new Error('Tag name is required');
  const slug = safeSlug(input?.slug || name, 160);
  try {
    const [res] = await pool.query(
      `UPDATE blog_tags SET name = ?, slug = ? WHERE id = ? AND project_id = ?`,
      [name, slug, tagId, projectId]
    );
    if (!res.affectedRows) throw new Error('Tag not found');
    return (await listBlogTags(projectId)).find((t) => t.id === Number(tagId));
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY') throw new Error('Tag slug already exists in this project');
    throw e;
  }
}

export async function deleteBlogTag(projectId, tagId) {
  const pool = getDbPool();
  await pool.query(
    `DELETE pt FROM blog_post_tags pt
     INNER JOIN blog_tags t ON t.id = pt.tag_id
     WHERE pt.tag_id = ? AND t.project_id = ?`,
    [tagId, projectId]
  );
  const [res] = await pool.query(`DELETE FROM blog_tags WHERE id = ? AND project_id = ?`, [
    tagId,
    projectId,
  ]);
  return res.affectedRows > 0;
}

/** ---------- Authors ---------- */

export async function listBlogAuthors(projectId) {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT id, project_id, name, designation, bio, avatar, created_at, updated_at
     FROM blog_authors WHERE project_id = ? ORDER BY name ASC`,
    [projectId]
  );
  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    designation: r.designation || '',
    bio: r.bio || '',
    avatar: r.avatar || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createBlogAuthor(projectId, input) {
  const pool = getDbPool();
  const name = String(input?.name || '').trim().slice(0, 160);
  if (!name) throw new Error('Author name is required');
  const designation = String(input?.designation || '').trim().slice(0, 160);
  const bio = String(input?.bio || '').trim();
  const avatar = String(input?.avatar || '').trim().slice(0, 500);
  const [res] = await pool.query(
    `INSERT INTO blog_authors (project_id, name, designation, bio, avatar) VALUES (?, ?, ?, ?, ?)`,
    [projectId, name, designation || null, bio || null, avatar || null]
  );
  return (await listBlogAuthors(projectId)).find((a) => a.id === res.insertId);
}

export async function updateBlogAuthor(projectId, authorId, input) {
  const pool = getDbPool();
  const name = String(input?.name || '').trim().slice(0, 160);
  if (!name) throw new Error('Author name is required');
  const designation = String(input?.designation || '').trim().slice(0, 160);
  const bio = String(input?.bio || '').trim();
  const avatar = String(input?.avatar || '').trim().slice(0, 500);
  const [res] = await pool.query(
    `UPDATE blog_authors SET name = ?, designation = ?, bio = ?, avatar = ?
     WHERE id = ? AND project_id = ?`,
    [name, designation || null, bio || null, avatar || null, authorId, projectId]
  );
  if (!res.affectedRows) throw new Error('Author not found');
  return (await listBlogAuthors(projectId)).find((a) => a.id === Number(authorId));
}

export async function deleteBlogAuthor(projectId, authorId) {
  const pool = getDbPool();
  await pool.query(`UPDATE blog_posts SET author_id = NULL WHERE project_id = ? AND author_id = ?`, [
    projectId,
    authorId,
  ]);
  const [res] = await pool.query(`DELETE FROM blog_authors WHERE id = ? AND project_id = ?`, [
    authorId,
    projectId,
  ]);
  return res.affectedRows > 0;
}

/** ---------- Settings ---------- */

const DEFAULT_BLOG_SETTINGS = {
  postsPerPage: 12,
  showRelated: true,
  defaultAuthorId: null,
  listingSlug: 'blog',
  articleTemplateSlug: 'blog-post',
};

export async function getBlogSettings(projectId) {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT settings_json FROM blog_settings WHERE project_id = ? LIMIT 1`,
    [projectId]
  );
  const stored = parseJson(rows[0]?.settings_json, {});
  return { ...DEFAULT_BLOG_SETTINGS, ...(stored && typeof stored === 'object' ? stored : {}) };
}

export async function updateBlogSettings(projectId, input) {
  const pool = getDbPool();
  const current = await getBlogSettings(projectId);
  const next = {
    ...current,
    postsPerPage: Math.min(50, Math.max(1, Number(input?.postsPerPage ?? current.postsPerPage) || 12)),
    showRelated: input?.showRelated != null ? Boolean(input.showRelated) : current.showRelated,
    defaultAuthorId:
      input?.defaultAuthorId != null && input.defaultAuthorId !== ''
        ? Number(input.defaultAuthorId)
        : null,
    listingSlug: safeSlug(input?.listingSlug || current.listingSlug || 'blog', 80) || 'blog',
    articleTemplateSlug:
      safeSlug(input?.articleTemplateSlug || current.articleTemplateSlug || 'blog-post', 80) ||
      'blog-post',
  };
  await pool.query(
    `INSERT INTO blog_settings (project_id, settings_json)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json), updated_at = CURRENT_TIMESTAMP`,
    [projectId, JSON.stringify(next)]
  );
  return next;
}

/** ---------- Posts ---------- */

export async function getBlogPostStats(projectId) {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
       SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft,
       SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled,
       SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived
     FROM blog_posts
     WHERE project_id = ? AND deleted_at IS NULL`,
    [projectId]
  );
  const r = rows[0] || {};
  return {
    total: Number(r.total || 0),
    published: Number(r.published || 0),
    draft: Number(r.draft || 0),
    scheduled: Number(r.scheduled || 0),
    archived: Number(r.archived || 0),
  };
}

/**
 * @param {number} projectId
 * @param {{
 *   status?: string,
 *   categoryId?: number,
 *   authorId?: number,
 *   q?: string,
 *   includeDeleted?: boolean,
 *   limit?: number,
 *   offset?: number,
 * }} [opts]
 */
export async function listBlogPosts(projectId, opts = {}) {
  const pool = getDbPool();
  const where = ['p.project_id = ?'];
  const params = [projectId];

  if (!opts.includeDeleted) where.push('p.deleted_at IS NULL');

  if (opts.status && opts.status !== 'all') {
    where.push('p.status = ?');
    params.push(normalizeStatus(opts.status));
  }
  if (opts.categoryId) {
    where.push('p.category_id = ?');
    params.push(Number(opts.categoryId));
  }
  if (opts.authorId) {
    where.push('p.author_id = ?');
    params.push(Number(opts.authorId));
  }
  const q = String(opts.q || '').trim();
  if (q) {
    where.push('(p.title LIKE ? OR p.slug LIKE ? OR p.excerpt LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const limit = Math.min(200, Math.max(1, Number(opts.limit) || 50));
  const offset = Math.max(0, Number(opts.offset) || 0);

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM blog_posts p WHERE ${where.join(' AND ')}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);

  const [rows] = await pool.query(
    `${POST_SELECT}
     WHERE ${where.join(' AND ')}
     ORDER BY COALESCE(p.published_at, p.updated_at) DESC, p.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const tagMap = await loadTagsForPosts(
    pool,
    rows.map((r) => r.id)
  );
  return {
    posts: rows.map((r) => mapPostRow(r, tagMap.get(r.id) || [])),
    total,
    limit,
    offset,
  };
}

export async function getBlogPostById(projectId, postId, { includeDeleted = false } = {}) {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `${POST_SELECT}
     WHERE p.id = ? AND p.project_id = ?
     ${includeDeleted ? '' : 'AND p.deleted_at IS NULL'}
     LIMIT 1`,
    [postId, projectId]
  );
  if (!rows.length) return null;
  const tagMap = await loadTagsForPosts(pool, [rows[0].id]);
  return mapPostRow(rows[0], tagMap.get(rows[0].id) || []);
}

export async function getBlogPostBySlug(projectId, slug, { status = null, includeDeleted = false } = {}) {
  const pool = getDbPool();
  const s = safeSlug(slug, 180);
  if (!s) return null;
  const where = ['p.project_id = ?', 'p.slug = ?'];
  const params = [projectId, s];
  if (!includeDeleted) where.push('p.deleted_at IS NULL');
  if (status) {
    where.push('p.status = ?');
    params.push(normalizeStatus(status));
  }
  const [rows] = await pool.query(
    `${POST_SELECT} WHERE ${where.join(' AND ')} LIMIT 1`,
    params
  );
  if (!rows.length) return null;
  const tagMap = await loadTagsForPosts(pool, [rows[0].id]);
  return mapPostRow(rows[0], tagMap.get(rows[0].id) || []);
}

async function resolveTagIds(connection, projectId, tagIds = [], tagNames = []) {
  const ids = new Set(
    (Array.isArray(tagIds) ? tagIds : [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  );

  for (const raw of Array.isArray(tagNames) ? tagNames : []) {
    const name = String(raw || '').trim();
    if (!name) continue;
    const slug = safeSlug(name, 160);
    const [existing] = await connection.query(
      `SELECT id FROM blog_tags WHERE project_id = ? AND slug = ? LIMIT 1`,
      [projectId, slug]
    );
    if (existing.length) {
      ids.add(existing[0].id);
      continue;
    }
    const [ins] = await connection.query(
      `INSERT INTO blog_tags (project_id, name, slug) VALUES (?, ?, ?)`,
      [projectId, name.slice(0, 120), slug]
    );
    ids.add(ins.insertId);
  }

  return [...ids];
}

async function syncPostTags(connection, postId, tagIds) {
  await connection.query(`DELETE FROM blog_post_tags WHERE post_id = ?`, [postId]);
  for (const tagId of tagIds) {
    await connection.query(`INSERT INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)`, [
      postId,
      tagId,
    ]);
  }
}

function buildPostWritePayload(input, { existing = null } = {}) {
  const title = String(input?.title ?? existing?.title ?? '').trim().slice(0, 240);
  if (!title) throw new Error('Title is required');

  const slug = safeSlug(input?.slug ?? existing?.slug ?? title, 180);
  if (!slug) throw new Error('Slug is required');

  const contentJson = normalizeBlogContentBlocks(
    input?.contentJson ?? input?.contentBlocks ?? existing?.contentJson ?? []
  );
  const contentHtml =
    String(input?.contentHtml ?? '').trim() ||
    existing?.contentHtml ||
    blocksToHtml(contentJson) ||
    serializeBlogContentToBody(contentJson);

  const status = normalizeStatus(input?.status ?? existing?.status ?? 'draft');
  let publishedAt = toMysqlDateTime(input?.publishedAt ?? existing?.publishedAt);
  let scheduledAt = toMysqlDateTime(input?.scheduledAt ?? existing?.scheduledAt);

  if (status === 'published' && !publishedAt) {
    publishedAt = toMysqlDateTime(new Date());
  }
  if (status !== 'scheduled') {
    scheduledAt = status === 'scheduled' ? scheduledAt : null;
  }
  if (status === 'scheduled' && !scheduledAt) {
    scheduledAt = toMysqlDateTime(input?.publishedAt) || toMysqlDateTime(new Date(Date.now() + 86400000));
  }

  const titleClamped = String(title).slice(0, 180);
  return {
    title: titleClamped,
    slug,
    excerpt: String(input?.excerpt ?? existing?.excerpt ?? '').trim(),
    featuredImage: String(input?.featuredImage ?? existing?.featuredImage ?? '').trim().slice(0, 500),
    featuredImageAlt: String(input?.featuredImageAlt ?? existing?.featuredImageAlt ?? '')
      .trim()
      .slice(0, 240),
    featuredImageCaption: String(input?.featuredImageCaption ?? existing?.featuredImageCaption ?? '')
      .trim()
      .slice(0, 500),
    categoryId:
      input?.categoryId != null && input.categoryId !== ''
        ? Number(input.categoryId)
        : existing?.categoryId ?? null,
    authorId:
      input?.authorId != null && input.authorId !== ''
        ? Number(input.authorId)
        : existing?.authorId ?? null,
    contentJson,
    contentHtml,
    faqs: normalizeFaqs(input?.faqs ?? existing?.faqs ?? []).slice(0, 10),
    keyTakeaways: normalizeTakeaways(input?.keyTakeaways ?? existing?.keyTakeaways ?? []),
    tocItems: normalizeTocItems(input?.tocItems ?? existing?.tocItems ?? []),
    internalLinks: normalizeLinkList(input?.internalLinks ?? existing?.internalLinks ?? []),
    externalLinks: normalizeLinkList(input?.externalLinks ?? existing?.externalLinks ?? []),
    status,
    publishedAt,
    scheduledAt,
    readTime: String(input?.readTime ?? existing?.readTime ?? '5 min read').trim().slice(0, 40),
    seoTitle: String(input?.seoTitle ?? existing?.seoTitle ?? '').trim().slice(0, 180),
    seoDescription: String(input?.seoDescription ?? existing?.seoDescription ?? '').trim().slice(0, 220),
    focusKeywords: String(input?.focusKeywords ?? existing?.focusKeywords ?? '').trim().slice(0, 500),
    metaKeywords: String(input?.metaKeywords ?? existing?.metaKeywords ?? '').trim().slice(0, 320),
    canonicalUrl: String(input?.canonicalUrl ?? existing?.canonicalUrl ?? '').trim().slice(0, 500),
    ogImage: String(input?.ogImage ?? existing?.ogImage ?? '').trim().slice(0, 500),
    ogTitle: String(input?.ogTitle ?? existing?.ogTitle ?? '').trim().slice(0, 240),
    ogDescription: String(input?.ogDescription ?? existing?.ogDescription ?? '').trim(),
    socialImage: String(input?.socialImage ?? existing?.socialImage ?? '').trim().slice(0, 500),
    robots: normalizeRobots(input?.robots ?? existing?.robots ?? 'index,follow'),
    visibility: normalizeVisibility(input?.visibility ?? existing?.visibility ?? 'public'),
    enableArticleSchema: asBool(
      input?.enableArticleSchema ?? existing?.enableArticleSchema,
      true
    ),
    enableFaqSchema: asBool(input?.enableFaqSchema ?? existing?.enableFaqSchema, false),
    previewChecked: asBool(input?.previewChecked ?? existing?.previewChecked, false),
    ...resolveSchemaWriteFields(input, existing),
  };
}

export async function createBlogPost(projectId, input) {
  const payload = buildPostWritePayload(input);
  return withTransaction(async (connection) => {
    try {
      const [res] = await connection.query(
        `INSERT INTO blog_posts (
          project_id, title, slug, excerpt, featured_image, featured_image_alt, featured_image_caption,
          category_id, author_id,
          content_json, content_html, faqs_json, key_takeaways_json,
          toc_items_json, internal_links_json, external_links_json,
          status, published_at, scheduled_at, read_time,
          seo_title, seo_description, focus_keywords, meta_keywords,
          canonical_url, og_image, og_title, og_description, social_image,
          robots, visibility, schema_type, schema_json_ld,
          enable_article_schema, enable_faq_schema, preview_checked
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectId,
          payload.title,
          payload.slug,
          payload.excerpt || null,
          payload.featuredImage || null,
          payload.featuredImageAlt || null,
          payload.featuredImageCaption || null,
          payload.categoryId || null,
          payload.authorId || null,
          JSON.stringify(payload.contentJson),
          payload.contentHtml || null,
          JSON.stringify(payload.faqs),
          JSON.stringify(payload.keyTakeaways),
          JSON.stringify(payload.tocItems),
          JSON.stringify(payload.internalLinks),
          JSON.stringify(payload.externalLinks),
          payload.status,
          payload.publishedAt,
          payload.scheduledAt,
          payload.readTime || null,
          payload.seoTitle || null,
          payload.seoDescription || null,
          payload.focusKeywords || null,
          payload.metaKeywords || null,
          payload.canonicalUrl || null,
          payload.ogImage || null,
          payload.ogTitle || null,
          payload.ogDescription || null,
          payload.socialImage || null,
          payload.robots,
          payload.visibility,
          payload.schemaType,
          payload.schemaJsonLd != null ? JSON.stringify(payload.schemaJsonLd) : null,
          payload.enableArticleSchema ? 1 : 0,
          payload.enableFaqSchema ? 1 : 0,
          payload.previewChecked ? 1 : 0,
        ]
      );
      const tagIds = await resolveTagIds(
        connection,
        projectId,
        input?.tagIds,
        input?.tagNames || input?.tags
      );
      await syncPostTags(connection, res.insertId, tagIds);
      return res.insertId;
    } catch (e) {
      if (e?.code === 'ER_DUP_ENTRY') throw new Error('A blog post with this slug already exists');
      throw e;
    }
  }).then((id) => getBlogPostById(projectId, id));
}

export async function updateBlogPost(projectId, postId, input) {
  const existing = await getBlogPostById(projectId, postId);
  if (!existing) throw new Error('Post not found');
  const payload = buildPostWritePayload(input, { existing });

  await withTransaction(async (connection) => {
    try {
      const [res] = await connection.query(
        `UPDATE blog_posts SET
          title = ?, slug = ?, excerpt = ?, featured_image = ?, featured_image_alt = ?, featured_image_caption = ?,
          category_id = ?, author_id = ?,
          content_json = ?, content_html = ?, faqs_json = ?, key_takeaways_json = ?,
          toc_items_json = ?, internal_links_json = ?, external_links_json = ?,
          status = ?, published_at = ?, scheduled_at = ?, read_time = ?,
          seo_title = ?, seo_description = ?, focus_keywords = ?, meta_keywords = ?,
          canonical_url = ?, og_image = ?, og_title = ?, og_description = ?, social_image = ?,
          robots = ?, visibility = ?, schema_type = ?, schema_json_ld = ?,
          enable_article_schema = ?, enable_faq_schema = ?, preview_checked = ?
         WHERE id = ? AND project_id = ? AND deleted_at IS NULL`,
        [
          payload.title,
          payload.slug,
          payload.excerpt || null,
          payload.featuredImage || null,
          payload.featuredImageAlt || null,
          payload.featuredImageCaption || null,
          payload.categoryId || null,
          payload.authorId || null,
          JSON.stringify(payload.contentJson),
          payload.contentHtml || null,
          JSON.stringify(payload.faqs),
          JSON.stringify(payload.keyTakeaways),
          JSON.stringify(payload.tocItems),
          JSON.stringify(payload.internalLinks),
          JSON.stringify(payload.externalLinks),
          payload.status,
          payload.publishedAt,
          payload.scheduledAt,
          payload.readTime || null,
          payload.seoTitle || null,
          payload.seoDescription || null,
          payload.focusKeywords || null,
          payload.metaKeywords || null,
          payload.canonicalUrl || null,
          payload.ogImage || null,
          payload.ogTitle || null,
          payload.ogDescription || null,
          payload.socialImage || null,
          payload.robots,
          payload.visibility,
          payload.schemaType,
          payload.schemaJsonLd != null ? JSON.stringify(payload.schemaJsonLd) : null,
          payload.enableArticleSchema ? 1 : 0,
          payload.enableFaqSchema ? 1 : 0,
          payload.previewChecked ? 1 : 0,
          postId,
          projectId,
        ]
      );
      if (!res.affectedRows) throw new Error('Post not found');

      if (input?.tagIds != null || input?.tagNames != null || input?.tags != null) {
        const tagIds = await resolveTagIds(
          connection,
          projectId,
          input?.tagIds,
          input?.tagNames || input?.tags
        );
        await syncPostTags(connection, postId, tagIds);
      }
    } catch (e) {
      if (e?.code === 'ER_DUP_ENTRY') throw new Error('A blog post with this slug already exists');
      throw e;
    }
  });

  return getBlogPostById(projectId, postId);
}

export async function softDeleteBlogPost(projectId, postId) {
  const pool = getDbPool();
  const [res] = await pool.query(
    `UPDATE blog_posts SET deleted_at = CURRENT_TIMESTAMP, status = 'archived'
     WHERE id = ? AND project_id = ? AND deleted_at IS NULL`,
    [postId, projectId]
  );
  return res.affectedRows > 0;
}

export async function duplicateBlogPost(projectId, postId) {
  const existing = await getBlogPostById(projectId, postId);
  if (!existing) throw new Error('Post not found');
  const baseSlug = safeSlug(`${existing.slug}-copy`, 170);
  let slug = baseSlug;
  let n = 2;
  while (await getBlogPostBySlug(projectId, slug, { includeDeleted: true })) {
    slug = safeSlug(`${baseSlug}-${n}`, 180);
    n += 1;
  }
  return createBlogPost(projectId, {
    ...existing,
    title: `${existing.title} (Copy)`,
    slug,
    status: 'draft',
    publishedAt: null,
    scheduledAt: null,
    tagIds: (existing.tags || []).map((t) => t.id),
  });
}

export async function setBlogPostStatus(projectId, postId, status) {
  const next = normalizeStatus(status);
  const patch = { status: next };
  if (next === 'published') patch.publishedAt = new Date().toISOString();
  if (next === 'draft' || next === 'archived') patch.scheduledAt = null;
  return updateBlogPost(projectId, postId, patch);
}

/** Public: published posts for a project */
export async function listPublishedBlogPosts(projectId, opts = {}) {
  return listBlogPosts(projectId, {
    ...opts,
    status: 'published',
    includeDeleted: false,
  });
}

export { safeSlug as slugifyBlogValue };
