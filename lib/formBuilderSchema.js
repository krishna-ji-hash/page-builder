/**
 * Form widget config on `node.props` (fields, steps, workflow, states, analytics).
 * Stored in props_json — no renderTree changes.
 */

export const FORM_FIELD_TYPES = [
  'text',
  'email',
  'phone',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'date',
  'number',
  'file',
  'hidden',
];

export const WORKFLOW_ACTION_TYPES = [
  'save_lead',
  'email',
  'webhook',
  'crm_tag',
  'notification',
  'redirect',
  'success_message',
];

const FIELD_TYPE_SET = new Set(FORM_FIELD_TYPES);

function isPlainObject(v) {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v));
}

function safeId(v, fallback = 'field') {
  const s = String(v || '').trim().replace(/[^a-z0-9_-]/gi, '-').slice(0, 64);
  return s || fallback;
}

function safeName(v, fallback = 'field') {
  const s = String(v || '')
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .slice(0, 64);
  return s || fallback;
}

/**
 * @param {unknown} field
 * @param {number} index
 */
export function normalizeFormField(field, index = 0) {
  if (!isPlainObject(field)) return null;
  const typeRaw = String(field.type || 'text').toLowerCase();
  const type = FIELD_TYPE_SET.has(typeRaw) ? typeRaw : 'text';
  const name = safeName(field.name, `field_${index + 1}`);
  const out = {
    id: safeId(field.id, name),
    name,
    label: String(field.label || name).trim().slice(0, 120) || name,
    type,
    placeholder: String(field.placeholder || '').slice(0, 200),
    required: Boolean(field.required),
    width: String(field.width || '100%').slice(0, 16),
    validation: normalizeFieldValidation(field.validation),
  };
  if (type === 'textarea') {
    const rows = Number(field.rows);
    out.rows = Number.isFinite(rows) && rows > 0 ? Math.min(20, Math.floor(rows)) : 4;
  }
  if (type === 'select' || type === 'radio') {
    out.options = normalizeOptions(field.options);
  }
  if (type === 'checkbox' || type === 'switch') {
    out.checkedByDefault = Boolean(field.checkedByDefault || field.onByDefault);
  }
  if (type === 'radio' && field.defaultValue != null) {
    out.defaultValue = String(field.defaultValue).slice(0, 120);
  }
  if (type === 'hidden') {
    out.defaultValue = field.defaultValue != null ? String(field.defaultValue).slice(0, 500) : '';
  }
  if (type === 'file') {
    out.accept = String(field.accept || '').slice(0, 120);
    const maxMb = Number(field.maxSizeMb);
    out.maxSizeMb = Number.isFinite(maxMb) && maxMb > 0 ? Math.min(25, maxMb) : 10;
  }
  if (field.stepId) out.stepId = safeId(field.stepId, 'step');
  return out;
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options
    .slice(0, 50)
    .map((opt) => {
      if (typeof opt === 'string') {
        const v = opt.trim().slice(0, 120);
        return v ? { label: v, value: v } : null;
      }
      if (!isPlainObject(opt)) return null;
      const value = String(opt.value ?? opt.label ?? '').trim().slice(0, 120);
      if (!value) return null;
      return { label: String(opt.label || value).slice(0, 120), value };
    })
    .filter(Boolean);
}

function normalizeFieldValidation(v) {
  if (!isPlainObject(v)) return {};
  const out = {};
  if (v.min != null && v.min !== '') out.min = v.min;
  if (v.max != null && v.max !== '') out.max = v.max;
  if (typeof v.regex === 'string' && v.regex.trim()) out.regex = v.regex.trim().slice(0, 200);
  if (typeof v.message === 'string' && v.message.trim()) out.message = v.message.trim().slice(0, 200);
  if (v.custom === 'email' || v.custom === 'phone') out.custom = v.custom;
  return out;
}

/**
 * @param {unknown} steps
 * @param {object[]} fields
 */
export function normalizeFormSteps(steps, fields = []) {
  if (!Array.isArray(steps) || !steps.length) return [];
  const fieldNames = new Set((fields || []).map((f) => f?.name).filter(Boolean));
  return steps
    .slice(0, 12)
    .map((step, i) => {
      if (!isPlainObject(step)) return null;
      const id = safeId(step.id, `step-${i + 1}`);
      const names = Array.isArray(step.fieldNames)
        ? step.fieldNames.map((n) => String(n).trim()).filter((n) => fieldNames.has(n))
        : [];
      const out = {
        id,
        title: String(step.title || `Step ${i + 1}`).slice(0, 80),
        fieldNames: names.length ? names : [...fieldNames],
      };
      if (isPlainObject(step.showWhen)) {
        out.showWhen = {
          field: safeName(step.showWhen.field, ''),
          operator: ['equals', 'notEquals', 'notEmpty', 'empty'].includes(step.showWhen.operator)
            ? step.showWhen.operator
            : 'notEmpty',
          value: step.showWhen.value != null ? String(step.showWhen.value) : '',
        };
      }
      return out;
    })
    .filter(Boolean);
}

export function evaluateStepCondition(showWhen, values = {}) {
  if (!showWhen || typeof showWhen !== 'object') return true;
  const field = String(showWhen.field || '').trim();
  if (!field) return true;
  const raw = values[field];
  const str = raw === null || raw === undefined ? '' : String(raw).trim();
  const op = showWhen.operator || 'notEmpty';
  const expected = showWhen.value != null ? String(showWhen.value) : '';
  if (op === 'empty') return str === '';
  if (op === 'notEmpty') return str !== '';
  if (op === 'equals') return str === expected;
  if (op === 'notEquals') return str !== expected;
  return true;
}

