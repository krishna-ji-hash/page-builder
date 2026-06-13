export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/envValidation.js');
    try {
      validateEnv();
    } catch (error) {
      console.error('[startup] Environment validation failed:', error.message);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
}
