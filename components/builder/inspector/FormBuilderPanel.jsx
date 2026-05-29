'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { InspectorField, InspectorPanel, InspectorSection } from './InspectorUi';
import FormLeadsPanel from './FormLeadsPanel';
import {
  WORKFLOW_ACTION_TYPES,
  defaultWorkflowAction,
  normalizeFormConfig,
  normalizeFormField,
  normalizeFormWorkflow,
} from '@/lib/formBuilderSchema.js';
import { FORM_FIELD_TYPES } from '@/lib/formBuilderSchema.js';

const WORKFLOW_LABELS = {
  save_lead: 'Save lead (CRM)',
  email: 'Send email',
  webhook: 'Send webhook',
  crm_tag: 'CRM tag',
  notification: 'Notification',
  redirect: 'Redirect',
  success_message: 'Success message',
};

export default function FormBuilderPanel({
  selectedNode,
  form,
  onChange,
  disabled,
  pageId,
  projectId,
  previewMode,
  onPreviewModeChange,
  jsonErrors,
}) {
  const config = useMemo(
    () => normalizeFormConfig(selectedNode?.props || {}),
    [selectedNode?.props]
  );
  const [analytics, setAnalytics] = useState(null);

  const loadAnalytics = useCallback(async () => {
    const pj = Number(projectId);
    const fid = selectedNode?.id != null ? String(selectedNode.id) : '';
    if (!Number.isInteger(pj) || pj <= 0 || !fid) return;
    try {
      const res = await fetch(
        `/api/forms/analytics?projectId=${pj}&formNodeId=${encodeURIComponent(fid)}&pageId=${pageId || ''}`
      );
      const json = await res.json();
      setAnalytics(json?.summary || json?.data?.summary || null);
    } catch {
      setAnalytics(null);
    }
  }, [projectId, pageId, selectedNode?.id]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const patchProps = (patch) => onChange?.('formPatchProps', patch);

  const workflow = normalizeFormWorkflow(config.workflow, config.notifications);
  const actions = workflow.onSubmit || [];

  const setWorkflowActions = (nextActions) => {
    patchProps({ workflow: { onSubmit: nextActions } });
  };

  const toggleAction = (type, enabled) => {
    let list = [...actions];
    const idx = list.findIndex((a) => a.type === type);
    if (idx >= 0) {
      list[idx] = { ...list[idx], enabled };
    } else if (enabled) {
      const def = defaultWorkflowAction(type);
      if (def) list.push({ ...def, enabled: true });
    }
    setWorkflowActions(list);
  };

  const patchAction = (type, patch) => {
    const list = actions.map((a) => (a.type === type ? { ...a, ...patch } : a));
    if (!list.some((a) => a.type === type)) {
      const def = defaultWorkflowAction(type);
      if (def) list.push({ ...def, ...patch });
    }
    setWorkflowActions(list);
  };

  return (
    <InspectorPanel title="Form builder">
      <FormLeadsPanel
        pageId={pageId}
        projectId={projectId}
        formNodeId={selectedNode?.id}
        fields={config.fields}
      />

      <InspectorSection title="Preview states" defaultOpen keywords="preview validation success error">
        <div className="bld-tiny-toggle" style={{ marginBottom: 8 }}>
          {[
            { id: '', label: 'Live' },
            { id: 'validation', label: 'Validation' },
            { id: 'success', label: 'Success' },
            { id: 'error', label: 'Error' },
          ].map((opt) => (
            <button
              key={opt.id || 'live'}
              type="button"
              className={`bld-tiny-toggle__btn ${(previewMode || '') === opt.id ? 'is-active' : ''}`}
              disabled={disabled}
              onClick={() => onPreviewModeChange?.(opt.id || null)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="bld-field-note" style={{ margin: 0 }}>
          Canvas preview mirrors live form states without submitting.
        </p>
      </InspectorSection>

      <InspectorSection title="Analytics" keywords="views conversion">
        {analytics ? (
          <ul className="bld-field-note" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Views: {analytics.views ?? 0}</li>
            <li>Starts: {analytics.starts ?? 0}</li>
            <li>Submissions: {analytics.submissions ?? 0}</li>
            <li>Conversion: {analytics.conversionRate ?? 0}%</li>
          </ul>
        ) : (
          <p className="bld-field-note">No analytics yet.</p>
        )}
        <label className="bld-checkbox-row" style={{ marginTop: 8 }}>
          <input
            type="checkbox"
            checked={config.analytics.enabled !== false}
            disabled={disabled}
            onChange={(e) => patchProps({ analytics: { enabled: e.target.checked } })}
          />
          <span>Track views, starts, and submissions</span>
        </label>
        <button type="button" className="bld-chip" style={{ marginTop: 8 }} onClick={loadAnalytics}>
          Refresh stats
        </button>
      </InspectorSection>

      <InspectorSection title="Fields" defaultOpen keywords="text email phone">
        <div className="bld-field" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" className="bld-btn" disabled={disabled} onClick={() => onChange?.('formAddField')}>
            + Add field
          </button>
        </div>
        {config.fields.map((f, idx) => (
          <details key={f.id || f.name} className="bld-form-editor__field" open={idx === 0}>
            <summary>
              {f.label} <span className="bld-form-editor__meta">{f.type}</span>
            </summary>
            <div className="bld-form-editor__grid">
              <InspectorField label="Name">
                <input
                  className="bld-input"
                  value={f.name}
                  disabled={disabled}
                  onChange={(e) => onChange?.('formPatchField', { index: idx, patch: { name: e.target.value } })}
                />
              </InspectorField>
              <InspectorField label="Label">
                <input
                  className="bld-input"
                  value={f.label}
                  disabled={disabled}
                  onChange={(e) => onChange?.('formPatchField', { index: idx, patch: { label: e.target.value } })}
                />
              </InspectorField>
              <InspectorField label="Type">
                <select
                  className="bld-input"
                  value={f.type}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange?.('formPatchField', { index: idx, patch: { type: e.target.value } })
                  }
                >
                  {FORM_FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </InspectorField>
              <InspectorField label="Required">
                <input
                  type="checkbox"
                  checked={f.required}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange?.('formPatchField', { index: idx, patch: { required: e.target.checked } })
                  }
                />
              </InspectorField>
              {f.type === 'hidden' ? (
                <InspectorField label="Default value">
                  <input
                    className="bld-input"
                    value={f.defaultValue ?? ''}
                    disabled={disabled}
                    onChange={(e) =>
                      onChange?.('formPatchField', { index: idx, patch: { defaultValue: e.target.value } })
                    }
                  />
                </InspectorField>
              ) : null}
              {f.type === 'file' ? (
                <InspectorField label="Max size (MB)">
                  <input
                    className="bld-input"
                    type="number"
                    min={1}
                    max={25}
                    value={f.maxSizeMb ?? 10}
                    disabled={disabled}
                    onChange={(e) =>
                      onChange?.('formPatchField', {
                        index: idx,
                        patch: { maxSizeMb: Number(e.target.value) },
                      })
                    }
                  />
                </InspectorField>
              ) : null}
              <details style={{ gridColumn: '1 / -1' }}>
                <summary>Validation</summary>
                <div className="bld-form-validation">
                  <InspectorField label="Min">
                    <input
                      className="bld-input"
                      value={f.validation?.min ?? ''}
                      onChange={(e) =>
                        onChange?.('formPatchField', {
                          index: idx,
                          patch: { validation: { ...(f.validation || {}), min: e.target.value } },
                        })
                      }
                    />
                  </InspectorField>
                  <InspectorField label="Max">
                    <input
                      className="bld-input"
                      value={f.validation?.max ?? ''}
                      onChange={(e) =>
                        onChange?.('formPatchField', {
                          index: idx,
                          patch: { validation: { ...(f.validation || {}), max: e.target.value } },
                        })
                      }
                    />
                  </InspectorField>
                  <InspectorField label="Regex">
                    <input
                      className="bld-input"
                      value={f.validation?.regex ?? ''}
                      onChange={(e) =>
                        onChange?.('formPatchField', {
                          index: idx,
                          patch: { validation: { ...(f.validation || {}), regex: e.target.value } },
                        })
                      }
                    />
                  </InspectorField>
                  <InspectorField label="Custom rule">
                    <select
                      className="bld-input"
                      value={f.validation?.custom ?? ''}
                      onChange={(e) =>
                        onChange?.('formPatchField', {
                          index: idx,
                          patch: {
                            validation: {
                              ...(f.validation || {}),
                              custom: e.target.value || undefined,
                            },
                          },
                        })
                      }
                    >
                      <option value="">None</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                    </select>
                  </InspectorField>
                  <InspectorField label="Error message">
                    <input
                      className="bld-input"
                      value={f.validation?.message ?? ''}
                      onChange={(e) =>
                        onChange?.('formPatchField', {
                          index: idx,
                          patch: { validation: { ...(f.validation || {}), message: e.target.value } },
                        })
                      }
                    />
                  </InspectorField>
                </div>
              </details>
              <button
                type="button"
                className="bld-chip"
                disabled={disabled}
                onClick={() => onChange?.('formRemoveField', idx)}
              >
                Remove field
              </button>
            </div>
          </details>
        ))}
      </InspectorSection>

      <InspectorSection title="Multi-step" keywords="steps progress">
        <label className="bld-checkbox-row">
          <input
            type="checkbox"
            checked={config.steps.length > 0}
            disabled={disabled}
            onChange={(e) => {
              if (!e.target.checked) {
                patchProps({ steps: [] });
                return;
              }
              const names = config.fields.map((f) => f.name).filter((n) => n);
              patchProps({
                steps: [
                  { id: 'step-1', title: 'Step 1', fieldNames: names },
                  { id: 'step-2', title: 'Step 2', fieldNames: [] },
                ],
              });
            }}
          />
          <span>Enable multi-step form</span>
        </label>
        {config.steps.map((step, si) => (
          <div key={step.id} className="bld-field" style={{ marginTop: 10 }}>
            <InspectorField label={`Step ${si + 1} title`}>
              <input
                className="bld-input"
                value={step.title}
                disabled={disabled}
                onChange={(e) => {
                  const steps = config.steps.map((s, i) =>
                    i === si ? { ...s, title: e.target.value } : s
                  );
                  patchProps({ steps });
                }}
              />
            </InspectorField>
            <InspectorField label="Fields (comma-separated names)">
              <input
                className="bld-input"
                value={(step.fieldNames || []).join(', ')}
                disabled={disabled}
                onChange={(e) => {
                  const fieldNames = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const steps = config.steps.map((s, i) => (i === si ? { ...s, fieldNames } : s));
                  patchProps({ steps });
                }}
              />
            </InspectorField>
            <InspectorField label="Show when field">
              <input
                className="bld-input"
                placeholder="field name"
                value={step.showWhen?.field ?? ''}
                disabled={disabled}
                onChange={(e) => {
                  const steps = config.steps.map((s, i) =>
                    i === si
                      ? {
                          ...s,
                          showWhen: e.target.value
                            ? { field: e.target.value, operator: 'notEmpty' }
                            : undefined,
                        }
                      : s
                  );
                  patchProps({ steps });
                }}
              />
            </InspectorField>
          </div>
        ))}
      </InspectorSection>

      <InspectorSection title="Workflow" defaultOpen keywords="webhook email redirect">
        {WORKFLOW_ACTION_TYPES.map((type) => {
          const action = actions.find((a) => a.type === type) || defaultWorkflowAction(type);
          const enabled = action?.enabled !== false;
          return (
            <div key={type} className="bld-field" style={{ marginBottom: 10 }}>
              <label className="bld-checkbox-row">
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={disabled || type === 'save_lead'}
                  onChange={(e) => toggleAction(type, e.target.checked)}
                />
                <span>{WORKFLOW_LABELS[type] || type}</span>
              </label>
              {enabled && type === 'webhook' ? (
                <input
                  className="bld-input"
                  placeholder="https://..."
                  value={action?.url || action?.webhookUrl || ''}
                  disabled={disabled}
                  onChange={(e) => patchAction('webhook', { url: e.target.value })}
                />
              ) : null}
              {enabled && type === 'email' ? (
                <input
                  className="bld-input"
                  placeholder="email@domain.com"
                  value={action?.to || ''}
                  disabled={disabled}
                  onChange={(e) => patchAction('email', { to: e.target.value })}
                />
              ) : null}
              {enabled && type === 'crm_tag' ? (
                <input
                  className="bld-input"
                  placeholder="lead"
                  value={action?.tag || ''}
                  disabled={disabled}
                  onChange={(e) => patchAction('crm_tag', { tag: e.target.value })}
                />
              ) : null}
              {enabled && type === 'redirect' ? (
                <input
                  className="bld-input"
                  placeholder="/thank-you"
                  value={action?.url || ''}
                  disabled={disabled}
                  onChange={(e) => patchAction('redirect', { url: e.target.value })}
                />
              ) : null}
              {enabled && type === 'success_message' ? (
                <input
                  className="bld-input"
                  value={action?.message || ''}
                  disabled={disabled}
                  onChange={(e) => patchAction('success_message', { message: e.target.value })}
                />
              ) : null}
            </div>
          );
        })}
      </InspectorSection>

      <InspectorSection title="Success & error states" keywords="messages">
        <InspectorField label="Success title">
          <input
            className="bld-input"
            value={config.states.success.title}
            disabled={disabled}
            onChange={(e) =>
              patchProps({
                states: { ...config.states, success: { ...config.states.success, title: e.target.value } },
              })
            }
          />
        </InspectorField>
        <InspectorField label="Success message">
          <textarea
            className="bld-input"
            rows={2}
            value={config.states.success.message}
            disabled={disabled}
            onChange={(e) =>
              patchProps({
                states: {
                  ...config.states,
                  success: { ...config.states.success, message: e.target.value },
                },
              })
            }
          />
        </InspectorField>
        <InspectorField label="Error title">
          <input
            className="bld-input"
            value={config.states.error.title}
            disabled={disabled}
            onChange={(e) =>
              patchProps({
                states: { ...config.states, error: { ...config.states.error, title: e.target.value } },
              })
            }
          />
        </InspectorField>
        <InspectorField label="Error message">
          <textarea
            className="bld-input"
            rows={2}
            value={config.states.error.message}
            disabled={disabled}
            onChange={(e) =>
              patchProps({
                states: { ...config.states, error: { ...config.states.error, message: e.target.value } },
              })
            }
          />
        </InspectorField>
      </InspectorSection>

      <InspectorField label="Submit label">
        <input
          className="bld-input"
          value={form.submitLabel || config.submitLabel}
          disabled={disabled}
          onChange={(e) => onChange?.('submitLabel', e.target.value)}
        />
      </InspectorField>
    </InspectorPanel>
  );
}
