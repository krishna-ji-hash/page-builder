import { PrismaClient } from '@prisma/client';
import { ensureEnvValidated } from './startupEnv.js';

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = process.env.MYSQL_PORT || '3306';
  const user = encodeURIComponent(process.env.MYSQL_USER || 'root');
  const password = encodeURIComponent(process.env.MYSQL_PASSWORD ?? '');
  const database = process.env.MYSQL_DATABASE || 'documents';
  const auth = password ? `${user}:${password}` : user;
  return `mysql://${auth}@${host}:${port}/${database}`;
}

function createPrismaClient(): PrismaClient {
  ensureEnvValidated();
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = buildDatabaseUrl();
  }
  return new PrismaClient({
    log: process.env.PRISMA_LOG === '1' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/** @deprecated Prefer `prisma` import. */
export function getPrisma(): PrismaClient {
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  if (process.env.NODE_ENV !== 'production') {
    delete globalForPrisma.prisma;
  }
}

export default prisma;
