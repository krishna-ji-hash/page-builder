'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeProjectSeo, normalizePageSeo } from '@/lib/seo/seoEngine';
import { publicPagePathForSeo } from '@/lib/publicSiteUrls';
import { extractFirstHeading, extractFirstParagraph } from '@/lib/seo/seoPageHelpers';
import { runPageSeoModalAudit } from '@/lib/seo/pageSeoModalAudit';
import { sanitizeCustomHeadTags } from '@/lib/seo/sanitizeHeadTags';
import { buildSchemaTemplateFromFields } from '@/lib/seo/schemaFieldDefs';
import OptimizeTab from '@/components/builder/seo/pageSeoModal/OptimizeTab';
import SocialTab from '@/components/builder/seo/pageSeoModal/SocialTab';
import SchemaTab from '@/components/builder/seo/pageSeoModal/SchemaTab';
import RobotsTab from '@/components/builder/seo/pageSeoModal/RobotsTab';
import AdvancedTab from '@/components/builder/seo/pageSeoModal/AdvancedTab';
import AuditTab from '@/components/builder/seo/pageSeoModal/AuditTab';
import { SerpPreviewCard, SocialPreviewCard, scoreRingClass, safeTrim } from '@/components/builder/seo/pageSeoModal/shared';
import '@/styles/builder/page-seo-modal.css';

const TABS = [
  { id: 'optimize', label: 'Optimize' },
  { id: 'social', label: 'Social' },
  { id: 'schema', label: 'Schema' },
  { id: 'robots', label: 'Robots' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'audit', label: 'Audit' },
];

function isProbablyUrlOrPath(value) {
  const v = safeTrim(value);
  if (!v) return true;
  if (v.startsWith('/')) return true;
  return /^https?:\/\//i.test(v);
}

function tryParseJson(text) {
  const raw = safeTrim(text);
  if (!raw) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, error: e?.message || 'Invalid JSON' };
  }
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

