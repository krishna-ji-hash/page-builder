const REQUIRED = ['MYSQL_HOST', 'MYSQL_USER'];

const WEAK_PASSWORDS = new Set(['changeme', 'password', 'admin', '123456', 'test']);

function isProd() {
  return process.env.NODE_ENV === 'production';
}

function isLocalDatabaseHost() {
  const host = String(process.env.MYSQL_HOST || '127.0.0.1').trim().toLowerCase();
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

/** Placeholder builder host in .env — still local `npm start` / verify, not a real deploy. */
function isPlaceholderBuilderHost() {
  const builder = String(process.env.BUILDER_APP_HOST || '').trim().toLowerCase();
  if (!builder) return true;
  return (
    builder.includes('yourdomain') ||
    builder.includes('example.com') ||
    builder.endsWith('.local')
  );
}

function enforceProductionCredentials() {
  return isProd() && !(isLocalDatabaseHost() && isPlaceholderBuilderHost());
}

export function validateEnv({ strict = false } = {}) {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (isProd() || strict) {
    if (!process.env.MYSQL_DATABASE) {
      throw new Error('MYSQL_DATABASE is required in production');
    }

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
  } else if (!process.env.AUTH_SECRET) {
    console.warn('[env] AUTH_SECRET not set — required before production deploy');
  }

  if (!process.env.ADMIN_BOOTSTRAP_PASSWORD) {
    console.warn('[env] ADMIN_BOOTSTRAP_PASSWORD not set — bootstrap admin will not be auto-created');
  }
}
