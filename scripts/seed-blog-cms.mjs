/**
 * Seed first-class blog CMS tables for a project (default: dispatch).
 *
 * Usage:
 *   npm run seed:blog-cms
 *   npm run seed:blog-cms -- dispatch
 */
import mysql from 'mysql2/promise';
import { getAllSiteBlogPosts } from '../lib/siteBlogPosts.js';
import { serializeBlogContentToBody } from '../lib/blogPostContent.js';

const CATEGORIES = [
  { name: 'Shipping Guide', slug: 'shipping-guide', description: 'Guides for shipping operations' },
  { name: 'COD & Wallet', slug: 'cod-wallet', description: 'COD remittance and wallet topics' },
  { name: 'Tracking', slug: 'tracking', description: 'Shipment tracking visibility' },
  { name: 'Integrations', slug: 'integrations', description: 'Platform and courier integrations' },
  { name: 'eCommerce', slug: 'ecommerce', description: 'eCommerce logistics best practices' },
  { name: 'Courier Partners', slug: 'courier-partners', description: 'Courier selection and rates' },
];

const DEFAULT_AUTHOR = {
  name: 'Dispatch Team',
  designation: 'Logistics Experts',
  bio: 'The Dispatch Solutions team writes about shipping operations, courier aggregation, COD, and eCommerce logistics.',
  avatar: '',
};

function blocksToHtml(blocks) {
  return (blocks || [])
    .map((block) => {
      const h = String(block.heading || '').replace(/</g, '&lt;');
      const t = String(block.text || '')
        .replace(/</g, '&lt;')
        .replace(/\n/g, '<br/>');
      return `<section class="blog-article-block"><h2>${h}</h2><p>${t}</p></section>`;
    })
    .join('\n');
}

function parsePublishedDate(label) {
  if (!label) return new Date();
  const d = new Date(label);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function toMysqlDateTime(d) {
  return d.toISOString().slice(0, 19).replace('T', ' ');
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
    multipleStatements: true,
  });

  try {
    const [projects] = await connection.query(
      `SELECT id, slug, name FROM projects WHERE slug = ? LIMIT 1`,
      [projectSlug]
    );
    if (!projects.length) {
      throw new Error(`Project not found: ${projectSlug}`);
    }
    const projectId = projects[0].id;
    console.log(`Seeding blog CMS for project ${projects[0].name} (#${projectId})`);

    const categoryIds = new Map();
    for (const cat of CATEGORIES) {
      const [existing] = await connection.query(
        `SELECT id FROM blog_categories WHERE project_id = ? AND slug = ? LIMIT 1`,
        [projectId, cat.slug]
      );
      if (existing.length) {
        categoryIds.set(cat.slug, existing[0].id);
        continue;
      }
      const [ins] = await connection.query(
        `INSERT INTO blog_categories (project_id, name, slug, description) VALUES (?, ?, ?, ?)`,
        [projectId, cat.name, cat.slug, cat.description]
      );
      categoryIds.set(cat.slug, ins.insertId);
    }

    let authorId;
    const [authors] = await connection.query(
      `SELECT id FROM blog_authors WHERE project_id = ? AND name = ? LIMIT 1`,
      [projectId, DEFAULT_AUTHOR.name]
    );
    if (authors.length) {
      authorId = authors[0].id;
    } else {
      const [ins] = await connection.query(
        `INSERT INTO blog_authors (project_id, name, designation, bio, avatar) VALUES (?, ?, ?, ?, ?)`,
        [
          projectId,
          DEFAULT_AUTHOR.name,
          DEFAULT_AUTHOR.designation,
          DEFAULT_AUTHOR.bio,
          DEFAULT_AUTHOR.avatar || null,
        ]
      );
      authorId = ins.insertId;
    }

    const posts = getAllSiteBlogPosts();
    for (const post of posts) {
      const categoryId = categoryIds.get(post.categoryId) || null;
      const contentJson = (post.content || []).map((b) => ({
        heading: b.heading,
        text: b.text,
      }));
      const contentHtml = blocksToHtml(contentJson);
      const publishedAt = toMysqlDateTime(parsePublishedDate(post.publishedDate));
      const seoTitle = `${post.title} | Dispatch Solutions Blog`;
      const faqs = [
        {
          question: `What is covered in “${post.title}”?`,
          answer: post.description,
        },
      ];
      const takeaways = contentJson.slice(0, 3).map((b) => b.heading).filter(Boolean);

      const [existing] = await connection.query(
        `SELECT id FROM blog_posts WHERE project_id = ? AND slug = ? LIMIT 1`,
        [projectId, post.slug]
      );

      let postId;
      if (existing.length) {
        postId = existing[0].id;
        await connection.query(
          `UPDATE blog_posts SET
            title = ?, excerpt = ?, featured_image = ?, category_id = ?, author_id = ?,
            content_json = ?, content_html = ?, faqs_json = ?, key_takeaways_json = ?,
            status = 'published', published_at = COALESCE(published_at, ?), read_time = ?,
            seo_title = ?, seo_description = ?, og_image = ?, robots = 'index', deleted_at = NULL
           WHERE id = ?`,
          [
            post.title,
            post.description,
            post.image,
            categoryId,
            authorId,
            JSON.stringify(contentJson),
            contentHtml,
            JSON.stringify(faqs),
            JSON.stringify(takeaways),
            publishedAt,
            post.readTime,
            seoTitle,
            post.description,
            post.image,
            postId,
          ]
        );
        console.log(`  updated: ${post.slug}`);
      } else {
        const [ins] = await connection.query(
          `INSERT INTO blog_posts (
            project_id, title, slug, excerpt, featured_image, category_id, author_id,
            content_json, content_html, faqs_json, key_takeaways_json,
            status, published_at, read_time, seo_title, seo_description, og_image, robots
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, 'index')`,
          [
            projectId,
            post.title,
            post.slug,
            post.description,
            post.image,
            categoryId,
            authorId,
            JSON.stringify(contentJson),
            contentHtml || serializeBlogContentToBody(contentJson),
            JSON.stringify(faqs),
            JSON.stringify(takeaways),
            publishedAt,
            post.readTime,
            seoTitle,
            post.description,
            post.image,
          ]
        );
        postId = ins.insertId;
        console.log(`  created: ${post.slug}`);
      }

      const tags = [post.category, 'Logistics', 'Shipping'].filter(Boolean);
      for (const tagName of tags) {
        const tagSlug = String(tagName)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 160);
        const [tagRows] = await connection.query(
          `SELECT id FROM blog_tags WHERE project_id = ? AND slug = ? LIMIT 1`,
          [projectId, tagSlug]
        );
        let tagId;
        if (tagRows.length) {
          tagId = tagRows[0].id;
        } else {
          const [insTag] = await connection.query(
            `INSERT INTO blog_tags (project_id, name, slug) VALUES (?, ?, ?)`,
            [projectId, tagName, tagSlug]
          );
          tagId = insTag.insertId;
        }
        await connection.query(
          `INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)`,
          [postId, tagId]
        );
      }
    }

    await connection.query(
      `INSERT INTO blog_settings (project_id, settings_json)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json)`,
      [
        projectId,
        JSON.stringify({
          postsPerPage: 12,
          showRelated: true,
          defaultAuthorId: authorId,
          listingSlug: 'blog',
          articleTemplateSlug: 'blog-post',
        }),
      ]
    );

    console.log(`Done. Seeded ${posts.length} posts.`);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
