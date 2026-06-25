import fs from 'node:fs';
import path from 'node:path';

/** Prisma @@map table names from schema.prisma (for drift warnings). */
export function listPrismaMappedTables(schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')) {
  let text = '';
  try {
    text = fs.readFileSync(schemaPath, 'utf8');
  } catch {
    return [];
  }

  const tables = new Set();
  const mapRe = /@@map\("([^"]+)"\)/g;
  let match;
  while ((match = mapRe.exec(text)) !== null) {
    tables.add(match[1]);
  }
  return [...tables].sort();
}

export function findMissingPrismaTables(dbTableNames, prismaTables = listPrismaMappedTables()) {
  const dbSet = new Set(dbTableNames.map((n) => String(n).toLowerCase()));
  return prismaTables.filter((t) => !dbSet.has(t.toLowerCase()));
}
