'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeFormConfig, visibleSteps, fieldsForStep, hiddenFields } from '@/lib/formBuilderSchema.js';
import { mergeWorkflowIntoSubmitBody, resolveClientWorkflowOutcome } from '@/lib/formWorkflowEngine.js';
import { trackFormEvent } from '@/lib/formAnalyticsClient.js';
import { validateFormStepFields } from '@/lib/runtime/formValidation';
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
    return `${Math.max(0, Math.min(100, n))}%`;
  }
  return null;
}

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
  base['--live-form-label-gap'] = `${resolveFormLayoutPx(layout, 'labelGapPx', null, 8)}px`;
  base['--live-form-input-after-gap'] = `${resolveFormLayoutPx(layout, 'inputAfterGapPx', 'fieldGapPx', 16)}px`;
  base['--live-form-before-submit-gap'] = `${resolveFormLayoutPx(layout, 'beforeSubmitGapPx', null, 20)}px`;
  return base;
}

function buildSubmitBody(fields, values) {
  const body = {};
  for (const f of fields || []) {
    if (!f?.name) continue;
    if (f.type === 'hidden') {
      body[f.name] = f.defaultValue != null ? String(f.defaultValue) : String(values[f.name] ?? '');
      continue;
    }
    if (f.type === 'number') {
      const n = Number(String(values[f.name] ?? ''));
      body[f.name] = Number.isFinite(n) ? n : null;
    } else if (f.type === 'file') {
      const v = values[f.name];
      body[f.name] =
        v && typeof v === 'object'
          ? { name: v.name, size: v.size, type: v.type }
          : null;
    } else if (f.type === 'checkbox' || f.type === 'switch') {
      body[f.name] = Boolean(values[f.name]);
    } else {
      body[f.name] = values[f.name] != null ? String(values[f.name]) : '';
    }
  }
  return body;
}

function FieldControl({ field, value, error, onChange, previewErrors }) {
  const id = `live-form-field-${field.name}`;
  const normalizedType = String(field.type || 'text').toLowerCase();
  const options = Array.isArray(field.options) ? field.options : [];
  const width = coerceWidthPercent(field.width);
  const fieldStyle =
    width && width !== 'auto'
      ? { flex: `0 0 ${width}`, maxWidth: width }
      : width === 'auto'
        ? { flex: '1 1 180px', maxWidth: '100%' }
        : { flex: '0 0 100%', maxWidth: '100%' };
  const err = previewErrors?.[field.name] || error;

  if (normalizedType === 'hidden') return null;

  return (
    <div className="live-form__field" style={fieldStyle}>
      {normalizedType !== 'checkbox' && normalizedType !== 'switch' ? (
        <label className="live-form__label" htmlFor={id}>
          {field.label || field.name}
          {field.required ? <span className="live-form__req"> *</span> : null}
        </label>
      ) : null}
      {normalizedType === 'textarea' ? (
        <textarea
          id={id}
          className="live-form__input"
          name={field.name}
          value={value ?? ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder || ''}
          rows={Number(field.rows || 4)}
        />
      ) : normalizedType === 'select' ? (
        <select
          id={id}
          className="live-form__input"
          name={field.name}
          value={value ?? ''}
          onChange={(e) => onChange(field.name, e.target.value)}
        >
          <option value="">{field.placeholder || 'Select option'}</option>
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : String(opt?.value || '');
            const label = typeof opt === 'string' ? opt : String(opt?.label || val);
            return (
              <option key={`${field.name}-${val}`} value={val}>
                {label}
              </option>
            );
          })}
        </select>
      ) : normalizedType === 'checkbox' || normalizedType === 'switch' ? (
        <label className="live-form__toggle">
          <input
            type="checkbox"
            name={field.name}
            checked={Boolean(value)}
            onChange={(e) => onChange(field.name, e.target.checked)}
          />
          <span>
            {field.label || field.name}
            {field.required ? <span className="live-form__req"> *</span> : null}
          </span>
        </label>
      ) : normalizedType === 'radio' ? (
        <div className="live-form__radio">
          {options.map((opt, i) => {
            const val = typeof opt === 'string' ? opt : String(opt?.value || '');
            const label = typeof opt === 'string' ? opt : String(opt?.label || val);
            const rid = `${id}-${i}`;
            return (
              <label key={rid} className="live-form__radioOpt" htmlFor={rid}>
                <input
                  id={rid}
                  type="radio"
                  name={field.name}
                  value={val}
                  checked={String(value ?? '') === val}
                  onChange={(e) => onChange(field.name, e.target.value)}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      ) : normalizedType === 'file' ? (
        <input
          id={id}
          className="live-form__input"
          type="file"
          name={field.name}
          accept={field.accept || undefined}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              onChange(field.name, null);
              return;
            }
            onChange(field.name, { name: file.name, size: file.size, type: file.type });
          }}
        />
      ) : (
        <input
          id={id}
          className="live-form__input"
          type={
            normalizedType === 'email'
              ? 'email'
              : normalizedType === 'number'
                ? 'number'
                : normalizedType === 'date'
                  ? 'date'
                  : normalizedType === 'phone'
                    ? 'tel'
                    : 'text'
          }
          name={field.name}
          value={value ?? ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder || ''}
        />
      )}
      {err ? <p className="live-form__error">{err}</p> : null}
    </div>
  );
}

