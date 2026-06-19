'use client';

import { SeoField } from './shared';

export default function RobotsTab({ form, setForm }) {
  const setCheck = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.checked }));
  const setVal = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="bld-seo-modal__section">
      <div>
        <h3 className="bld-seo-modal__section-title">Indexing</h3>
        <div className="bld-seo-modal__check-list">
          <label>
            <input type="checkbox" checked={!form.noindex} onChange={(e) => setForm((p) => ({ ...p, noindex: !e.target.checked }))} />
            Allow index
          </label>
          <label>
            <input type="checkbox" checked={!form.nofollow} onChange={(e) => setForm((p) => ({ ...p, nofollow: !e.target.checked }))} />
            Allow follow
          </label>
        </div>
      </div>

      <div>
        <h3 className="bld-seo-modal__section-title">Sitemap</h3>
        <div className="bld-seo-modal__check-list">
          <label>
            <input type="checkbox" checked={!form.sitemapExclude} onChange={(e) => setForm((p) => ({ ...p, sitemapExclude: !e.target.checked }))} />
            Include in sitemap
          </label>
        </div>
      </div>

      <div>
        <h3 className="bld-seo-modal__section-title">Advanced robots (Googlebot)</h3>
        <div className="bld-seo-field-grid bld-seo-field-grid--3">
          <SeoField label="Max snippet" hint="-1 = unlimited">
            <input className="bld-input" type="number" value={form.maxSnippet ?? ''} onChange={setVal('maxSnippet')} placeholder="-1" />
          </SeoField>
          <SeoField label="Max video preview" hint="-1 = unlimited">
            <input className="bld-input" type="number" value={form.maxVideoPreview ?? ''} onChange={setVal('maxVideoPreview')} placeholder="-1" />
          </SeoField>
          <SeoField label="Max image preview">
            <select className="bld-input" value={form.maxImagePreview || ''} onChange={setVal('maxImagePreview')}>
              <option value="">Use project default</option>
              <option value="large">Large</option>
              <option value="standard">Standard</option>
              <option value="none">None</option>
            </select>
          </SeoField>
        </div>
        <div className="bld-seo-modal__check-list" style={{ marginTop: 12 }}>
          <label>
            <input type="checkbox" checked={Boolean(form.noarchive)} onChange={setCheck('noarchive')} /> noarchive
          </label>
          <label>
            <input type="checkbox" checked={Boolean(form.nosnippet)} onChange={setCheck('nosnippet')} /> nosnippet
          </label>
          <label>
            <input type="checkbox" checked={Boolean(form.noimageindex)} onChange={setCheck('noimageindex')} /> noimageindex
          </label>
        </div>
      </div>
    </div>
  );
}
