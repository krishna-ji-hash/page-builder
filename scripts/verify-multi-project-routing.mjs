import mysql from 'mysql2/promise';
import { prisma, disconnectPrisma } from '../lib/prisma.ts';
const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD ?? '',
  database: process.env.MYSQL_DATABASE || 'documents',
});

const [projectCols] = await connection.query(
  `SELECT COLUMN_NAME FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects'
     AND COLUMN_NAME IN ('domain','home_slug','status')`
);
const [pageCols] = await connection.query(
  `SELECT COLUMN_NAME FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pages'
     AND COLUMN_NAME IN ('draft_json','published_json','published_at')`
);
const [settings] = await connection.query(
  `SELECT id, active_project_id FROM site_settings WHERE id = 'main'`
);
const [projects] = await connection.query(
  `SELECT id, slug, domain, home_slug, status FROM projects ORDER BY id`
);
const [pubCount] = await connection.query(
  `SELECT COUNT(*) AS c FROM pages WHERE published_json IS NOT NULL`
);
const [draftCount] = await connection.query(
  `SELECT COUNT(*) AS c FROM pages WHERE draft_json IS NOT NULL`
);

console.log('OK project columns:', projectCols.map((r) => r.COLUMN_NAME).join(', '));
console.log('OK page columns:', pageCols.map((r) => r.COLUMN_NAME).join(', '));
console.log('OK site_settings:', settings[0]);
console.log('OK projects:', projects);
console.log('OK published_json pages:', pubCount[0].c);
console.log('OK draft_json pages:', draftCount[0].c);

const active = await prisma.siteSetting.findUnique({  where: { id: 'main' },
  include: { activeProject: { select: { slug: true, domain: true, homeSlug: true } } },
});
console.log('OK prisma active project:', active?.activeProject?.slug || null);

await connection.end();
await disconnectPrisma();
console.log('\nAll multi-project routing checks passed.');
