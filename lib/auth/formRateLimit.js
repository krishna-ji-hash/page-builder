import { checkRateLimit } from './rateLimit.js';

function envInt(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function checkFormSubmitRateLimit(ip, formKey = 'global') {
  const max = envInt('FORM_SUBMIT_RATE_MAX', 8);
  const windowMs = envInt('FORM_SUBMIT_RATE_WINDOW_MS', 60_000);
  const key = `form-submit:${ip || 'unknown'}:${String(formKey).slice(0, 96)}`;
  return checkRateLimit(key, { max, windowMs });
}

export function checkFormAnalyticsRateLimit(ip, formKey = 'global') {
  const max = envInt('FORM_ANALYTICS_RATE_MAX', 40);
  const windowMs = envInt('FORM_ANALYTICS_RATE_WINDOW_MS', 60_000);
  const key = `form-analytics:${ip || 'unknown'}:${String(formKey).slice(0, 96)}`;
  return checkRateLimit(key, { max, windowMs });
}