export function visibleSteps(steps, values) {
  const list = Array.isArray(steps) ? steps : [];
  return list.filter((s) => evaluateStepCondition(s.showWhen, values));
}

export function fieldsForStep(fields, step, allFieldNames) {
  const names = Array.isArray(step?.fieldNames) && step.fieldNames.length ? step.fieldNames : allFieldNames;
  const set = new Set(names);
  return (fields || []).filter((f) => f?.name && set.has(f.name) && f.type !== 'hidden');
}

export function hiddenFields(fields) {
  return (fields || []).filter((f) => f?.type === 'hidden');
}

/**
 * @param {unknown} workflow
 * @param {object} [legacyNotifications]
 */
export function normalizeFormWorkflow(workflow, legacyNotifications) {
  const src = isPlainObject(workflow) ? workflow : {};
  let actions = Array.isArray(src.onSubmit) ? src.onSubmit : [];
  if (!actions.length && legacyNotifications && typeof legacyNotifications === 'object') {
    actions = [
      { type: 'save_lead', enabled: true },
      legacyNotifications.webhookUrl
        ? { type: 'webhook', enabled: true, url: String(legacyNotifications.webhookUrl || '') }
        : null,
      legacyNotifications.emailTo
        ? { type: 'email', enabled: true, to: String(legacyNotifications.emailTo || '') }
        : null,
      { type: 'success_message', enabled: true, message: 'Thank you — we received your message.' },
    ].filter(Boolean);
  }
  if (!actions.length) {
    actions = [
      { type: 'save_lead', enabled: true },
      { type: 'success_message', enabled: true, message: 'Thank you — we received your message.' },
    ];
  }
  const onSubmit = actions
    .map((a) => normalizeWorkflowAction(a))
    .filter(Boolean);
  if (!onSubmit.some((a) => a.type === 'save_lead')) {
    onSubmit.unshift({ type: 'save_lead', enabled: true });
  }
  return { onSubmit };
}

export function normalizeWorkflowAction(action) {
  if (!isPlainObject(action)) return null;
  const type = String(action.type || '').trim();
  if (!WORKFLOW_ACTION_TYPES.includes(type)) return null;
  const enabled = action.enabled !== false;
  const out = { type, enabled };
  if (type === 'email') out.to = String(action.to || '').slice(0, 200);
  if (type === 'webhook') out.url = String(action.url || action.webhookUrl || '').slice(0, 300);
  if (type === 'crm_tag') out.tag = String(action.tag || '').slice(0, 64);
  if (type === 'notification') out.message = String(action.message || '').slice(0, 300);
  if (type === 'redirect') out.url = String(action.url || '').slice(0, 500);
  if (type === 'success_message') out.message = String(action.message || '').slice(0, 500);
  return out;
}

export function normalizeFormStates(states) {
  const src = isPlainObject(states) ? states : {};
  return {
    success: {
      title: String(src.success?.title || 'Thank you').slice(0, 120),
      message: String(
        src.success?.message || 'We received your submission and will be in touch soon.'
      ).slice(0, 500),
    },
    error: {
      title: String(src.error?.title || 'Something went wrong').slice(0, 120),
      message: String(src.error?.message || 'Please try again or contact support.').slice(0, 500),
    },
  };
}

export function normalizeFormAnalytics(analytics) {
  const src = isPlainObject(analytics) ? analytics : {};
  return {
    enabled: analytics == null ? true : src.enabled !== false,
  };
}

/**
 * Normalize full form props fragment for runtime + inspector.
 * @param {object} props — node.props
 */
export function normalizeFormConfig(props = {}) {
  const p = isPlainObject(props) ? props : {};
  const fields = (Array.isArray(p.fields) ? p.fields : [])
    .map((f, i) => normalizeFormField(f, i))
    .filter(Boolean);
  const steps = normalizeFormSteps(p.steps, fields);
  const workflow = normalizeFormWorkflow(p.workflow, p.notifications);
  const states = normalizeFormStates(p.states);
  const analytics = normalizeFormAnalytics(p.analytics);
  const layout = isPlainObject(p.layout) ? p.layout : {};
  const submitLabel = String(p.submitLabel || 'Submit').trim().slice(0, 80) || 'Submit';
  const multiStep = steps.length > 1;
  return {
    fields,
    steps,
    multiStep,
    workflow,
    states,
    analytics,
    layout,
    submitLabel,
    notifications: isPlainObject(p.notifications) ? p.notifications : {},
  };
}

export function defaultWorkflowAction(type) {
  switch (type) {
    case 'save_lead':
      return { type: 'save_lead', enabled: true };
    case 'email':
      return { type: 'email', enabled: true, to: '' };
    case 'webhook':
      return { type: 'webhook', enabled: true, url: '' };
    case 'crm_tag':
      return { type: 'crm_tag', enabled: true, tag: 'lead' };
    case 'notification':
      return { type: 'notification', enabled: true, message: 'New form submission' };
    case 'redirect':
      return { type: 'redirect', enabled: false, url: '' };
    case 'success_message':
      return { type: 'success_message', enabled: true, message: 'Thank you — we received your message.' };
    default:
      return null;
  }
}