function formToPayload(form, schemaText) {
  const normalized = normalizePageSeo({
    ...form,
    customHeadTags: sanitizeCustomHeadTags(form.customHeadTags),
    schemaJsonLd: null,
    schemaTemplate: schemaText ? schemaText : null,
  });
  return normalized;
}

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
  const [tab, setTab] = useState('optimize');
  const [initialSeo, setInitialSeo] = useState(null);
  const [form, setForm] = useState(() => normalizePageSeo({}));
  const [schemaText, setSchemaText] = useState('');
  const [schemaError, setSchemaError] = useState('');
  const [useStructuredBuilder, setUseStructuredBuilder] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(0);

  const lastLoadedPageIdRef = useRef(0);
  const projectSeo = useMemo(() => normalizeProjectSeo(projectConfig), [projectConfig]);

  useEffect(() => {
    if (!open) return;
    const pid = Number(pageId);
    if (!Number.isInteger(pid) || pid <= 0) return;
    if (lastLoadedPageIdRef.current === pid && initialSeo != null) return;
    lastLoadedPageIdRef.current = pid;
    setIsLoading(true);
    setError('');
    setSchemaError('');
    setTab('optimize');
    fetchJson(`/api/pages/${pid}/seo`, { cache: 'no-store' })
      .then((data) => {
        const seo = normalizePageSeo(data?.seo || {});
        setInitialSeo(seo);
        setForm(seo);
        const schema = seo.schemaTemplate ?? seo.schemaJsonLd ?? null;
        setSchemaText(schema == null ? '' : typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2));
        setUseStructuredBuilder(!schema);
      })
      .catch((e) => setError(e?.message || 'Failed to load page SEO'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pageId]);

  const audit = useMemo(
    () => runPageSeoModalAudit({ tree, pageSeo: form, projectSeo }),
    [tree, form, projectSeo]
  );

  const dirty = useMemo(() => {
    if (!initialSeo) return false;
    const nextPayload = formToPayload(form, schemaText);
    const prevPayload = formToPayload(initialSeo, (() => {
      const schema = initialSeo.schemaTemplate ?? initialSeo.schemaJsonLd ?? null;
      return schema == null ? '' : typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2);
    })());
    return JSON.stringify(nextPayload) !== JSON.stringify(prevPayload);
  }, [form, initialSeo, schemaText]);

  const defaultPublicPath = publicPagePathForSeo(projectSlug, pageSlug);
  const canonicalPreview =
    safeTrim(form.canonicalUrl) ||
    (safeTrim(projectSeo.canonicalDomain)
      ? `${safeTrim(projectSeo.canonicalDomain).replace(/\/+$/, '')}${defaultPublicPath}`
      : defaultPublicPath);

  const previewTitle = safeTrim(form.title) || safeTrim(projectSeo.defaultMetaTitle) || pageSlug;
  const previewDesc = safeTrim(form.description) || safeTrim(projectSeo.defaultDescription);
  const previewOgTitle = safeTrim(form.ogTitle) || previewTitle;
  const previewOgDesc = safeTrim(form.ogDescription) || previewDesc;
  const previewOgImage = safeTrim(form.ogImage) || safeTrim(projectSeo.defaultOgImage);
  const previewTwitterTitle = safeTrim(form.twitterTitle) || previewOgTitle;
  const previewTwitterDesc = safeTrim(form.twitterDescription) || previewOgDesc;
  const previewTwitterImage = safeTrim(form.twitterImage) || previewOgImage;

  const applyQuickFix = useCallback(
    (fixId) => {
      if (fixId === 'title-from-h1') {
        const h1 = extractFirstHeading(tree);
        if (h1) setForm((p) => ({ ...p, title: h1 }));
        return;
      }
      if (fixId === 'desc-from-paragraph') {
        const para = extractFirstParagraph(tree);
        if (para) setForm((p) => ({ ...p, description: para.slice(0, 160) }));
        return;
      }
      if (fixId === 'canonical-from-slug') {
        setForm((p) => ({ ...p, canonicalUrl: defaultPublicPath }));
        return;
      }
      if (fixId === 'default-og-image' && projectSeo.defaultOgImage) {
        setForm((p) => ({ ...p, ogImage: projectSeo.defaultOgImage }));
        return;
      }
      if (fixId === 'webpage-schema') {
        const tpl = buildSchemaTemplateFromFields('WebPage', {});
        setForm((p) => ({ ...p, schemaType: 'WebPage', schemaFieldValues: {} }));
        setSchemaText(tpl ? JSON.stringify(tpl, null, 2) : '');
        setSchemaError('');
        setTab('schema');
        return;
      }
      if (fixId === 'enable-index') {
        setForm((p) => ({ ...p, noindex: false, nofollow: false }));
      }
    },
    [tree, defaultPublicPath, projectSeo.defaultOgImage]
  );

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
      setTab('schema');
      return;
    }

    setIsSaving(true);
    try {
      const payload = formToPayload(form, schemaText);
      const data = await fetchJson(`/api/pages/${pageId}/seo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo: payload }),
      });
      const nextSeo = normalizePageSeo(data?.seo || payload);
      setInitialSeo(nextSeo);
      setForm(nextSeo);
      const schema = nextSeo.schemaTemplate ?? nextSeo.schemaJsonLd ?? null;
      setSchemaText(schema == null ? '' : typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2));
      setSavedTick((t) => t + 1);
    } catch (e) {
      setError(e?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="bld-modal-backdrop bld-modal-backdrop--seo" role="presentation" onClick={onClose}>
      <div
        className="bld-modal bld-modal--seo"
        role="dialog"
        aria-modal="true"
        aria-label="Page SEO"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bld-seo-modal__head">
          <div className="bld-seo-modal__head-main">
            <h2 className="bld-seo-modal__title">Page SEO</h2>
            <p className="bld-seo-modal__slug">
              <code>{projectSlug}/{pageSlug}</code>
            </p>
          </div>
          <div className="bld-seo-modal__head-actions">
            {dirty ? (
              <span className="bld-seo-modal__status bld-seo-modal__status--dirty">Unsaved changes</span>
            ) : (
              <span className="bld-seo-modal__status">{savedTick ? 'Saved' : 'Synced'}</span>
            )}
            <button
              className="bld-btn bld-btn--primary bld-seo-modal__save"
              type="button"
              onClick={save}
              disabled={!dirty || isSaving || isLoading}
            >
              {isSaving ? 'Saving…' : 'Save SEO'}
            </button>
            <button type="button" className="bld-modal__close bld-seo-modal__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </header>

        {error ? (
          <div style={{ padding: '8px 16px', color: '#b91c1c', fontWeight: 700, fontSize: 12 }} role="alert">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div style={{ padding: 16, opacity: 0.75 }}>Loading SEO…</div>
        ) : (
          <div className="bld-seo-modal__layout">
            <aside className="bld-seo-modal__score">
              <div className={`bld-seo-modal__score-ring ${scoreRingClass(audit.score)}`}>{audit.score}</div>
              <div className="bld-seo-modal__score-label">SEO Score</div>
              <div className="bld-seo-modal__mini-stats">
                <div className="bld-seo-modal__mini-stat">
                  <span>Critical</span>
                  <strong>{audit.critical.length}</strong>
                </div>
                <div className="bld-seo-modal__mini-stat">
                  <span>Warnings</span>
                  <strong>{audit.warnings.length}</strong>
                </div>
                <div className="bld-seo-modal__mini-stat">
                  <span>Passed</span>
                  <strong>{audit.passed.length}</strong>
                </div>
                <div className="bld-seo-modal__mini-stat">
                  <span>Words</span>
                  <strong>{audit.wordCount}</strong>
                </div>
              </div>
            </aside>

            <div className="bld-seo-modal__main">
              <nav className="bld-seo-modal__tabs" aria-label="SEO editor sections">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`bld-seo-modal__tab${tab === t.id ? ' is-active' : ''}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>

              <div className="bld-seo-modal__tab-body">
                {tab === 'optimize' ? <OptimizeTab form={form} setForm={setForm} audit={audit} /> : null}
                {tab === 'social' ? <SocialTab form={form} setForm={setForm} projectSeo={projectSeo} /> : null}
                {tab === 'schema' ? (
                  <SchemaTab
                    form={form}
                    setForm={setForm}
                    schemaText={schemaText}
                    setSchemaText={setSchemaText}
                    schemaError={schemaError}
                    setSchemaError={setSchemaError}
                    useStructuredBuilder={useStructuredBuilder}
                    setUseStructuredBuilder={setUseStructuredBuilder}
                  />
                ) : null}
                {tab === 'robots' ? <RobotsTab form={form} setForm={setForm} /> : null}
                {tab === 'advanced' ? <AdvancedTab form={form} setForm={setForm} /> : null}
                {tab === 'audit' ? (
                  <AuditTab audit={audit} onQuickFix={applyQuickFix} onSelectNode={onSelectNode} tree={tree} />
                ) : null}
              </div>
            </div>

            <aside className="bld-seo-modal__preview">
              <div className="bld-seo-modal__preview-block">
                <h3>Google preview</h3>
                <SerpPreviewCard title={previewTitle} description={previewDesc} url={canonicalPreview} />
              </div>
              <div className="bld-seo-modal__preview-block">
                <h3>Facebook / LinkedIn</h3>
                <SocialPreviewCard label="Open Graph" title={previewOgTitle} description={previewOgDesc} image={previewOgImage} />
              </div>
              <div className="bld-seo-modal__preview-block">
                <h3>Twitter</h3>
                <SocialPreviewCard label="Twitter card" title={previewTwitterTitle} description={previewTwitterDesc} image={previewTwitterImage} />
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