export default function DynamicForm(props) {
  return (
    <RuntimeLeafProvider>
      <DynamicFormInner {...props} />
    </RuntimeLeafProvider>
  );
}

function DynamicFormInner({
  fields: fieldsProp,
  steps: stepsProp,
  workflow: workflowProp,
  states: statesProp,
  analytics: analyticsProp,
  submitLabel: submitLabelProp,
  dataSource,
  style,
  className,
  formId,
  pageId,
  projectId,
  notifications,
  layout = null,
  previewMode = null,
  builderPreview = false,
}) {
  const config = useMemo(
    () =>
      normalizeFormConfig({
        fields: fieldsProp,
        steps: stepsProp,
        workflow: workflowProp,
        states: statesProp,
        analytics: analyticsProp,
        submitLabel: submitLabelProp,
        notifications,
        layout,
      }),
    [fieldsProp, stepsProp, workflowProp, statesProp, analyticsProp, submitLabelProp, notifications, layout]
  );

  const { fetchInternal, bumpRefresh } = useRuntimeData();
  const [values, setValues] = useState(() => {
    const init = {};
    for (const h of hiddenFields(config.fields)) {
      if (h.name) init[h.name] = h.defaultValue ?? '';
    }
    return init;
  });
  const [errors, setErrors] = useState(() => ({}));
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [started, setStarted] = useState(false);

  const path = dataSource?.kind === 'internal_api' ? normalizeSubmitPath(dataSource.path) : null;
  const method = (dataSource?.method || 'POST').toUpperCase();
  const resolvedSubmitLabel = config.submitLabel;

  const activeSteps = useMemo(() => visibleSteps(config.steps, values), [config.steps, values]);
  const multiStep = config.multiStep && activeSteps.length > 1;
  const currentStep = multiStep ? activeSteps[stepIndex] : null;
  const allNames = config.fields.map((f) => f.name).filter(Boolean);
  const visibleFields = multiStep
    ? fieldsForStep(config.fields, currentStep, allNames)
    : config.fields.filter((f) => f.type !== 'hidden');

  const previewErrors = useMemo(() => {
    if (previewMode !== 'validation') return null;
    const out = {};
    for (const f of visibleFields) {
      if (f.required) out[f.name] = `${f.label || f.name} is required (preview)`;
    }
    return out;
  }, [previewMode, visibleFields]);

  useEffect(() => {
    if (builderPreview) return;
    trackFormEvent({
      projectId,
      pageId,
      formId,
      event: 'view',
      enabled: config.analytics.enabled,
    });
  }, [builderPreview, projectId, pageId, formId, config.analytics.enabled]);

  const markStarted = useCallback(() => {
    if (started) return;
    setStarted(true);
    if (builderPreview) return;
    trackFormEvent({
      projectId,
      pageId,
      formId,
      event: 'start',
      enabled: config.analytics.enabled,
    });
  }, [started, builderPreview, projectId, pageId, formId, config.analytics.enabled]);

  const handleChange = useCallback(
    (name, v) => {
      markStarted();
      setValues((prev) => ({ ...prev, [name]: v }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    },
    [markStarted]
  );

  const validateCurrent = useCallback(() => {
    const stepFields = multiStep ? visibleFields : config.fields.filter((f) => f.type !== 'hidden');
    return validateFormStepFields(values, stepFields);
  }, [multiStep, visibleFields, config.fields, values]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (previewMode) return;
    setStatus('');
    setStatusKind('');

    const v = validateCurrent();
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }

    if (multiStep && stepIndex < activeSteps.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }

    const effectivePath = path || (projectId && pageId && formId ? '/api/forms/submit' : null);
    if (!effectivePath) {
      setStatus(config.states.error.message);
      setStatusKind('error');
      return;
    }

    setErrors({});
    setSubmitting(true);
    const bodyValues = buildSubmitBody(config.fields, values);

    try {
      const basePayload =
        effectivePath === '/api/forms/submit'
          ? mergeWorkflowIntoSubmitBody(
              {
                projectId,
                pageId,
                formId,
                values: bodyValues,
                fields: config.fields,
              },
              config.workflow
            )
          : bodyValues;

      const data = await fetchInternal(effectivePath, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basePayload),
      });

      const outcome = resolveClientWorkflowOutcome(config.workflow, config.states, data);
      if (outcome.kind === 'redirect' && outcome.redirectUrl && typeof window !== 'undefined') {
        window.location.href = outcome.redirectUrl;
        return;
      }
      setStatus(outcome.message);
      setStatusKind('success');
      setValues(() => {
        const init = {};
        for (const h of hiddenFields(config.fields)) {
          if (h.name) init[h.name] = h.defaultValue ?? '';
        }
        return init;
      });
      setStepIndex(0);
      bumpRefresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : config.states.error.message);
      setStatusKind('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (previewMode === 'success') {
    return (
      <div className={`live-form live-form--state ${className || ''}`.trim()} style={style}>
        <h3 className="live-form__state-title">{config.states.success.title}</h3>
        <p className="live-form__status live-form__status--ok">{config.states.success.message}</p>
      </div>
    );
  }

  if (previewMode === 'error') {
    return (
      <div className={`live-form live-form--state ${className || ''}`.trim()} style={style}>
        <h3 className="live-form__state-title">{config.states.error.title}</h3>
        <p className="live-form__status">{config.states.error.message}</p>
      </div>
    );
  }

  if (!config.fields.length) {
    return (
      <div className={`live-form live-form--empty ${className || ''}`.trim()} style={style}>
        <p className="live-form__message">Add fields in the builder (Form tab).</p>
      </div>
    );
  }

  const mergedStyle = formLayoutStyle(config.layout, style);
  const progressPct = multiStep
    ? Math.round(((stepIndex + 1) / activeSteps.length) * 100)
    : 100;

  return (
    <form
      className={`live-form ${multiStep ? 'live-form--multistep' : ''} ${className || ''}`.trim()}
      style={mergedStyle}
      onSubmit={handleSubmit}
      noValidate
    >
      {multiStep ? (
        <div className="live-form__progress" aria-hidden>
          <div className="live-form__progress-bar" style={{ width: `${progressPct}%` }} />
          <span className="live-form__progress-label">
            Step {stepIndex + 1} of {activeSteps.length}
            {currentStep?.title ? ` — ${currentStep.title}` : ''}
          </span>
        </div>
      ) : null}

      {visibleFields.map((f) => (
        <FieldControl
          key={f.name}
          field={f}
          value={values[f.name]}
          error={errors[f.name]}
          previewErrors={previewErrors}
          onChange={handleChange}
        />
      ))}

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
        {multiStep && stepIndex > 0 ? (
          <button
            type="button"
            className="live-form__btn live-form__btn--secondary"
            disabled={submitting}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </button>
        ) : null}
        <button
          type="submit"
          className="live-form__submit"
          disabled={submitting || (!path && !(projectId && pageId && formId))}
        >
          {submitting
            ? 'Submitting…'
            : multiStep && stepIndex < activeSteps.length - 1
              ? 'Next'
              : resolvedSubmitLabel}
        </button>
      </div>
    </form>
  );
}
