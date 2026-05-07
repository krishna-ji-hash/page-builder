import mysql from 'mysql2/promise';

let pool;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function mysqlPassword() {
  const raw = process.env.MYSQL_PASSWORD;
  if (raw === undefined || raw === null) return '';
  return String(raw);
}

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: requiredEnv('MYSQL_HOST'),
      port: Number(process.env.MYSQL_PORT || 3306),
      user: requiredEnv('MYSQL_USER'),
      password: mysqlPassword(),
      database: process.env.MYSQL_DATABASE || 'documents',
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_POOL_LIMIT || 10),
      queueLimit: 0,
      namedPlaceholders: true,
      dateStrings: true,
    });
  }

  return pool;
}

export async function withTransaction(callback) {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
