/**
 * Drops and recreates the MYSQL_DATABASE schema (destructive).
 * Blocked when NODE_ENV or VERCEL_ENV is production.
 */
import mysql from 'mysql2/promise';

const database = process.env.MYSQL_DATABASE || 'documents';

function assertNotProduction() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const vercelEnv = process.env.VERCEL_ENV;
  if (nodeEnv === 'production' || vercelEnv === 'production') {
    process.stderr.write(
      'db:reset is disabled in production (NODE_ENV=production or VERCEL_ENV=production).\n'
    );
    process.exit(1);
  }
}

async function run() {
  assertNotProduction();

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    multipleStatements: true,
  });

  await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await connection.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  process.stdout.write(`Reset database: ${database}\n`);
  await connection.end();
}

run().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exit(1);
});
