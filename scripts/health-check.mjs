#!/usr/bin/env node
const baseUrl = String(process.env.HEALTH_CHECK_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const url = `${baseUrl}/api/health`;

async function main() {
  let response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (error) {
    process.stderr.write(`Health check failed to reach ${url}\n${error.message}\n`);
    process.exit(1);
  }

  const body = await response.json();

  process.stdout.write(`Health check: ${url}\n`);
  process.stdout.write(`  status=${body.status} http=${response.status}\n`);
  process.stdout.write(`  mysql=${body.mysql} prisma=${body.prisma} migrations=${body.migrations}\n`);
  process.stdout.write(`  environment=${body.environment} version=${body.version}\n`);
  if (body.database) {
    process.stdout.write(`  database=${body.database.name} host=${body.database.host} tables=${body.database.tableCount ?? '?'}\n`);
  }
  if (body.details?.migrationPending?.length) {
    process.stdout.write(`  pending migrations: ${body.details.migrationPending.join(', ')}\n`);
  }

  if (!response.ok || body.status === 'error') {
    process.stderr.write('\nFull response:\n');
    process.stderr.write(`${JSON.stringify(body, null, 2)}\n`);
    process.exit(1);
  }

  if (body.status === 'degraded') {
    process.exit(1);
  }
}

main();
