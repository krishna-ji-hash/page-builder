'use client';

import { useEffect, useState } from 'react';
import { WIZARD_INDUSTRIES, WIZARD_THEMES } from '@/lib/platform/industryBlueprint';
import '@/styles/admin/platform.css';

function defaultSlugFromName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function ProjectWizard({ open, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [industry, setIndustry] = useState('saas');
  const [theme, setTheme] = useState('light');
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setError('');
  }, [open]);

  useEffect(() => {
    if (step !== 4 || !industry) return;
    fetch(`/api/platform/wizard/templates?industry=${encodeURIComponent(industry)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = data?.templates || [];
        setTemplates(list);
        if (list[0]?.id) setTemplateId(list[0].id);
      })
      .catch(() => setTemplates([]));
  }, [step, industry]);

  if (!open) return null;

  const handleProvision = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/platform/wizard/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, industry, theme, templateId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Provisioning failed');
      onComplete?.(data);
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const canNext =
    (step === 1 && name.trim() && slug.trim()) ||
    (step === 2 && industry) ||
    (step === 3 && theme) ||
    (step === 4 && templateId) ||
    step === 5;

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true" aria-label="Create project">
      <div className="wizard-panel">
        <h2 style={{ margin: '0 0 4px' }}>Create website project</h2>
        <p className="platform-shell__sub" style={{ margin: '0 0 16px' }}>
          Step {step} of 5 — deploy pages, SEO, header/footer, and theme tokens.
        </p>

        <div className="wizard-steps">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`wizard-step-dot ${step === n ? 'is-active' : ''} ${step > n ? 'is-done' : ''}`}
            >
              {n}
            </span>
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="wizard-field">
              <label htmlFor="wiz-name">Project name</label>
              <input
                id="wiz-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug || slug === defaultSlugFromName(name)) {
                    setSlug(defaultSlugFromName(e.target.value));
                  }
                }}
                placeholder="Acme Realty"
              />
            </div>
            <div className="wizard-field">
              <label htmlFor="wiz-slug">Project slug</label>
              <input
                id="wiz-slug"
                value={slug}
                onChange={(e) => setSlug(defaultSlugFromName(e.target.value))}
                placeholder="acme-realty"
              />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="wizard-options">
            {WIZARD_INDUSTRIES.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`wizard-option ${industry === opt.id ? 'is-selected' : ''}`}
                onClick={() => setIndustry(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="wizard-options">
            {WIZARD_THEMES.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`wizard-option ${theme === opt.id ? 'is-selected' : ''}`}
                onClick={() => setTheme(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="wizard-options">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                className={`wizard-option ${templateId === tpl.id ? 'is-selected' : ''}`}
                onClick={() => setTemplateId(tpl.id)}
              >
                <strong>{tpl.label}</strong>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  {tpl.pageCount} pages —{' '}
                  {(tpl.pages || []).map((p) => p.title).join(', ')}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 5 && (
          <div>
            <p style={{ margin: '0 0 12px' }}>
              Ready to generate <strong>{name}</strong> ({slug}) with {industry} templates, {theme}{' '}
              theme, header/footer, and SEO defaults.
            </p>
            {error && (
              <p style={{ color: '#b91c1c', fontSize: 14 }} role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        {error && step !== 5 && (
          <p style={{ color: '#b91c1c', fontSize: 14 }} role="alert">
            {error}
          </p>
        )}

        <div className="wizard-footer">
          <button type="button" className="platform-btn" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < 5 ? (
            <button
              type="button"
              className="platform-btn platform-btn--primary"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="platform-btn platform-btn--primary"
              disabled={loading}
              onClick={handleProvision}
            >
              {loading ? 'Generating…' : 'Generate project'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
