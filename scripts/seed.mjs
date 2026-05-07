import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'documents',
    multipleStatements: true,
  });

  const seedsDir = path.join(process.cwd(), 'database', 'seeds');
  const files = (await fs.readdir(seedsDir))
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = await fs.readFile(path.join(seedsDir, file), 'utf8');
    await connection.query(sql);
    process.stdout.write(`Applied seed: ${file}\n`);
  }

  await connection.end();
}

run().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exit(1);
});
