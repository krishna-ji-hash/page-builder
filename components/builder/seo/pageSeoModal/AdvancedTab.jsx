'use client';

import { SeoField } from './shared';

export default function AdvancedTab({ form, setForm }) {
  const keywords = Array.isArray(form.keywords) ? form.keywords.join(', ') : '';
  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="bld-seo-modal__section">
      <SeoField label="Custom canonical URL" hint="Overrides optimize-tab canonical when set." full>
        <input className="bld-input" value={form.canonicalUrl} onChange={set('canonicalUrl')} />
      </SeoField>

      <div className="bld-seo-field-grid">
        <SeoField label="Redirect after publish" hint="Path to redirect visitors (stored for future use).">
          <input className="bld-input" value={form.redirectAfterPublish} onChange={set('redirectAfterPublish')} placeholder="/new-page" />
        </SeoField>
        <SeoField label="Breadcrumb title">
          <input className="bld-input" value={form.breadcrumbTitle} onChange={set('breadcrumbTitle')} />
        </SeoField>
      </div>

      <SeoField label="Meta keywords" hint="Comma-separated legacy keywords." full>
        <input
          className="bld-input"
          value={keywords}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              keywords: e.target.value.split(/[,;]+/).map((s) => s.trim()).filter(Boolean),
            }))
          }
        />
      </SeoField>

      <div className="bld-seo-field-grid">
        <SeoField label="Author">
          <input className="bld-input" value={form.author} onChange={set('author')} />
        </SeoField>
        <SeoField label="Publisher">
          <input className="bld-input" value={form.publisher} onChange={set('publisher')} />
        </SeoField>
        <SeoField label="Language override">
          <input className="bld-input" value={form.languageOverride} onChange={set('languageOverride')} placeholder="en" />
        </SeoField>
        <SeoField label="Country override">
          <input className="bld-input" value={form.countryOverride} onChange={set('countryOverride')} placeholder="IN" />
        </SeoField>
      </div>

      <SeoField
        label="Custom head tags"
        hint="Only meta, link, and style tags allowed. Scripts are stripped on save."
        full
      >
        <textarea
          className="bld-input"
          rows={5}
          value={form.customHeadTags}
          onChange={set('customHeadTags')}
          placeholder='<meta name="theme-color" content="#ffffff" />'
        />
      </SeoField>
    </div>
  );
}
