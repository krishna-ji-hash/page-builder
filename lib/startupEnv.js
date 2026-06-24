import { validateEnv } from './envValidation.js';

let validated = false;

/** Run once on first Node.js DB access — avoids edge-instrumentation eval failures. */
export function ensureEnvValidated() {
  if (validated) return;
  validated = true;
  try {
    validateEnv();
  } catch (error) {
    console.error('[startup] Environment validation failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}
