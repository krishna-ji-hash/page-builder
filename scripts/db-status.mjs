#!/usr/bin/env node
import { getDbPool } from '../lib/db.js';
import { prisma, disconnectPrisma } from '../lib/prisma.ts';
import { buildHealthReport } from '../lib/db/dbHealth.js';
import { getMigrationStatus } from '../lib/db/migrationStatus.js';
import { maskHost } from '../lib/db/maskSecrets.js';
import { findMissingPrismaTables } from '../lib/db/prismaSchemaTables.js';

function printSection(title) {
  process.stdout.write(`\n${title}\n${'─'.repeat(title.length)}\n`);
}

async function main() {
  printSection('Database status');

  const pool = getDbPool();
  let connection;
  try {
    const [ping] = await pool.query('SELECT 1 AS ok');
    process.stdout.write(`MySQL pool: ${ping[0]?.ok === 1 ? 'connected' : 'FAILED'}\n`);
    process.stdout.write(`Host: ${maskHost(process.env.MYSQL_HOST)}\n`);
    process.stdout.write(`Database: ${process.env.MYSQL_DATABASE || 'documents'}\n`);
    process.stdout.write(`Pool limit: ${process.env.MYSQL_POOL_LIMIT || 10}\n`);

    connection = await pool.getConnection();
    const database = process.env.MYSQL_DATABASE || 'documents';
    const [tables] = await connection.query('SHOW TABLES');
    const tableKey = `Tables_in_${database}`;
    const tableNames = tables.map((row) => row[tableKey]);
    process.stdout.write(`Tables: ${tableNames.length}\n`);

    const migrationStatus = await getMigrationStatus(connection);
    process.stdout.write(`Migrations table: ${migrationStatus.tableExists ? 'yes' : 'NO'}\n`);
    process.stdout.write(`Applied migrations: ${migrationStatus.appliedCount}\n`);
    process.stdout.write(`Latest applied: ${migrationStatus.latestApplied || '(none)'}\n`);

    if (migrationStatus.pending.length > 0) {
      process.stdout.write(`Pending migrations (${migrationStatus.pending.length}):\n`);
      for (const name of migrationStatus.pending) {
        process.stdout.write(`  - ${name}\n`);
      }
    } else {
      process.stdout.write('Pending migrations: none\n');
    }

    const missingPrisma = findMissingPrismaTables(tableNames);
    if (missingPrisma.length > 0) {
      process.stdout.write(`\nWarning: Prisma-mapped tables missing in DB:\n`);
      for (const name of missingPrisma) {
        process.stdout.write(`  - ${name}\n`);
      }
    }

    try {
      const prismaCount = await prisma.project.count();
      process.stdout.write(`\nPrisma: connected (projects=${prismaCount})\n`);
    } catch (error) {
      process.stdout.write(`\nPrisma: FAILED — ${error.message}\n`);
    }

    printSection('Health summary');
    const health = await buildHealthReport();
    process.stdout.write(`Overall: ${health.status}\n`);
    process.stdout.write(`mysql=${health.mysql} prisma=${health.prisma} migrations=${health.migrations}\n`);
    process.stdout.write(`GET /api/health for full JSON report\n`);

    if (health.status === 'error' || migrationStatus.pending.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`\nDB status failed: ${error.message}\n`);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await disconnectPrisma().catch(() => {});
  }
}

main();
