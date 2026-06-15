import { getDbPool } from '../lib/db.js';

const pool = getDbPool();

try {
  const [ping] = await pool.query('SELECT 1 AS ok');
  console.log('Connection:', ping[0]?.ok === 1 ? 'OK' : 'FAIL');

  const [tables] = await pool.query('SHOW TABLES');
  console.log('Tables:', tables.length);

  const required = [
    'migrations',
    'projects',
    'pages',
    'page_versions',
    'admin_users',
    'admin_sessions',
    'admin_activity_logs',
    'project_domains',
    'cms_collections',
    'form_submissions',
  ];
  const tableNames = tables.map((r) => Object.values(r)[0]);
  const missing = required.filter((t) => !tableNames.includes(t));
  console.log('Core tables:', missing.length ? `MISSING: ${missing.join(', ')}` : 'OK');

  const [migs] = await pool.query('SELECT COUNT(*) AS c FROM migrations');
  console.log('Migrations applied:', migs[0]?.c ?? 0);

  const [users] = await pool.query('SELECT COUNT(*) AS c FROM admin_users');
  console.log('Admin users:', users[0]?.c ?? 0);

  const [projects] = await pool.query('SELECT COUNT(*) AS c FROM projects');
  console.log('Projects:', projects[0]?.c ?? 0);

  const [pages] = await pool.query('SELECT COUNT(*) AS c FROM pages');
  console.log('Pages:', pages[0]?.c ?? 0);

  const [domains] = await pool.query('SELECT COUNT(*) AS c FROM project_domains');
  console.log('Domains:', domains[0]?.c ?? 0);

  const [logs] = await pool.query('SELECT COUNT(*) AS c FROM admin_activity_logs');
  console.log('Activity logs:', logs[0]?.c ?? 0);

  if (missing.length) process.exit(1);
} catch (error) {
  console.error('DB ERROR:', error.message);
  process.exit(1);
} finally {
  await pool.end();
}
