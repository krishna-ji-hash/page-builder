'use client';

import { SeoField, TITLE_TARGET, DESC_TARGET, charCountClass, safeTrim } from './shared';

export default function OptimizeTab({ form, setForm, audit }) {
  const titleLen = safeTrim(form.title).length;
  const descLen = safeTrim(form.description).length;
  const secondaryKw = Array.isArray(form.secondaryKeywords) ? form.secondaryKeywords.join(', ') : '';

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="bld-seo-modal__section">
      <SeoField
        label="SEO title"
        full
        counter={{ className: charCountClass(titleLen, TITLE_TARGET), text: `${titleLen} / ${TITLE_TARGET.max}` }}
      >
        <input className="bld-input" value={form.title} onChange={set('title')} />
      </SeoField>

      <SeoField
        label="Meta description"
        full
        counter={{ className: charCountClass(descLen, DESC_TARGET), text: `${descLen} / ${DESC_TARGET.max}` }}
      >
        <textarea className="bld-input" rows={3} value={form.description} onChange={set('description')} />
      </SeoField>

      <div className="bld-seo-field-grid">
        <SeoField label="Focus keyword" hint="Primary keyword for this page.">
          <input className="bld-input" value={form.focusKeyword} onChange={set('focusKeyword')} />
        </SeoField>
        <SeoField label="Secondary keywords" hint="Comma-separated.">
          <input
            className="bld-input"
            value={secondaryKw}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                secondaryKeywords: e.target.value.split(/[,;]+/).map((s) => s.trim()).filter(Boolean),
              }))
            }
          />
        </SeoField>
      </div>

      <SeoField label="Canonical URL" hint="Full URL or site path (/page)." full>
        <input className="bld-input" value={form.canonicalUrl} onChange={set('canonicalUrl')} placeholder="/home or https://…" />
      </SeoField>

      {audit?.wordCount != null ? (
        <p className="bld-field-note">
          Content length: <strong>{audit.wordCount}</strong> words
          {audit.wordCount < 120 ? ' — consider adding more content (thin page warning).' : ''}
        </p>
      ) : null}

      <div className="bld-seo-modal__checks">
        {form.focusKeyword && safeTrim(form.title) ? (
          <div className={`bld-seo-modal__check-row bld-seo-modal__check-row--${safeTrim(form.title).toLowerCase().includes(safeTrim(form.focusKeyword).toLowerCase()) ? 'pass' : 'warn'}`}>
            Keyword in title
          </div>
        ) : null}
        {form.focusKeyword && safeTrim(form.description) ? (
          <div className={`bld-seo-modal__check-row bld-seo-modal__check-row--${safeTrim(form.description).toLowerCase().includes(safeTrim(form.focusKeyword).toLowerCase()) ? 'pass' : 'warn'}`}>
            Keyword in description
          </div>
        ) : null}
        {form.focusKeyword && audit?.firstH1 ? (
          <div className={`bld-seo-modal__check-row bld-seo-modal__check-row--${audit.firstH1.toLowerCase().includes(safeTrim(form.focusKeyword).toLowerCase()) ? 'pass' : 'warn'}`}>
            Keyword in H1
          </div>
        ) : null}
        {audit?.headingCount === 0 ? <div className="bld-seo-modal__check-row bld-seo-modal__check-row--crit">Missing H1</div> : null}
        {audit?.headingCount > 1 ? <div className="bld-seo-modal__check-row bld-seo-modal__check-row--warn">Multiple H1 ({audit.headingCount})</div> : null}
        {audit?.missingAlt > 0 ? <div className="bld-seo-modal__check-row bld-seo-modal__check-row--warn">Missing image alt ({audit.missingAlt})</div> : null}
      </div>
    </div>
  );
}
