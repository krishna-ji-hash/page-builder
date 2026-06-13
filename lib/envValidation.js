const REQUIRED = ['MYSQL_HOST', 'MYSQL_USER'];

const WEAK_PASSWORDS = new Set(['changeme', 'password', 'admin', '123456', 'test']);

function isProd() {
  return process.env.NODE_ENV === 'production';
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
    if (bootstrapPassword && WEAK_PASSWORDS.has(bootstrapPassword.toLowerCase())) {
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
