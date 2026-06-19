'use client';

import { SeoField } from './shared';

export default function SocialTab({ form, setForm, projectSeo }) {
  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="bld-seo-modal__section">
      <h3 className="bld-seo-modal__section-title">Open Graph (Facebook / LinkedIn)</h3>
      <div className="bld-seo-field-grid">
        <SeoField label="OG title" hint="Falls back to SEO title.">
          <input className="bld-input" value={form.ogTitle} onChange={set('ogTitle')} placeholder={form.title || 'SEO title'} />
        </SeoField>
        <SeoField label="OG image" hint="Falls back to project default.">
          <input className="bld-input" value={form.ogImage} onChange={set('ogImage')} placeholder={projectSeo?.defaultOgImage || '/media/…'} />
        </SeoField>
      </div>
      <SeoField label="OG description" full>
        <textarea className="bld-input" rows={2} value={form.ogDescription} onChange={set('ogDescription')} placeholder={form.description || 'Meta description'} />
      </SeoField>

      <h3 className="bld-seo-modal__section-title" style={{ marginTop: 8 }}>Twitter</h3>
      <div className="bld-seo-field-grid">
        <SeoField label="Twitter card">
          <select className="bld-input" value={form.twitterCard || ''} onChange={set('twitterCard')}>
            <option value="">Use project default</option>
            <option value="summary">Summary</option>
            <option value="summary_large_image">Summary large image</option>
          </select>
        </SeoField>
        <SeoField label="Twitter image">
          <input className="bld-input" value={form.twitterImage} onChange={set('twitterImage')} placeholder="Uses OG image if empty" />
        </SeoField>
        <SeoField label="Twitter title">
          <input className="bld-input" value={form.twitterTitle} onChange={set('twitterTitle')} />
        </SeoField>
      </div>
      <SeoField label="Twitter description" full>
        <textarea className="bld-input" rows={2} value={form.twitterDescription} onChange={set('twitterDescription')} />
      </SeoField>
    </div>
  );
}
