/**
 * Client/server-safe form field validation (builder props_json.fields, DynamicForm).
 * @param {unknown} value
 * @param {{ type?: string; required?: boolean; validation?: object; maxSizeMb?: number }} field
 * @returns {string | null} error message or null if valid
 */
export function validateFormFieldValue(value, field) {
  if (!field || typeof field !== 'object' || Array.isArray(field)) {
    return 'Invalid field definition';
  }
  const type = String(field.type || 'string').toLowerCase();
  if (type === 'hidden') return null;

  const str = value === null || value === undefined ? '' : String(value);
  const trimmed = str.trim();
  const v =
    field.validation && typeof field.validation === 'object' && !Array.isArray(field.validation)
      ? field.validation
      : {};
  const customMsg = typeof v.message === 'string' && v.message.trim() ? v.message.trim() : '';
  const label = field.label || field.name || 'Field';

  if (type === 'file') {
    if (field.required && (!value || typeof value !== 'object')) {
      return customMsg || `${label} is required`;
    }
    if (!value || typeof value !== 'object') return null;
    const size = Number(value.size);
    const maxMb = Number(field.maxSizeMb) > 0 ? Number(field.maxSizeMb) : 10;
    if (Number.isFinite(size) && size > maxMb * 1024 * 1024) {
      return customMsg || `File must be under ${maxMb} MB`;
    }
    return null;
  }

  if (type === 'checkbox' || type === 'switch') {
    if (field.required && !value) return customMsg || `${label} is required`;
    return null;
  }

  if (field.required && trimmed === '') {
    return customMsg || `${label} is required`;
  }
  if (trimmed === '') return null;

  const customRule = v.custom === 'email' || v.custom === 'phone' ? v.custom : null;
  const effectiveType = customRule || type;

  if (effectiveType === 'email' || type === 'email') {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    return ok ? null : customMsg || 'Invalid email';
  }
  if (effectiveType === 'phone' || type === 'phone') {
    const ok = /^[+()\-.\s0-9]{7,20}$/.test(trimmed);
    return ok ? null : customMsg || 'Invalid phone number';
  }
  if (type === 'number') {
    if (str.trim() === '') return null;
    const n = Number(str);
    if (!Number.isFinite(n)) return customMsg || 'Must be a number';
    const min = Number(v.min);
    const max = Number(v.max);
    if (Number.isFinite(min) && n < min) return customMsg || `Must be ≥ ${min}`;
    if (Number.isFinite(max) && n > max) return customMsg || `Must be ≤ ${max}`;
    return null;
  }
  if (type === 'text' || type === 'textarea' || type === 'select' || type === 'radio' || type === 'date') {
    const minLen = Number(v.min);
    const maxLen = Number(v.max);
    if (Number.isFinite(minLen) && trimmed.length < minLen) {
      return customMsg || `Must be at least ${minLen} characters`;
    }
    if (Number.isFinite(maxLen) && trimmed.length > maxLen) {
      return customMsg || `Must be at most ${maxLen} characters`;
    }
  }
  if (typeof v.regex === 'string' && v.regex.trim()) {
    try {
      const re = new RegExp(v.regex);
      if (!re.test(trimmed)) return customMsg || 'Invalid format';
    } catch {
      return 'Invalid validation regex';
    }
  }
  return null;
}

/**
 * @param {Record<string, string>} values
 * @param {Array<{ name: string; label?: string; type?: string; required?: boolean }>} fields
 * @returns {{ ok: boolean; errors: Record<string, string> }}
 */
export function validateFormFields(values, fields) {
  if (!Array.isArray(fields)) {
    return { ok: false, errors: { _form: 'Invalid fields' } };
  }
  const errors = {};
  for (const f of fields) {
    if (!f?.name || f.type === 'hidden') continue;
    const msg = validateFormFieldValue(values?.[f.name], f);
    if (msg) errors[f.name] = msg;
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * Validate only fields visible on current step (+ hidden fields always included in values).
 */
export function validateFormStepFields(values, stepFields) {
  return validateFormFields(values, stepFields);
}
