/**
 * Seed CMS blog collection with canonical site blog posts.
 *
 * Usage:
 *   npm run seed:blog-posts
 *   npm run seed:blog-posts -- dispatch
 */
import mysql from 'mysql2/promise';
import { getAllSiteBlogPosts } from '../lib/siteBlogPosts.js';
import { siteBlogPostToCmsItemPayload } from '../lib/siteBlogPostToCmsItem.js';

const BLOG_COLLECTION = {
  name: 'Blog',
  slug: 'blog',
  type: 'blog',
  schema: {
    fields: [
      { id: 'excerpt', type: 'text' },
      { id: 'content', type: 'richtext' },
      { id: 'contentBlocks', type: 'json' },
      { id: 'featuredImage', type: 'image' },
      { id: 'category', type: 'text' },
      { id: 'readTime', type: 'text' },
      { id: 'publishedDate', type: 'text' },
      { id: 'tags', type: 'json' },
      { id: 'author', type: 'text' },
    ],
  },
};

async function getProjectId(connection, projectSlug) {
  const [rows] = await connection.query(
    `SELECT id, slug, name FROM projects WHERE slug = ? LIMIT 1`,
    [projectSlug]
  );
  return rows[0] || null;
}

async function ensureBlogCollection(connection, projectId) {
  const [existing] = await connection.query(
    `SELECT id FROM cms_collections WHERE project_id = ? AND slug = ? LIMIT 1`,
    [projectId, BLOG_COLLECTION.slug]
  );
  if (existing.length) return existing[0].id;

  const [ins] = await connection.query(
    `INSERT INTO cms_collections (project_id, name, slug, type, schema_json)
     VALUES (?, ?, ?, ?, ?)`,
    [
      projectId,
      BLOG_COLLECTION.name,
      BLOG_COLLECTION.slug,
      BLOG_COLLECTION.type,
      JSON.stringify(BLOG_COLLECTION.schema),
    ]
  );
  return ins.insertId;
}

async function upsertBlogItem(connection, collectionId, payload) {
  const [existing] = await connection.query(
    `SELECT id FROM cms_items WHERE collection_id = ? AND slug = ? LIMIT 1`,
    [collectionId, payload.slug]
  );

  const dataJson = JSON.stringify(payload.data);
  const seoJson = JSON.stringify(payload.seo || {});
  const publishedAt = payload.status === 'published' ? new Date() : null;

  if (existing.length) {
    await connection.query(
      `UPDATE cms_items
       SET status = ?, title = ?, data_json = ?, seo_json = ?, published_at = COALESCE(published_at, ?), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [payload.status, payload.title, dataJson, seoJson, publishedAt, existing[0].id]
    );
    return { id: existing[0].id, action: 'updated' };
  }

  const [ins] = await connection.query(
    `INSERT INTO cms_items (collection_id, status, slug, title, data_json, seo_json, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [collectionId, payload.status, payload.slug, payload.title, dataJson, seoJson, publishedAt]
  );
  return { id: ins.insertId, action: 'created' };
}

async function main() {
  const projectSlug =
    process.argv[2]?.trim() ||
    process.env.SEED_BLOG_PROJECT_SLUG?.trim() ||
    process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG?.trim() ||
    'dispatch';

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE || 'documents',
    multipleStatements: false,
  });

  try {
    const project = await getProjectId(connection, projectSlug);
    if (!project) {
      throw new Error(`Project not found for slug "${projectSlug}"`);
    }

    const collectionId = await ensureBlogCollection(connection, project.id);
    const posts = getAllSiteBlogPosts();
    const results = [];

    for (const post of posts) {
      const payload = siteBlogPostToCmsItemPayload(post);
      const result = await upsertBlogItem(connection, collectionId, payload);
      results.push({ slug: post.slug, title: post.title, ...result });
    }

    process.stdout.write(
      `Seeded ${results.length} blog posts for "${project.name}" (${project.slug}, project ${project.id})\n`
    );
    for (const row of results) {
      process.stdout.write(`  - ${row.action}: ${row.slug}\n`);
    }
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
