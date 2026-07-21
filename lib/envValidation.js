const WEAK_PASSWORDS = new Set(['changeme', 'password', 'admin', '123456', 'test']);

function isProd() {
  return process.env.NODE_ENV === 'production';
}

function getDatabaseUrlHost() {
  const url = String(process.env.DATABASE_URL || '').trim();
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function isLocalDatabaseHost() {
  const host = String(getDatabaseUrlHost() || '127.0.0.1').trim().toLowerCase();
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

/** True when DATABASE_URL is a PostgreSQL connection string. */
export function isPostgresDatabaseUrl(value = process.env.DATABASE_URL) {
  const url = String(value || '').trim().toLowerCase();
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

function assertPostgresDatabaseUrl() {
  if (!isPostgresDatabaseUrl()) {
    throw new Error('DATABASE_URL is required and must be a PostgreSQL connection URL.');
  }
}

/** Placeholder builder host in .env — still local `npm start` / verify, not a real deploy. */
export function isPlaceholderBuilderHost() {
  const builder = String(process.env.BUILDER_APP_HOST || '').trim().toLowerCase();
  if (!builder) return true;
  return (
    builder.includes('yourdomain') ||
    builder.includes('example.com') ||
    builder.endsWith('.local')
  );
}

function normalizeEnvHost(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0]
    .replace(/^www\./, '');
}

function enforceProductionCredentials() {
  return isProd() && !(isLocalDatabaseHost() && isPlaceholderBuilderHost());
}

function validateProductionDeployHosts() {
  if (!enforceProductionCredentials()) return;

  const builderHost = normalizeEnvHost(process.env.BUILDER_APP_HOST);
  if (!builderHost || isPlaceholderBuilderHost()) {
    throw new Error(
      'BUILDER_APP_HOST must be your admin subdomain in production (e.g. builder.yourdomain.com)'
    );
  }

  const siteUrl = String(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (!siteUrl) {
    throw new Error('SITE_URL must be set to https://your-builder-host in production (admin CSRF + cookies)');
  }

  let siteHost = '';
  try {
    siteHost = normalizeEnvHost(new URL(siteUrl).hostname);
  } catch {
    throw new Error('SITE_URL must be a valid absolute URL (e.g. https://builder.yourdomain.com)');
  }

  if (siteHost !== builderHost) {
    throw new Error(
      `SITE_URL host (${siteHost}) must match BUILDER_APP_HOST (${builderHost}) — admin lives on the builder host only`
    );
  }

  if (isProd() && !siteUrl.startsWith('https://')) {
    console.warn('[env] SITE_URL should use https:// in production');
  }

  if (!String(process.env.PLATFORM_SERVER_IP || '').trim()) {
    console.warn('[env] PLATFORM_SERVER_IP not set — domain DNS instructions in admin will be incomplete');
  }
}

export function validateEnv({ strict = false } = {}) {
  assertPostgresDatabaseUrl();

  if (isProd() || strict) {
    const authSecret = String(process.env.AUTH_SECRET || '').trim();
    if (!authSecret) {
      throw new Error('AUTH_SECRET is required in production');
    }
    if (authSecret.length < 32) {
      throw new Error('AUTH_SECRET must be at least 32 characters in production');
    }

    if (process.env.AUTH_DISABLED === 'true' || process.env.AUTH_DISABLED === '1') {
      throw new Error('AUTH_DISABLED must not be enabled in production');
    }

    const bootstrapPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '').trim();
    if (
      enforceProductionCredentials() &&
      bootstrapPassword &&
      WEAK_PASSWORDS.has(bootstrapPassword.toLowerCase())
    ) {
      throw new Error('ADMIN_BOOTSTRAP_PASSWORD is too weak for production');
    }

    if (!process.env.SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL) {
      console.warn('[env] SITE_URL not set — admin CSRF origin checks may block mutations in production');
    }

    validateProductionDeployHosts();
  } else if (!process.env.AUTH_SECRET) {
    console.warn('[env] AUTH_SECRET not set — required before production deploy');
  }

  if (!process.env.ADMIN_BOOTSTRAP_PASSWORD) {
    console.warn('[env] ADMIN_BOOTSTRAP_PASSWORD not set — bootstrap admin will not be auto-created');
  }
}
