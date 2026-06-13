import { runMigrations } from '../lib/runMigrations.mjs';
import { hashPassword } from '../lib/auth/password.js';
import mysql from 'mysql2/promise';

async function bootstrapAdmin(connection) {
  const email = String(process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@localhost').trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!password) {
    process.stdout.write('Skip admin bootstrap — set ADMIN_BOOTSTRAP_PASSWORD to create default admin.\n');
    return;
  }

  const [existing] = await connection.execute(
    `SELECT id FROM admin_users WHERE email = ? LIMIT 1`,
    [email]
  );
  if (existing.length) {
    process.stdout.write(`Admin user already exists: ${email}\n`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const displayName = process.env.ADMIN_BOOTSTRAP_NAME || 'Super Admin';
  await connection.execute(
    `INSERT INTO admin_users (email, password_hash, display_name, role) VALUES (?, ?, ?, 'super_admin')`,
    [email, passwordHash, displayName]
  );
  process.stdout.write(`Created bootstrap super_admin: ${email}\n`);
}

async function main() {
  await runMigrations();

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'documents',
  });

  try {
    await bootstrapAdmin(connection);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exit(1);
});
