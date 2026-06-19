'use client';

import { SerpPreview, previewTitle } from '@/components/admin/seo/seoShared';
import { SeoField, SeoSection } from '@/components/admin/seo/seoFormFields';

export default function SeoDefaultsForm({ form, setForm }) {
  const set = (key) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({
      ...p,
      [key]: v,
      ...(key === 'siteName' ? { siteTitle: v } : {}),
    }));
  };

  return (
    <div className="proj-seo__layout seo-cc__defaults">
      <div className="proj-seo__form">
        <SeoSection title="Site identity" subtitle="Brand name and publisher defaults used across the site.">
          <div className="proj-seo__section-body proj-seo__section-body--grid">
            <SeoField label="Site name" hint="Shown in title templates and schema." full>
              <input className="seo-cc__input" value={form.siteName} onChange={set('siteName')} placeholder="Dispatch Solutions" />
            </SeoField>
            <SeoField label="Site tagline">
              <input className="seo-cc__input" value={form.siteTagline} onChange={set('siteTagline')} placeholder="Multi-carrier shipping platform" />
            </SeoField>
            <SeoField label="Company name">
              <input className="seo-cc__input" value={form.companyName} onChange={set('companyName')} />
            </SeoField>
            <SeoField label="Default author">
              <input className="seo-cc__input" value={form.defaultAuthor} onChange={set('defaultAuthor')} />
            </SeoField>
            <SeoField label="Default publisher">
              <input className="seo-cc__input" value={form.defaultPublisher} onChange={set('defaultPublisher')} />
            </SeoField>
            <SeoField label="Language">
              <input className="seo-cc__input" value={form.language} onChange={set('language')} placeholder="en" />
            </SeoField>
            <SeoField label="Country">
              <input className="seo-cc__input" value={form.country} onChange={set('country')} placeholder="IN" />
            </SeoField>
          </div>
        </SeoSection>

        <SeoSection title="Global metadata" subtitle="Fallback title and description when a page has no override.">
          <div className="proj-seo__section-body">
            <SeoField
              label="Title template"
              hint="Tokens: {{title}}, {{siteTitle}}, {{slug}}, {{category}}"
              full
            >
              <input className="seo-cc__input" value={form.titleTemplate} onChange={set('titleTemplate')} />
            </SeoField>
            <SeoField label="Default meta title" hint="Used when a page has no SEO title." full>
              <input className="seo-cc__input" value={form.defaultMetaTitle} onChange={set('defaultMetaTitle')} />
            </SeoField>
            <SeoField label="Default meta description" full>
              <textarea className="seo-cc__input" rows={3} value={form.defaultDescription} onChange={set('defaultDescription')} />
            </SeoField>
            <SeoField label="Default keywords" hint="Comma-separated." full>
              <input className="seo-cc__input" value={form.defaultKeywords} onChange={set('defaultKeywords')} placeholder="shipping, courier, logistics" />
            </SeoField>
            <SeoField label="Canonical domain" hint="Production URL prefix for canonicals and sitemap." full>
              <input className="seo-cc__input" value={form.canonicalDomain} onChange={set('canonicalDomain')} placeholder="https://dispatch.in" />
            </SeoField>
            <SeoField label="Favicon URL" full>
              <input className="seo-cc__input" value={form.favicon} onChange={set('favicon')} placeholder="/favicon.svg" />
            </SeoField>
          </div>
        </SeoSection>

        <SeoSection title="Social defaults" subtitle="Open Graph and Twitter fallbacks.">
          <div className="proj-seo__section-body proj-seo__section-body--grid">
            <SeoField label="Default OG title">
              <input className="seo-cc__input" value={form.defaultOgTitle} onChange={set('defaultOgTitle')} />
            </SeoField>
            <SeoField label="Default OG image">
              <input className="seo-cc__input" value={form.defaultOgImage} onChange={set('defaultOgImage')} placeholder="/brand/logo.png" />
            </SeoField>
            <SeoField label="Default OG description" full>
              <textarea className="seo-cc__input" rows={2} value={form.defaultOgDescription} onChange={set('defaultOgDescription')} />
            </SeoField>
            <SeoField label="Twitter card">
              <select className="seo-cc__input" value={form.twitterCard} onChange={set('twitterCard')}>
                <option value="summary">summary</option>
                <option value="summary_large_image">summary_large_image</option>
              </select>
            </SeoField>
            <SeoField label="Twitter site" hint="@brand handle">
              <input className="seo-cc__input" value={form.twitterSite} onChange={set('twitterSite')} placeholder="@dispatch" />
            </SeoField>
            <SeoField label="Twitter creator">
              <input className="seo-cc__input" value={form.twitterCreator} onChange={set('twitterCreator')} />
            </SeoField>
          </div>
        </SeoSection>

        <SeoSection title="Indexing & robots meta" subtitle="Project-wide indexing and Googlebot hints.">
          <div className="proj-seo__section-body proj-seo__section-body--grid">
            <SeoField label="Site indexing">
              <select className="seo-cc__input" value={form.indexingEnabled ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, indexingEnabled: e.target.value === 'true' }))}>
                <option value="true">Enabled</option>
                <option value="false">Disabled (noindex site)</option>
              </select>
            </SeoField>
            <SeoField label="Robots meta">
              <div className="proj-seo__checks">
                <label className="proj-seo__check">
                  <input type="checkbox" checked={form.robotsIndex} onChange={set('robotsIndex')} /> index
                </label>
                <label className="proj-seo__check">
                  <input type="checkbox" checked={form.robotsFollow} onChange={set('robotsFollow')} /> follow
                </label>
              </div>
            </SeoField>
            <SeoField label="max-image-preview">
              <select className="seo-cc__input" value={form.maxImagePreview} onChange={set('maxImagePreview')}>
                <option value="large">large</option>
                <option value="standard">standard</option>
                <option value="none">none</option>
              </select>
            </SeoField>
            <SeoField label="max-snippet" hint="-1 = unlimited">
              <input className="seo-cc__input" type="number" value={form.maxSnippet} onChange={set('maxSnippet')} />
            </SeoField>
            <SeoField label="max-video-preview" hint="-1 = unlimited">
              <input className="seo-cc__input" type="number" value={form.maxVideoPreview} onChange={set('maxVideoPreview')} />
            </SeoField>
          </div>
        </SeoSection>
      </div>

      <aside className="proj-seo__aside seo-cc__preview-stack">
        <div className="proj-seo__preview">
          <div className="proj-seo__preview-head">
            <h2 className="proj-seo__preview-title">Google preview</h2>
          </div>
          <div className="proj-seo__preview-body">
            <SerpPreview
              title={previewTitle(form.titleTemplate, form.siteTitle)}
              description={form.defaultDescription || 'Default meta description for pages without overrides.'}
              url={form.canonicalDomain || 'https://example.com'}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
