import { PrismaClient } from '@prisma/client';
import { ensureEnvValidated } from './startupEnv.js';

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function requirePostgresDatabaseUrl(): string {
  const url = String(process.env.DATABASE_URL || '').trim();
  if (!url) {
    throw new Error('DATABASE_URL is required and must be a PostgreSQL connection URL.');
  }
  const lower = url.toLowerCase();
  if (!lower.startsWith('postgresql://') && !lower.startsWith('postgres://')) {
    throw new Error('DATABASE_URL is required and must be a PostgreSQL connection URL.');
  }
  return url;
}

function createPrismaClient(): PrismaClient {
  ensureEnvValidated();
  requirePostgresDatabaseUrl();
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
