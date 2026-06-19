'use client';

import { useEffect, useState } from 'react';
import {
  SeoField,
  SeoSection,
  SchemaTypeSelect,
  TITLE_TARGET,
  DESC_TARGET,
  charCountClass,
  pageSeoFormFromApi,
  pageSeoToPayload,
} from '@/components/admin/seo/seoFormFields';
import { SerpPreview, SocialCardPreview, fetchJson } from '@/components/admin/seo/seoShared';

export default function SeoPageEditorModal({ page, projectId, canonicalDomain, onClose, onSaved }) {
  const [form, setForm] = useState(pageSeoFormFromApi(page?.seo));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!page?.id) return;
    setLoading(true);
    fetchJson(`/api/pages/${page.id}/seo`, { cache: 'no-store' })
      .then((data) => setForm(pageSeoFormFromApi(data?.seo)))
      .catch((e) => setError(e?.message || 'Failed to load SEO'))
      .finally(() => setLoading(false));
  }, [page?.id]);

  if (!page) return null;

  const titleLen = String(form.title || '').trim().length;
  const descLen = String(form.description || '').trim().length;
  const previewUrl = `${(canonicalDomain || '').replace(/\/+$/, '')}${page.livePath || ''}`;

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const raw = String(form.schemaTemplate || '').trim();
      if (raw) JSON.parse(raw);
      await fetchJson(`/api/projects/${projectId}/seo/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo: pageSeoToPayload(form) }),
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e?.message || 'Save failed — check schema JSON is valid.');
    } finally {
      setBusy(false);
    }
  };

  const set = (key) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [key]: v }));
  };

  return (
    <div className="seo-cc__modal-backdrop" role="presentation" onClick={onClose}>
      <div className="seo-cc__modal" role="dialog" aria-modal="true" aria-label={`SEO — ${page.title}`} onClick={(e) => e.stopPropagation()}>
        <header className="seo-cc__modal-head">
          <div>
            <h2 className="seo-cc__modal-title">Page SEO</h2>
            <p className="seo-cc__modal-sub">
              {page.title} · <code>{page.livePath}</code>
            </p>
          </div>
          <div className="seo-cc__modal-actions">
            <button type="button" className="proj-seo__save proj-seo__save--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="proj-seo__save" onClick={save} disabled={busy || loading}>
              {busy ? 'Saving…' : 'Save SEO'}
            </button>
          </div>
        </header>

        {error ? (
          <p className="platform-alert platform-alert--error" role="alert">
            {error}
          </p>
        ) : null}
        {loading ? <p className="seo-hub__empty">Loading page SEO…</p> : null}

        {!loading ? (
          <div className="seo-cc__modal-body">
            <div className="seo-cc__modal-main">
              <SeoSection title="Search metadata">
                <div className="proj-seo__section-body">
                  <SeoField
                    label="SEO title"
                    htmlFor="page-seo-title"
                    full
                    counter={{ className: charCountClass(titleLen, TITLE_TARGET), text: `${titleLen} / ${TITLE_TARGET.max}` }}
                  >
                    <input id="page-seo-title" className="seo-cc__input" value={form.title} onChange={set('title')} />
                  </SeoField>
                  <SeoField
                    label="Meta description"
                    htmlFor="page-seo-desc"
                    full
                    counter={{ className: charCountClass(descLen, DESC_TARGET), text: `${descLen} / ${DESC_TARGET.max}` }}
                  >
                    <textarea id="page-seo-desc" className="seo-cc__input" rows={3} value={form.description} onChange={set('description')} />
                  </SeoField>
                  <div className="proj-seo__section-body--grid" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <SeoField label="Focus keyword">
                      <input className="seo-cc__input" value={form.focusKeyword} onChange={set('focusKeyword')} />
                    </SeoField>
                    <SeoField label="Keywords" hint="Comma-separated">
                      <input className="seo-cc__input" value={form.keywords} onChange={set('keywords')} />
                    </SeoField>
                    <SeoField label="Canonical URL" full>
                      <input className="seo-cc__input" value={form.canonicalUrl} onChange={set('canonicalUrl')} placeholder="/home or https://…" />
                    </SeoField>
                    <SeoField label="Schema type">
                      <SchemaTypeSelect value={form.schemaType} onChange={(v) => setForm((p) => ({ ...p, schemaType: v }))} />
                    </SeoField>
                  </div>
                </div>
              </SeoSection>

              <SeoSection title="Open Graph & Twitter">
                <div className="proj-seo__section-body proj-seo__section-body--grid">
                  <SeoField label="OG title">
                    <input className="seo-cc__input" value={form.ogTitle} onChange={set('ogTitle')} />
                  </SeoField>
                  <SeoField label="OG image">
                    <input className="seo-cc__input" value={form.ogImage} onChange={set('ogImage')} placeholder="/media/…" />
                  </SeoField>
                  <SeoField label="OG description" full>
                    <textarea className="seo-cc__input" rows={2} value={form.ogDescription} onChange={set('ogDescription')} />
                  </SeoField>
                  <SeoField label="Twitter card">
                    <select className="seo-cc__input" value={form.twitterCard} onChange={set('twitterCard')}>
                      <option value="">(project default)</option>
                      <option value="summary">summary</option>
                      <option value="summary_large_image">summary_large_image</option>
                    </select>
                  </SeoField>
                  <SeoField label="Twitter title">
                    <input className="seo-cc__input" value={form.twitterTitle} onChange={set('twitterTitle')} />
                  </SeoField>
                  <SeoField label="Twitter description" full>
                    <textarea className="seo-cc__input" rows={2} value={form.twitterDescription} onChange={set('twitterDescription')} />
                  </SeoField>
                  <SeoField label="Twitter image" full>
                    <input className="seo-cc__input" value={form.twitterImage} onChange={set('twitterImage')} />
                  </SeoField>
                </div>
              </SeoSection>

              <SeoSection title="Schema JSON-LD" subtitle="Optional structured data template. Use {{title}}, {{url}}, {{item.title}} tokens.">
                <textarea
                  className="seo-cc__schema-json"
                  rows={8}
                  value={form.schemaTemplate}
                  onChange={set('schemaTemplate')}
                  placeholder='{"@context":"https://schema.org","@type":"WebPage","name":"{{title}}"}'
                />
              </SeoSection>

              <SeoSection title="Indexing">
                <div className="proj-seo__checks">
                  <label className="proj-seo__check">
                    <input type="checkbox" checked={form.noindex} onChange={set('noindex')} /> noindex
                  </label>
                  <label className="proj-seo__check">
                    <input type="checkbox" checked={form.nofollow} onChange={set('nofollow')} /> nofollow
                  </label>
                  <label className="proj-seo__check">
                    <input type="checkbox" checked={form.sitemapExclude} onChange={set('sitemapExclude')} /> exclude from sitemap
                  </label>
                </div>
              </SeoSection>
            </div>

            <aside className="seo-cc__modal-aside">
              <SerpPreview title={form.title} description={form.description} url={previewUrl} />
              <SocialCardPreview network="facebook" title={form.ogTitle || form.title} description={form.ogDescription || form.description} image={form.ogImage} />
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}
