#!/usr/bin/env node
/**
 * Production deploy pre-flight — run on the server before going live.
 *
 * Usage:
 *   node --env-file=.env.production scripts/verify-production-deploy.mjs
 *   node --env-file=.env.production scripts/verify-production-deploy.mjs --build
 */
import { spawnSync } from 'node:child_process';
import { validateEnv, isPlaceholderBuilderHost } from '../lib/envValidation.js';

const args = new Set(process.argv.slice(2));
const runBuild = args.has('--build');

const checks = [];

function pass(name, detail = '') {
  checks.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  checks.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function warn(name, detail = '') {
  checks.push({ name, ok: true, detail, warn: true });
  console.warn(`⚠ ${name}${detail ? ` — ${detail}` : ''}`);
}

function main() {
  console.log('\nProduction deploy pre-flight\n');

  const prevNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    try {
      validateEnv({ strict: true });
      pass('Environment validation', 'AUTH_SECRET, MYSQL_*, builder host');
    } catch (error) {
      fail('Environment validation', error instanceof Error ? error.message : String(error));
    }

    if (!process.env.DATABASE_URL && !process.env.MYSQL_DATABASE) {
      fail('Database', 'Set DATABASE_URL or MYSQL_DATABASE');
    } else {
      pass('Database config', process.env.DATABASE_URL ? 'DATABASE_URL set' : 'MYSQL_* set');
    }

    const builder = String(process.env.BUILDER_APP_HOST || '').trim();
    const siteUrl = String(process.env.SITE_URL || '').trim();

    if (isPlaceholderBuilderHost()) {
      fail('BUILDER_APP_HOST', 'Set real admin host (e.g. builder.yourdomain.com)');
    } else {
      pass('BUILDER_APP_HOST', builder);
    }

    if (!siteUrl) {
      fail('SITE_URL', 'Required — must match builder host with https://');
    } else if (!siteUrl.startsWith('https://')) {
      warn('SITE_URL', 'Use https:// on production');
    } else {
      pass('SITE_URL', siteUrl);
    }

    if (process.env.AUTH_DISABLED === 'true' || process.env.AUTH_DISABLED === '1') {
      fail('AUTH_DISABLED', 'Must be off in production');
    } else {
      pass('Admin auth', 'enabled');
    }

    const serverIp = String(process.env.PLATFORM_SERVER_IP || '').trim();
    if (!serverIp || serverIp === 'YOUR_SERVER_IP') {
      warn('PLATFORM_SERVER_IP', 'Set server IP for client domain DNS instructions');
    } else {
      pass('PLATFORM_SERVER_IP', serverIp);
    }

    console.log('\nMulti-domain live checklist:');
    console.log('  • DNS A/CNAME for each client domain → this server IP');
    console.log('  • Admin only on BUILDER_APP_HOST (not on client domains)');
    console.log('  • Reverse proxy forwards Host + X-Forwarded-Host to Node');
    console.log('  • Admin → Domains → Verify each domain before production traffic');
    console.log('  • Publish home page for each project\n');

    if (runBuild) {
      console.log('Running production build…\n');
      const result = spawnSync('npm', ['run', 'build'], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, NODE_ENV: 'production' },
      });
      if (result.status === 0) {
        pass('next build', 'completed');
      } else {
        fail('next build', `exit ${result.status ?? 'unknown'}`);
      }
    } else {
      console.log('Tip: add --build to run `npm run build` in this check.\n');
    }

    const failed = checks.filter((c) => !c.ok);
    console.log(`\n${checks.length - failed.length}/${checks.length} checks passed\n`);

    if (failed.length) {
      console.log('Fix .env on the server, then re-run:');
      console.log('  node --env-file=.env scripts/verify-production-deploy.mjs --build\n');
      process.exit(1);
    }

    console.log('Deploy steps on server:');
    console.log('  1. npm run db:migrate');
    console.log('  2. npx prisma migrate deploy');
    console.log('  3. npm run prisma:generate');
    console.log('  4. npm run build');
    console.log('  5. NODE_ENV=production npm start');
    console.log('  (or use PM2/systemd with NODE_ENV=production)\n');
  } finally {
    if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNodeEnv;
  }
}

main();
