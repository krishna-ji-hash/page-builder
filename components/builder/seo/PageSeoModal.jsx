'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeProjectSeo, normalizePageSeo } from '@/lib/seo/seoEngine';
import { publicPagePathForSeo } from '@/lib/publicSiteUrls';

const TITLE_MIN = 15;
const TITLE_MAX = 70;
const DESC_MIN = 50;
const DESC_MAX = 160;

function str(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function safeTrim(v) {
  return str(v).replace(/\s+/g, ' ').trim();
}

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function isProbablyUrlOrPath(value) {
  const v = safeTrim(value);
  if (!v) return true;
  if (v.startsWith('/')) return true;
  return /^https?:\/\//i.test(v);
}

function tryParseJson(text) {
  const raw = str(text).trim();
  if (!raw) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, error: e?.message || 'Invalid JSON' };
  }
}

function walkNodes(nodes, visit) {
  for (const n of nodes || []) {
    if (!n) continue;
    visit(n);
    if (Array.isArray(n.children) && n.children.length) walkNodes(n.children, visit);
  }
}

function computeSeoAssistant({ tree, pageSeo, projectConfig }) {
  const warnings = [];

  const seo = normalizePageSeo(pageSeo);
  const projectSeo = normalizeProjectSeo(projectConfig);

  const effectiveTitle = safeTrim(seo.title);
  const effectiveDesc = safeTrim(seo.description);
  const effectiveOgImage = safeTrim(seo.ogImage) || safeTrim(projectSeo.defaultOgImage);
  const canonicalRaw = safeTrim(seo.canonicalUrl);
  const canonicalDomain = safeTrim(projectSeo.canonicalDomain);
  const hasCanonical = Boolean(canonicalRaw) || Boolean(canonicalDomain);

  let headingCount = 0;
  const images = [];
  walkNodes(tree, (node) => {
    if (node?.nodeType === 'heading') headingCount += 1;
    if (node?.nodeType === 'image') {
      images.push({
        id: node.id,
        name: node.displayName || 'Image',
        alt: safeTrim(node.props?.alt || ''),
        src: safeTrim(node.props?.src || ''),
      });
    }
  });

  if (!effectiveTitle) warnings.push({ id: 'missing-title', severity: 'high', label: 'Missing SEO title' });
  else {
    if (effectiveTitle.length < TITLE_MIN) warnings.push({ id: 'title-too-short', severity: 'med', label: `Title too short (${effectiveTitle.length})` });
    if (effectiveTitle.length > TITLE_MAX) warnings.push({ id: 'title-too-long', severity: 'med', label: `Title too long (${effectiveTitle.length})` });
  }

  if (!effectiveDesc) warnings.push({ id: 'missing-desc', severity: 'high', label: 'Missing meta description' });
  else {
    if (effectiveDesc.length < DESC_MIN) warnings.push({ id: 'desc-too-short', severity: 'low', label: `Description too short (${effectiveDesc.length})` });
    if (effectiveDesc.length > DESC_MAX) warnings.push({ id: 'desc-too-long', severity: 'low', label: `Description too long (${effectiveDesc.length})` });
  }

  if (headingCount === 0) warnings.push({ id: 'missing-h1', severity: 'high', label: 'Missing H1 (Heading widget)' });
  if (headingCount > 1) warnings.push({ id: 'multi-h1', severity: 'med', label: `Multiple H1s (${headingCount})` });

  const missingAlt = images.filter((img) => !img.alt);
  if (missingAlt.length) warnings.push({ id: 'missing-alt', severity: 'med', label: `Missing image alt text (${missingAlt.length})` });

  if (!hasCanonical) warnings.push({ id: 'missing-canonical', severity: 'med', label: 'Missing canonical (page URL or project canonical domain)' });
  if (seo.noindex) warnings.push({ id: 'noindex', severity: 'med', label: 'noindex enabled (page will not be indexed)' });
  if (!effectiveOgImage) warnings.push({ id: 'missing-og-image', severity: 'low', label: 'Missing OG image' });

  const weights = { high: 18, med: 10, low: 6 };
  const penalty = warnings.reduce((sum, w) => sum + (weights[w.severity] || 0), 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    score,
    warnings,
    imageAudit: {
      total: images.length,
      missingAlt: missingAlt.length,
      missingAltNodes: missingAlt,
    },
    headingCount,
  };
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const msg = typeof data?.error === 'string' ? data.error : `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function PreviewCard({ title, children }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.35)', borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

const SCHEMA_PRESETS = [
  {
    id: 'organization',
    label: 'Organization',
    json: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: '{{siteTitle}}',
      url: '{{page.slug}}',
      logo: '{{page.ogImage}}',
      sameAs: [],
    },
  },
  {
    id: 'website',
    label: 'Website',
    json: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '{{siteTitle}}',
      url: '{{page.slug}}',
      potentialAction: {
        '@type': 'SearchAction',
        target: '{{page.slug}}?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  },
  {
    id: 'breadcrumb',
    label: 'Breadcrumb',
    json: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '{{siteTitle}}', item: '/' },
        { '@type': 'ListItem', position: 2, name: '{{title}}', item: '{{page.slug}}' },
      ],
    },
  },
  {
    id: 'blogposting',
    label: 'BlogPosting',
    json: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: '{{item.title}}',
      description: '{{item.data.description}}',
      image: '{{item.data.ogImage}}',
      mainEntityOfPage: '{{page.slug}}',
    },
  },
  {
    id: 'product',
    label: 'Product',
    json: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: '{{item.title}}',
      description: '{{item.data.description}}',
      image: '{{item.data.image}}',
      sku: '{{item.data.sku}}',
      offers: {
        '@type': 'Offer',
        priceCurrency: '{{item.data.currency}}',
        price: '{{item.data.price}}',
        availability: 'https://schema.org/InStock',
        url: '{{page.slug}}',
      },
    },
  },
  {
    id: 'faq',
    label: 'FAQ',
    json: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '{{item.data.question}}',
          acceptedAnswer: { '@type': 'Answer', text: '{{item.data.answer}}' },
        },
      ],
    },
  },
  {
    id: 'localbusiness',
    label: 'LocalBusiness',
    json: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: '{{siteTitle}}',
      url: '{{page.slug}}',
      image: '{{page.ogImage}}',
      telephone: '{{project.phone}}',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '{{project.address.street}}',
        addressLocality: '{{project.address.city}}',
        addressRegion: '{{project.address.region}}',
        postalCode: '{{project.address.postal}}',
        addressCountry: '{{project.address.country}}',
      },
    },
  },
  {
    id: 'realestate',
    label: 'RealEstateListing',
    json: {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: '{{item.title}}',
      description: '{{item.data.description}}',
      url: '{{page.slug}}',
      image: '{{item.data.image}}',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '{{item.data.address}}',
        addressLocality: '{{item.data.city}}',
        addressRegion: '{{item.data.state}}',
        postalCode: '{{item.data.zip}}',
      },
    },
  },
];

export default function PageSeoModal({
  open,
  pageId,
  pageSlug,
  projectSlug,
  projectConfig,
  tree,
  onClose,
  onSelectNode,
}) {
  const [initialSeo, setInitialSeo] = useState(null);
  const [form, setForm] = useState(() => normalizePageSeo({}));
  const [schemaText, setSchemaText] = useState('');
  const [schemaError, setSchemaError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(0);

  const lastLoadedPageIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    const pid = Number(pageId);
    if (!Number.isInteger(pid) || pid <= 0) return;
    if (lastLoadedPageIdRef.current === pid && initialSeo != null) return;
    lastLoadedPageIdRef.current = pid;
    setIsLoading(true);
    setError('');
    setSchemaError('');
    fetchJson(`/api/pages/${pid}/seo`, { cache: 'no-store' })
      .then((data) => {
        const seo = normalizePageSeo(data?.seo || {});
        setInitialSeo(seo);
        setForm(seo);
        const schema = seo.schemaTemplate ?? seo.schemaJsonLd ?? null;
        setSchemaText(schema == null ? '' : typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2));
      })
      .catch((e) => setError(e?.message || 'Failed to load page SEO'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pageId]);

  const dirty = useMemo(() => {
    if (!initialSeo) return false;
    const next = { ...form, schemaTemplate: schemaText ? schemaText : null };
    const prev = { ...initialSeo, schemaTemplate: initialSeo.schemaTemplate ?? (initialSeo.schemaJsonLd ? JSON.stringify(initialSeo.schemaJsonLd) : null) };
    return JSON.stringify(next) !== JSON.stringify(prev);
  }, [form, initialSeo, schemaText]);

  const assistant = useMemo(() => {
    return computeSeoAssistant({ tree, pageSeo: { ...form }, projectConfig });
  }, [tree, form, projectConfig]);

  const titleLen = safeTrim(form.title).length;
  const descLen = safeTrim(form.description).length;

  const save = async () => {
    if (!dirty || isSaving) return;
    setError('');
    setSchemaError('');

    if (!isProbablyUrlOrPath(form.canonicalUrl)) {
      setError('Canonical URL must be a full URL (https://) or a site path (/path).');
      return;
    }
    if (!isProbablyUrlOrPath(form.ogImage)) {
      setError('OG image must be a full URL (https://) or a site path (/path).');
      return;
    }

    const parsedSchema = tryParseJson(schemaText);
    if (!parsedSchema.ok) {
      setSchemaError(parsedSchema.error);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        schemaJsonLd: null,
        schemaTemplate: schemaText ? schemaText : null,
      };
      const data = await fetchJson(`/api/pages/${pageId}/seo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo: payload }),
      });
      const nextSeo = normalizePageSeo(data?.seo || payload);
      setInitialSeo(nextSeo);
      setForm(nextSeo);
      setSavedTick((t) => t + 1);
    } catch (e) {
      setError(e?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  const defaultPublicPath = publicPagePathForSeo(projectSlug, pageSlug);
  const canonicalPreview =
    safeTrim(form.canonicalUrl) ||
    (safeTrim(normalizeProjectSeo(projectConfig).canonicalDomain)
      ? `${safeTrim(normalizeProjectSeo(projectConfig).canonicalDomain).replace(/\/+$/, '')}${defaultPublicPath}`
      : defaultPublicPath);

  return (
    <div className="bld-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="bld-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Page SEO"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 980, width: 'min(980px, 96vw)' }}
      >
        <header className="bld-modal__head">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}>
            <div>
              <div style={{ fontWeight: 900 }}>Page SEO</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{projectSlug}/{pageSlug}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`bld-chip`} title="SEO score">
                Score: {assistant.score}/100
              </span>
              {dirty ? <span className="bld-chip" title="Unsaved SEO edits">Dirty</span> : <span className="bld-chip">Saved</span>}
              <button className="bld-btn bld-btn--outline" type="button" onClick={onClose}>
                Close
              </button>
              <button className="bld-btn bld-btn--primary" type="button" onClick={save} disabled={!dirty || isSaving || isLoading}>
                {isSaving ? 'Saving…' : savedTick ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </header>

        <div className="bld-modal__body" style={{ display: 'grid', gap: 12 }}>
          {error ? <div style={{ color: '#b91c1c', fontWeight: 800 }}>{error}</div> : null}
          {isLoading ? <div style={{ opacity: 0.75 }}>Loading SEO…</div> : null}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'grid', gap: 10 }}>
              <PreviewCard title="Editor">
                <div className="bld-field">
                  <label className="bld-label">SEO title</label>
                  <input className="bld-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                  <p className="bld-field-note">
                    Length: <strong>{titleLen}</strong> (target {TITLE_MIN}–{TITLE_MAX})
                  </p>
                </div>
                <div className="bld-field">
                  <label className="bld-label">Meta description</label>
                  <textarea className="bld-input" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                  <p className="bld-field-note">
                    Length: <strong>{descLen}</strong> (target {DESC_MIN}–{DESC_MAX})
                  </p>
                </div>
                <div className="bld-field-grid">
                  <div className="bld-field">
                    <label className="bld-label">OG title</label>
                    <input className="bld-input" value={form.ogTitle} onChange={(e) => setForm((p) => ({ ...p, ogTitle: e.target.value }))} />
                  </div>
                  <div className="bld-field">
                    <label className="bld-label">OG image</label>
                    <input className="bld-input" value={form.ogImage} onChange={(e) => setForm((p) => ({ ...p, ogImage: e.target.value }))} placeholder="/media/..." />
                  </div>
                </div>
                <div className="bld-field">
                  <label className="bld-label">OG description</label>
                  <textarea className="bld-input" rows={2} value={form.ogDescription} onChange={(e) => setForm((p) => ({ ...p, ogDescription: e.target.value }))} />
                </div>
                <div className="bld-field-grid">
                  <div className="bld-field">
                    <label className="bld-label">Twitter card</label>
                    <select className="bld-input" value={form.twitterCard || ''} onChange={(e) => setForm((p) => ({ ...p, twitterCard: e.target.value }))}>
                      <option value="">(default)</option>
                      <option value="summary">summary</option>
                      <option value="summary_large_image">summary_large_image</option>
                    </select>
                  </div>
                  <div className="bld-field">
                    <label className="bld-label">Canonical URL</label>
                    <input className="bld-input" value={form.canonicalUrl} onChange={(e) => setForm((p) => ({ ...p, canonicalUrl: e.target.value }))} placeholder="/project/page or https://..." />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={Boolean(form.noindex)} onChange={(e) => setForm((p) => ({ ...p, noindex: e.target.checked }))} />
                    noindex
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={Boolean(form.nofollow)} onChange={(e) => setForm((p) => ({ ...p, nofollow: e.target.checked }))} />
                    nofollow
                  </label>
                </div>
              </PreviewCard>

              <PreviewCard title="Schema JSON-LD (raw)">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {SCHEMA_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="bld-btn bld-btn--ghost"
                      onClick={() => {
                        setSchemaText(JSON.stringify(p.json, null, 2));
                        setSchemaError('');
                      }}
                      title="Insert preset JSON-LD"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <textarea
                  className="bld-input"
                  rows={10}
                  value={schemaText}
                  onChange={(e) => {
                    setSchemaText(e.target.value);
                    setSchemaError('');
                  }}
                  placeholder='{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "{{item.title}}"\n}'
                />
                {schemaError ? <p className="bld-field-error">{schemaError}</p> : null}
                <p className="bld-field-note">Must be valid JSON. Bindings like <strong>{'{{item.title}}'}</strong> are allowed inside string values.</p>
              </PreviewCard>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <PreviewCard title="Google preview">
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>{safeTrim(form.title) || '(no title)'}</div>
                <div style={{ fontSize: 12, color: '#065f46', marginTop: 3 }}>{canonicalPreview}</div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>{safeTrim(form.description) || '(no description)'}</div>
              </PreviewCard>

              <PreviewCard title="Social / OG preview">
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ opacity: 0.8, fontSize: 12 }}>Image</div>
                  <div style={{ borderRadius: 10, border: '1px solid rgba(148,163,184,0.35)', overflow: 'hidden', background: 'rgba(148,163,184,0.08)' }}>
                    {safeTrim(form.ogImage) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={safeTrim(form.ogImage)} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>No OG image</div>
                    )}
                  </div>
                  <div style={{ fontWeight: 900 }}>{safeTrim(form.ogTitle) || safeTrim(form.title) || '(no title)'}</div>
                  <div style={{ opacity: 0.85, fontSize: 12 }}>{safeTrim(form.ogDescription) || safeTrim(form.description) || '(no description)'}</div>
                </div>
              </PreviewCard>

              <PreviewCard title="SEO Assistant">
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>Score</div>
                    <div style={{ fontWeight: 900 }}>{assistant.score}/100</div>
                  </div>

                  {assistant.warnings.length ? (
                    <div style={{ display: 'grid', gap: 6 }}>
                      {assistant.warnings.map((w) => (
                        <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontWeight: 700 }}>{w.label}</span>
                          <span className="bld-chip">{w.severity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ opacity: 0.75 }}>No warnings found.</div>
                  )}
                </div>
              </PreviewCard>

              <PreviewCard title="Image alt audit">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span className="bld-chip">Images: {assistant.imageAudit.total}</span>
                  <span className="bld-chip">Missing alt: {assistant.imageAudit.missingAlt}</span>
                  <span className="bld-chip">H1 count: {assistant.headingCount}</span>
                </div>
                {assistant.imageAudit.missingAltNodes.length ? (
                  <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                    {assistant.imageAudit.missingAltNodes.slice(0, 20).map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        className="bld-btn bld-btn--ghost"
                        onClick={() => onSelectNode?.(img.id)}
                        style={{ justifyContent: 'space-between', display: 'flex' }}
                      >
                        <span style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          #{img.id} {img.name}
                        </span>
                        <span className="bld-chip">missing alt</span>
                      </button>
                    ))}
                    {assistant.imageAudit.missingAltNodes.length > 20 ? (
                      <div style={{ opacity: 0.75, fontSize: 12 }}>Showing first 20.</div>
                    ) : null}
                  </div>
                ) : (
                  <div style={{ marginTop: 10, opacity: 0.75 }}>All images have alt text.</div>
                )}
              </PreviewCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

