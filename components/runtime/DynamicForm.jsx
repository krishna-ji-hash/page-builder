'use client';

import { useCallback, useState } from 'react';
import { validateFormFieldValue } from '@/lib/runtime/formValidation';
import { RuntimeLeafProvider } from './RuntimeLeafProvider';
import { useRuntimeData } from './RuntimeProvider';

function normalizeSubmitPath(path) {
  if (typeof path !== 'string' || !path.length) return null;
  if (!path.startsWith('/api/')) return null;
  return path;
}

function coerceWidthPercent(width) {
  if (width == null) return null;
  if (typeof width === 'number' && Number.isFinite(width)) {
    const clamped = Math.max(0, Math.min(100, width));
    return `${clamped}%`;
  }
  if (typeof width !== 'string') return null;
  const s = width.trim();
  if (!s) return null;
  if (s === 'auto') return 'auto';
  if (s.endsWith('%')) {
    const n = Number.parseFloat(s.slice(0, -1));
    if (!Number.isFinite(n)) return null;
    const clamped = Math.max(0, Math.min(100, n));
    return `${clamped}%`;
  }
  return null;
}

/**
 * @param {{ name: string; label?: string; type?: string; required?: boolean; placeholder?: string }[]} fields
 */
function resolveFormLayoutPx(layout, key, legacyKey, fallback) {
  const l = layout && typeof layout === 'object' && !Array.isArray(layout) ? layout : {};
  if (l[key] != null && l[key] !== '') {
    const n = Number(l[key]);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  if (legacyKey && l[legacyKey] != null && l[legacyKey] !== '') {
    const legacy = Number(l[legacyKey]);
    if (Number.isFinite(legacy) && legacy > 0) return legacy;
  }
  return fallback;
}

function formLayoutStyle(layout, style) {
  const base = style && typeof style === 'object' ? { ...style } : {};
  const labelGap = resolveFormLayoutPx(layout, 'labelGapPx', null, 8);
  const inputAfterGap = resolveFormLayoutPx(layout, 'inputAfterGapPx', 'fieldGapPx', 16);
  const beforeSubmitGap = resolveFormLayoutPx(layout, 'beforeSubmitGapPx', null, 20);
  base['--live-form-label-gap'] = `${labelGap}px`;
  base['--live-form-input-after-gap'] = `${inputAfterGap}px`;
  base['--live-form-before-submit-gap'] = `${beforeSubmitGap}px`;
  return base;
}

export default function DynamicForm(props) {
  return (
    <RuntimeLeafProvider>
      <DynamicFormInner {...props} />
    </RuntimeLeafProvider>
  );
}

function DynamicFormInner({
  fields = [],
  submitLabel = 'Submit',
  dataSource,
  style,
  className,
  formId,
  pageId,
  projectId,
  notifications,
  layout = null,
}) {
  const { fetchInternal, bumpRefresh } = useRuntimeData();
  const [values, setValues] = useState(() => ({}));
  const [errors, setErrors] = useState(() => ({}));
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const path =
    dataSource?.kind === 'internal_api' ? normalizeSubmitPath(dataSource.path) : null;
  const method = (dataSource?.method || 'POST').toUpperCase();
  const resolvedSubmitLabel =
    typeof submitLabel === 'string' && submitLabel.trim() ? submitLabel.trim() : 'Submit';

  const handleChange = useCallback((name, v) => {
    setValues((prev) => ({ ...prev, [name]: v }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setStatusKind('');
    const effectivePath = path || (projectId && pageId && formId ? '/api/forms/submit' : null);
    if (!effectivePath) {
      setStatus('No submit target configured');
      setStatusKind('error');
      return;
    }
    if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
      setStatus('Only POST, PUT, or PATCH are allowed for forms');
      setStatusKind('error');
      return;
    }
    const nextErrors = {};
    for (const f of fields || []) {
      if (!f?.name) continue;
      const msg = validateFormFieldValue(values[f.name], f);
      if (msg) nextErrors[f.name] = msg;
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const body = {};
    for (const f of fields || []) {
      if (!f?.name) continue;
      if (f.type === 'number') {
        const n = Number(String(values[f.name] ?? ''));
        body[f.name] = Number.isFinite(n) ? n : null;
      } else {
        body[f.name] = values[f.name] != null ? String(values[f.name]) : '';
      }
    }
    try {
      const payload =
        effectivePath === '/api/forms/submit'
          ? {
              projectId,
              pageId,
              formId,
              values: body,
              fields,
              notifications: notifications && typeof notifications === 'object' ? notifications : null,
            }
          : body;
      const data = await fetchInternal(effectivePath, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setStatus(data?.message || 'Thank you — we received your message.');
      setStatusKind('success');
      setValues({});
      bumpRefresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
      setStatusKind('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!Array.isArray(fields) || !fields.length) {
    return (
      <div className={`live-form live-form--empty ${className || ''}`.trim()} style={style}>
        <p className="live-form__message">Add fields in the builder (props.fields).</p>
      </div>
    );
  }

  const mergedStyle = formLayoutStyle(layout, style);

  return (
    <form
      className={`live-form ${className || ''}`.trim()}
      style={mergedStyle}
      onSubmit={handleSubmit}
      noValidate
    >
      {fields.map((f) => {
        if (!f?.name) return null;
        const id = `live-form-field-${f.name}`;
        const normalizedType = String(f.type || 'text').toLowerCase();
        const type =
          normalizedType === 'email'
            ? 'email'
            : normalizedType === 'number'
              ? 'number'
              : normalizedType === 'date'
                ? 'date'
                : 'text';
        const options = Array.isArray(f.options) ? f.options : [];
        const width = coerceWidthPercent(f.width);
        const fieldStyle =
          width && width !== 'auto'
            ? { flex: `0 0 ${width}`, maxWidth: width }
            : width === 'auto'
              ? { flex: '1 1 180px', maxWidth: '100%' }
              : { flex: '0 0 100%', maxWidth: '100%' };
        return (
          <div key={f.name} className="live-form__field" style={fieldStyle}>
            <label className="live-form__label" htmlFor={id}>
              {f.label || f.name}
              {f.required ? <span className="live-form__req"> *</span> : null}
            </label>
            {normalizedType === 'textarea' ? (
              <textarea
                id={id}
                className="live-form__input"
                name={f.name}
                value={values[f.name] ?? ''}
                onChange={(e) => handleChange(f.name, e.target.value)}
                placeholder={f.placeholder || ''}
                required={!!f.required}
                rows={Number(f.rows || 4)}
              />
            ) : normalizedType === 'select' ? (
              <select
                id={id}
                className="live-form__input"
                name={f.name}
                value={values[f.name] ?? ''}
                onChange={(e) => handleChange(f.name, e.target.value)}
                required={!!f.required}
              >
                <option value="">{f.placeholder || 'Select option'}</option>
                {options.map((opt) => {
                  const value = typeof opt === 'string' ? opt : String(opt?.value || '');
                  const label = typeof opt === 'string' ? opt : String(opt?.label || value);
                  return (
                    <option key={`${f.name}-${value}`} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            ) : normalizedType === 'checkbox' || normalizedType === 'switch' ? (
              <label className="live-form__toggle">
                <input
                  type="checkbox"
                  name={f.name}
                  checked={Boolean(values[f.name])}
                  onChange={(e) => handleChange(f.name, e.target.checked)}
                  required={!!f.required}
                />
                <span>{f.placeholder || ''}</span>
              </label>
            ) : normalizedType === 'radio' ? (
              <div className="live-form__radio">
                {options.map((opt, i) => {
                  const value = typeof opt === 'string' ? opt : String(opt?.value || '');
                  const label = typeof opt === 'string' ? opt : String(opt?.label || value);
                  const rid = `${id}-${i}`;
                  return (
                    <label key={rid} className="live-form__radioOpt" htmlFor={rid}>
                      <input
                        id={rid}
                        type="radio"
                        name={f.name}
                        value={value}
                        checked={String(values[f.name] ?? '') === value}
                        onChange={(e) => handleChange(f.name, e.target.value)}
                        required={!!f.required}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <input
                id={id}
                className="live-form__input"
                type={type}
                name={f.name}
                value={values[f.name] ?? ''}
                onChange={(e) => handleChange(f.name, e.target.value)}
                placeholder={f.placeholder || ''}
                required={!!f.required}
              />
            )}
            {errors[f.name] ? <p className="live-form__error">{errors[f.name]}</p> : null}
          </div>
        );
      })}
      {status ? (
        <p
          className={
            statusKind === 'success' ? 'live-form__status live-form__status--ok' : 'live-form__status'
          }
          role="status"
        >
          {status}
        </p>
      ) : null}
      <div className="live-form__actions">
        <button type="submit" className="live-form__submit" disabled={submitting || !path}>
          {submitting ? 'Submitting…' : resolvedSubmitLabel}
        </button>
      </div>
    </form>
  );
}
