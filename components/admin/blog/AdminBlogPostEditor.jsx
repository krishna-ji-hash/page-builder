'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import BlogEditorChecklist from '@/components/admin/blog/BlogEditorChecklist';
import BlogImageField from '@/components/admin/blog/BlogImageField';
import { blogApi, slugify } from '@/components/admin/blog/blogAdminApi';
import { adminBlogPath } from '@/lib/admin/blogAdminRoutes';
import { buildAutoBlogSchemaJsonLd } from '@/lib/blogAutoSchema';
import {
  BLOG_EDITOR_LIMITS,
  blogEditorFieldHints,
  buildBlogEditorChecklist,
  clampWords,
  contentWordCount,
  countChars,
  countWords,
  filledFaqCount,
} from '@/lib/blogEditorLimits';
import {
  BLOG_SCHEMA_TYPE_OPTIONS,
  normalizeBlogSchemaType,
  parseBlogSchemaJsonLd,
  stringifyBlogSchemaJsonLd,
} from '@/lib/blogSchemaMarkup';
import { adminBuilderBlogPostPreviewPath } from '@/lib/builder/adminBuilderRoutes';
import { siteBlogPostHref } from '@/lib/siteBlogPosts';
import '@/styles/admin/platform.css';
import '@/styles/admin/blog.css';

const TABS = [
  { id: 'content', label: 'Content' },
  { id: 'seo', label: 'SEO' },
  { id: 'media', label: 'Media' },
  { id: 'schema', label: 'Schema / FAQ' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'preview', label: 'Preview' },
];

const CUSTOM_SCHEMA_PLACEHOLDER = `{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Your headline",
  "description": "Short summary"
}`;

function emptyLink() {
  return { label: '', url: '' };
}

function emptyForm() {
  return {
    title: '',
    slug: '',
    excerpt: '',
    featuredImage: '',
    featuredImageAlt: '',
    featuredImageCaption: '',
    socialImage: '',
    categoryId: '',
    authorId: '',
    tagNames: [],
    status: 'draft',
    visibility: 'public',
    publishedAt: '',
    scheduledAt: '',
    readTime: '5 min read',
    contentJson: [{ heading: '', text: '' }],
    contentHtml: '',
    faqs: [
      { question: '', answer: '' },
      { question: '', answer: '' },
    ],
    keyTakeaways: [''],
    tocItems: [''],
    internalLinks: [emptyLink()],
    externalLinks: [emptyLink()],
    seoTitle: '',
    seoDescription: '',
    focusKeywords: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    robots: 'index,follow',
    schemaType: 'article',
    schemaJsonLdText: '',
    enableArticleSchema: true,
    enableFaqSchema: false,
    previewChecked: false,
  };
}

function postToForm(post) {
  return {
    ...emptyForm(),
    title: post.title || '',
    slug: post.slug || '',
    excerpt: post.excerpt || '',
    featuredImage: post.featuredImage || '',
    featuredImageAlt: post.featuredImageAlt || '',
    featuredImageCaption: post.featuredImageCaption || '',
    socialImage: post.socialImage || '',
    categoryId: post.categoryId != null ? String(post.categoryId) : '',
    authorId: post.authorId != null ? String(post.authorId) : '',
    tagNames: (post.tags || []).map((t) => t.name),
    status: post.status || 'draft',
    visibility: post.visibility || 'public',
    publishedAt: post.publishedAt ? String(post.publishedAt).slice(0, 16) : '',
    scheduledAt: post.scheduledAt ? String(post.scheduledAt).slice(0, 16) : '',
    readTime: post.readTime || '5 min read',
    contentJson: post.contentJson?.length ? post.contentJson : [{ heading: '', text: '' }],
    contentHtml: post.contentHtml || '',
    faqs: post.faqs?.length >= 2 ? post.faqs : emptyForm().faqs,
    keyTakeaways: post.keyTakeaways?.length ? post.keyTakeaways : [''],
    tocItems: post.tocItems?.length
      ? post.tocItems
      : (post.contentJson || []).map((b) => b.heading).filter(Boolean).length
        ? (post.contentJson || []).map((b) => b.heading).filter(Boolean)
        : [''],
    internalLinks: post.internalLinks?.length ? post.internalLinks : [emptyLink()],
    externalLinks: post.externalLinks?.length ? post.externalLinks : [emptyLink()],
    seoTitle: post.seoTitle || '',
    seoDescription: post.seoDescription || '',
    focusKeywords: post.focusKeywords || '',
    metaKeywords: post.metaKeywords || '',
    canonicalUrl: post.canonicalUrl || '',
    ogTitle: post.ogTitle || '',
    ogDescription: post.ogDescription || '',
    ogImage: post.ogImage || '',
    robots: post.robots || 'index,follow',
    schemaType: normalizeBlogSchemaType(post.schemaType),
    schemaJsonLdText: stringifyBlogSchemaJsonLd(post.schemaJsonLd),
    enableArticleSchema: post.enableArticleSchema !== false,
    enableFaqSchema: Boolean(post.enableFaqSchema),
    previewChecked: Boolean(post.previewChecked),
  };
}

function formToPayload(form) {
  const schemaType = normalizeBlogSchemaType(form.schemaType);
  const payload = {
    title: String(form.title || '').slice(0, BLOG_EDITOR_LIMITS.titleMaxChars),
    slug: form.slug,
    excerpt: clampWords(form.excerpt, BLOG_EDITOR_LIMITS.excerptMaxWords),
    featuredImage: form.featuredImage,
    featuredImageAlt: form.featuredImageAlt,
    featuredImageCaption: form.featuredImageCaption,
    socialImage: form.socialImage,
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    authorId: form.authorId ? Number(form.authorId) : null,
    tagNames: form.tagNames,
    status: form.status,
    visibility: form.visibility,
    publishedAt: form.publishedAt || null,
    scheduledAt: form.scheduledAt || null,
    readTime: form.readTime,
    contentJson: form.contentJson.filter((b) => b.heading || b.text),
    contentHtml: form.contentHtml,
    faqs: form.faqs.filter((f) => f.question || f.answer).slice(0, BLOG_EDITOR_LIMITS.faqMax),
    keyTakeaways: form.keyTakeaways.filter(Boolean),
    tocItems: form.tocItems.filter(Boolean),
    internalLinks: form.internalLinks.filter((l) => l.label || l.url),
    externalLinks: form.externalLinks.filter((l) => l.label || l.url),
    seoTitle: String(form.seoTitle || '').slice(0, BLOG_EDITOR_LIMITS.titleMaxChars),
    seoDescription: String(form.seoDescription || '').slice(0, BLOG_EDITOR_LIMITS.metaDescriptionMaxChars),
    focusKeywords: clampWords(form.focusKeywords, BLOG_EDITOR_LIMITS.focusKeywordsMaxWords),
    metaKeywords: clampWords(form.metaKeywords, BLOG_EDITOR_LIMITS.metaKeywordsMaxWords),
    canonicalUrl: form.canonicalUrl,
    ogTitle: form.ogTitle,
    ogDescription: form.ogDescription,
    ogImage: form.ogImage || form.socialImage || form.featuredImage,
    robots: form.robots,
    enableArticleSchema: Boolean(form.enableArticleSchema),
    enableFaqSchema: Boolean(form.enableFaqSchema),
    previewChecked: Boolean(form.previewChecked),
    schemaType,
    schemaJsonLd: null,
  };

  if (schemaType === 'custom') {
    const parsed = parseBlogSchemaJsonLd(form.schemaJsonLdText);
    if (!parsed.ok) {
      const err = new Error(parsed.error);
      err.code = 'SCHEMA_JSON';
      throw err;
    }
    payload.schemaJsonLd = parsed.value;
  }
  return payload;
}

function Counter({ current, max, unit = 'chars' }) {
  const over = current > max;
  return (
    <small className={over ? 'proj-blog__field-warn' : 'proj-blog__hint'}>
      {current} / {max} {unit}
    </small>
  );
}

export default function AdminBlogPostEditor({ projectId, projectSlug, postId = null }) {
  const router = useRouter();
  const api = useMemo(() => blogApi(projectId), [projectId]);
  const isNew = !postId;
  const [form, setForm] = useState(emptyForm);
  const [slugManual, setSlugManual] = useState(false);
  const [tab, setTab] = useState('content');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const slug = projectSlug || '';
  const listHref = adminBlogPath({ id: projectId, slug }, '', { id: projectId, slug });

  const checklist = useMemo(() => buildBlogEditorChecklist(form), [form]);
  const hints = useMemo(() => blogEditorFieldHints(form), [form]);
  const seoScore = useMemo(() => {
    const scored = checklist.filter((i) => i.id !== 'ready');
    if (!scored.length) return 0;
    return Math.round((scored.filter((i) => i.ok).length / scored.length) * 100);
  }, [checklist]);
  const contentWords = contentWordCount(form);
  const authorName = authors.find((a) => String(a.id) === String(form.authorId))?.name || '';

  const autoSchema = useMemo(
    () =>
      buildAutoBlogSchemaJsonLd({
        ...form,
        authorName,
      }),
    [form, authorName]
  );

  const loadMeta = useCallback(async () => {
    const [cats, auths] = await Promise.all([api.listCategories(), api.listAuthors()]);
    setCategories(cats.categories || []);
    setAuthors(auths.authors || []);
  }, [api]);

  useEffect(() => {
    loadMeta().catch(() => {});
  }, [loadMeta]);

  useEffect(() => {
    if (isNew) return undefined;
    setLoading(true);
    api
      .getPost(postId)
      .then((data) => {
        setForm(postToForm(data.post));
        setSlugManual(true);
      })
      .catch((e) => setError(e?.message || 'Failed to load post'))
      .finally(() => setLoading(false));
    return undefined;
  }, [api, isNew, postId]);

  function patch(partial) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  /** Featured / main image also fills Social share + OG (no separate upload needed). */
  function setFeaturedImage(url) {
    const next = String(url || '').trim();
    setForm((prev) => ({
      ...prev,
      featuredImage: next,
      socialImage: next,
      ogImage: next,
    }));
  }

  function onTitleChange(title) {
    const next = { title: title.slice(0, BLOG_EDITOR_LIMITS.titleMaxChars) };
    if (!slugManual) next.slug = slugify(title);
    // Keep TOC headings loosely in sync when empty/manual not set
    patch(next);
  }

  function syncTocFromContent() {
    const headings = form.contentJson.map((b) => b.heading).filter(Boolean);
    patch({ tocItems: headings.length ? headings : [''] });
  }

  function addTag() {
    const name = tagInput.trim();
    if (!name) return;
    if (!form.tagNames.includes(name)) patch({ tagNames: [...form.tagNames, name] });
    setTagInput('');
  }

  async function save(statusOverride, { softDelete = false } = {}) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (softDelete && !isNew) {
        await api.deletePost(postId);
        router.push(listHref);
        return;
      }

      const payload = formToPayload({
        ...form,
        status: statusOverride || form.status,
      });

      if (statusOverride === 'published') {
        const ready = checklist.find((i) => i.id === 'ready');
        if (ready && !ready.ok) {
          setError('Complete the publishing checklist before publishing (warnings on the right).');
          setBusy(false);
          return;
        }
      }

      if (isNew) {
        const data = await api.createPost(payload);
        setNotice('Post created.');
        router.push(adminBlogPath({ id: projectId, slug }, `${data.post.id}/edit`, { id: projectId, slug }));
        return;
      }
      await api.updatePost(postId, payload);
      const data = await api.getPost(postId);
      setForm(postToForm(data.post));
      setNotice(statusOverride === 'published' ? 'Published.' : 'Saved.');
    } catch (e) {
      setError(e?.message || 'Save failed');
      if (e?.code === 'SCHEMA_JSON') setTab('schema');
    } finally {
      setBusy(false);
    }
  }

  function generateSchemaIntoCustom() {
    if (!autoSchema) {
      setError('Enable Article and/or FAQ schema, then generate.');
      return;
    }
    patch({
      schemaType: 'custom',
      schemaJsonLdText: JSON.stringify(autoSchema, null, 2),
    });
    setNotice('Custom JSON-LD filled from auto schema — edit or save.');
  }

  if (loading) {
    return (
      <div className="proj-blog proj-blog--cms">
        <p className="proj-blog__empty">Loading editor…</p>
      </div>
    );
  }

  const previewHref = form.slug ? siteBlogPostHref(form.slug) : null;
  const builderHref = form.slug
    ? adminBuilderBlogPostPreviewPath({ id: projectId, slug }, form.slug, {
        id: projectId,
        slug,
      })
    : null;

  return (
    <div className="proj-blog proj-blog--cms proj-blog--editor">
      <header className="proj-blog__hero-bar">
        <div>
          <Link href={listHref} className="proj-blog__back">
            ← All Posts
          </Link>
          <h1 className="proj-blog__h1">{isNew ? 'Add New Post' : 'Edit Post'}</h1>
        </div>
        <div className="proj-blog__hero-actions">
          <button type="button" className="proj-blog__btn proj-blog__btn--ghost" disabled={busy} onClick={() => save('draft')}>
            Save draft
          </button>
          {builderHref ? (
            <a className="proj-blog__btn proj-blog__btn--ghost" href={builderHref} target="_blank" rel="noreferrer">
              Admin preview
            </a>
          ) : null}
          <button
            type="button"
            className="proj-blog__btn proj-blog__btn--primary"
            disabled={busy}
            onClick={() => save('published')}
          >
            {isNew ? 'Publish' : 'Update & publish'}
          </button>
        </div>
      </header>

      {error ? <div className="platform-alert platform-alert--error">{error}</div> : null}
      {notice ? <div className="platform-alert platform-alert--success">{notice}</div> : null}

      <div className="proj-blog__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={tab === t.id ? 'is-active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="proj-blog__editor-layout">
        <div className="proj-blog__editor-main">
          {tab === 'content' ? (
            <div className="proj-blog__panel">
              <h3 className="proj-blog__section-title">1. Content</h3>
              <label className="proj-blog__field">
                <span>Title *</span>
                <input value={form.title} onChange={(e) => onTitleChange(e.target.value)} maxLength={BLOG_EDITOR_LIMITS.titleMaxChars} />
                <Counter current={countChars(form.title)} max={BLOG_EDITOR_LIMITS.titleMaxChars} />
              </label>
              <label className="proj-blog__field">
                <span>Slug (auto from title)</span>
                <input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugManual(true);
                    patch({ slug: slugify(e.target.value) });
                  }}
                />
                <small className="proj-blog__hint">Preview: /blog/{form.slug || '…'}</small>
              </label>
              <label className="proj-blog__field">
                <span>Excerpt</span>
                <textarea
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) => patch({ excerpt: e.target.value })}
                  onBlur={() => patch({ excerpt: clampWords(form.excerpt, BLOG_EDITOR_LIMITS.excerptMaxWords) })}
                />
                <Counter current={countWords(form.excerpt)} max={BLOG_EDITOR_LIMITS.excerptMaxWords} unit="words" />
                {hints.excerpt ? <small className="proj-blog__field-warn">{hints.excerpt}</small> : null}
              </label>

              <div className="proj-blog__grid-2">
                <label className="proj-blog__field">
                  <span>Category</span>
                  <select value={form.categoryId} onChange={(e) => patch({ categoryId: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="proj-blog__field">
                  <span>Author</span>
                  <select value={form.authorId} onChange={(e) => patch({ authorId: e.target.value })}>
                    <option value="">Select author</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="proj-blog__field">
                <span>Tags</span>
                <div className="proj-blog__chips">
                  {form.tagNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="proj-blog__chip"
                      onClick={() => patch({ tagNames: form.tagNames.filter((t) => t !== name) })}
                    >
                      {name} ×
                    </button>
                  ))}
                </div>
                <div className="proj-blog__tag-row">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add tag"
                  />
                  <button type="button" className="proj-blog__btn proj-blog__btn--ghost" onClick={addTag}>
                    Add
                  </button>
                </div>
              </div>

              <div className="proj-blog__field">
                <span>Main content blocks</span>
                <Counter
                  current={contentWords}
                  max={BLOG_EDITOR_LIMITS.contentMaxWords}
                  unit={`words (min ${BLOG_EDITOR_LIMITS.contentMinWords})`}
                />
                {hints.content ? <small className="proj-blog__field-warn">{hints.content}</small> : null}
                {form.contentJson.map((block, index) => (
                  <div key={index} className="proj-blog__block-card">
                    <input
                      placeholder="Heading"
                      value={block.heading}
                      onChange={(e) => {
                        const next = [...form.contentJson];
                        next[index] = { ...next[index], heading: e.target.value };
                        patch({ contentJson: next });
                      }}
                    />
                    <textarea
                      rows={4}
                      placeholder="Body text"
                      value={block.text}
                      onChange={(e) => {
                        const next = [...form.contentJson];
                        next[index] = { ...next[index], text: e.target.value };
                        patch({ contentJson: next });
                      }}
                    />
                    <button
                      type="button"
                      className="proj-blog__btn proj-blog__btn--ghost"
                      onClick={() => patch({ contentJson: form.contentJson.filter((_, i) => i !== index) })}
                    >
                      Remove block
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="proj-blog__btn proj-blog__btn--ghost"
                  onClick={() => patch({ contentJson: [...form.contentJson, { heading: '', text: '' }] })}
                >
                  + Add content block
                </button>
              </div>

              <div className="proj-blog__field">
                <span>Table of contents items</span>
                <button type="button" className="proj-blog__btn proj-blog__btn--ghost" onClick={syncTocFromContent}>
                  Sync from headings
                </button>
                {form.tocItems.map((item, index) => (
                  <input
                    key={index}
                    value={item}
                    placeholder={`TOC item ${index + 1}`}
                    onChange={(e) => {
                      const next = [...form.tocItems];
                      next[index] = e.target.value;
                      patch({ tocItems: next });
                    }}
                  />
                ))}
                <button
                  type="button"
                  className="proj-blog__btn proj-blog__btn--ghost"
                  onClick={() => patch({ tocItems: [...form.tocItems, ''] })}
                >
                  + Add TOC item
                </button>
              </div>

              <div className="proj-blog__field">
                <span>Key takeaways</span>
                {form.keyTakeaways.map((item, index) => (
                  <input
                    key={index}
                    value={item}
                    placeholder={`Takeaway ${index + 1}`}
                    onChange={(e) => {
                      const next = [...form.keyTakeaways];
                      next[index] = e.target.value;
                      patch({ keyTakeaways: next });
                    }}
                  />
                ))}
                <button
                  type="button"
                  className="proj-blog__btn proj-blog__btn--ghost"
                  onClick={() => patch({ keyTakeaways: [...form.keyTakeaways, ''] })}
                >
                  + Add takeaway
                </button>
              </div>

              <div className="proj-blog__field">
                <span>Internal links</span>
                {form.internalLinks.map((link, index) => (
                  <div key={index} className="proj-blog__link-row">
                    <input
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => {
                        const next = [...form.internalLinks];
                        next[index] = { ...next[index], label: e.target.value };
                        patch({ internalLinks: next });
                      }}
                    />
                    <input
                      placeholder="/blog/other-post"
                      value={link.url}
                      onChange={(e) => {
                        const next = [...form.internalLinks];
                        next[index] = { ...next[index], url: e.target.value };
                        patch({ internalLinks: next });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="proj-blog__btn proj-blog__btn--ghost"
                  onClick={() => patch({ internalLinks: [...form.internalLinks, emptyLink()] })}
                >
                  + Add internal link
                </button>
              </div>

              <div className="proj-blog__field">
                <span>External links</span>
                {form.externalLinks.map((link, index) => (
                  <div key={index} className="proj-blog__link-row">
                    <input
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => {
                        const next = [...form.externalLinks];
                        next[index] = { ...next[index], label: e.target.value };
                        patch({ externalLinks: next });
                      }}
                    />
                    <input
                      placeholder="https://"
                      value={link.url}
                      onChange={(e) => {
                        const next = [...form.externalLinks];
                        next[index] = { ...next[index], url: e.target.value };
                        patch({ externalLinks: next });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="proj-blog__btn proj-blog__btn--ghost"
                  onClick={() => patch({ externalLinks: [...form.externalLinks, emptyLink()] })}
                >
                  + Add external link
                </button>
              </div>
            </div>
          ) : null}

          {tab === 'seo' ? (
            <div className="proj-blog__panel">
              <h3 className="proj-blog__section-title">2. SEO</h3>
              <label className="proj-blog__field">
                <span>SEO title</span>
                <input
                  value={form.seoTitle}
                  onChange={(e) => patch({ seoTitle: e.target.value.slice(0, BLOG_EDITOR_LIMITS.titleMaxChars) })}
                  placeholder="Defaults to post title"
                />
                <Counter current={countChars(form.seoTitle || form.title)} max={BLOG_EDITOR_LIMITS.titleMaxChars} />
              </label>
              <label className="proj-blog__field">
                <span>Meta description</span>
                <textarea
                  rows={3}
                  value={form.seoDescription}
                  onChange={(e) =>
                    patch({
                      seoDescription: e.target.value.slice(0, BLOG_EDITOR_LIMITS.metaDescriptionMaxChars),
                    })
                  }
                  placeholder={`${BLOG_EDITOR_LIMITS.metaDescriptionMinChars}–${BLOG_EDITOR_LIMITS.metaDescriptionMaxChars} characters`}
                />
                <Counter
                  current={countChars(form.seoDescription)}
                  max={BLOG_EDITOR_LIMITS.metaDescriptionMaxChars}
                />
                {hints.seoDescription ? <small className="proj-blog__field-warn">{hints.seoDescription}</small> : null}
              </label>
              <label className="proj-blog__field">
                <span>Focus keywords (max {BLOG_EDITOR_LIMITS.focusKeywordsMaxWords} words)</span>
                <input
                  value={form.focusKeywords}
                  onChange={(e) => patch({ focusKeywords: e.target.value })}
                  onBlur={() =>
                    patch({ focusKeywords: clampWords(form.focusKeywords, BLOG_EDITOR_LIMITS.focusKeywordsMaxWords) })
                  }
                  placeholder="courier, shipping, NDR"
                />
                <Counter
                  current={countWords(form.focusKeywords)}
                  max={BLOG_EDITOR_LIMITS.focusKeywordsMaxWords}
                  unit="words"
                />
              </label>
              <label className="proj-blog__field">
                <span>Meta keywords (max {BLOG_EDITOR_LIMITS.metaKeywordsMaxWords} words)</span>
                <input
                  value={form.metaKeywords}
                  onChange={(e) => patch({ metaKeywords: e.target.value })}
                  onBlur={() =>
                    patch({ metaKeywords: clampWords(form.metaKeywords, BLOG_EDITOR_LIMITS.metaKeywordsMaxWords) })
                  }
                  placeholder="keyword1 keyword2"
                />
                <Counter
                  current={countWords(form.metaKeywords)}
                  max={BLOG_EDITOR_LIMITS.metaKeywordsMaxWords}
                  unit="words"
                />
              </label>
              <label className="proj-blog__field">
                <span>Canonical URL</span>
                <input value={form.canonicalUrl} onChange={(e) => patch({ canonicalUrl: e.target.value })} />
              </label>
              <label className="proj-blog__field">
                <span>Robots</span>
                <select value={form.robots} onChange={(e) => patch({ robots: e.target.value })}>
                  <option value="index,follow">index / follow</option>
                  <option value="noindex,nofollow">noindex / nofollow</option>
                </select>
              </label>

              <h3 className="proj-blog__section-title">Open Graph</h3>
              <div className="proj-blog__og-card">
                <label className="proj-blog__field">
                  <span>OG title</span>
                  <input value={form.ogTitle} onChange={(e) => patch({ ogTitle: e.target.value })} />
                </label>
                <label className="proj-blog__field">
                  <span>OG description</span>
                  <textarea
                    rows={2}
                    value={form.ogDescription}
                    onChange={(e) => patch({ ogDescription: e.target.value })}
                  />
                </label>
                <BlogImageField
                  projectId={projectId}
                  label="OG image"
                  value={form.ogImage}
                  onChange={(url) => patch({ ogImage: url })}
                  hint="Auto-filled from Featured image. Override only if you need a different share card."
                />
              </div>
            </div>
          ) : null}

          {tab === 'media' ? (
            <div className="proj-blog__panel">
              <h3 className="proj-blog__section-title">3. Media</h3>
              <BlogImageField
                projectId={projectId}
                label="Featured image (main)"
                value={form.featuredImage}
                onChange={setFeaturedImage}
                hint="Upload once — this also sets Social share image and OG image automatically."
              />
              <label className="proj-blog__field">
                <span>Featured image alt text *</span>
                <input
                  value={form.featuredImageAlt}
                  onChange={(e) => patch({ featuredImageAlt: e.target.value })}
                  placeholder="Describe the image for SEO / accessibility"
                />
              </label>
              <label className="proj-blog__field">
                <span>Image caption</span>
                <input
                  value={form.featuredImageCaption}
                  onChange={(e) => patch({ featuredImageCaption: e.target.value })}
                />
              </label>
              <BlogImageField
                projectId={projectId}
                label="Social share image"
                value={form.socialImage}
                onChange={(url) => patch({ socialImage: url })}
                hint="Auto from Featured image. Change only for a different WhatsApp / social card."
              />
              <BlogImageField
                projectId={projectId}
                label="OG image"
                value={form.ogImage}
                onChange={(url) => patch({ ogImage: url })}
                hint="Auto from Featured image. Used for Facebook / LinkedIn link previews."
              />
            </div>
          ) : null}

          {tab === 'schema' ? (
            <div className="proj-blog__panel">
              <h3 className="proj-blog__section-title">4. Schema / FAQ</h3>
              <label className="proj-blog__field proj-blog__field--row">
                <input
                  type="checkbox"
                  checked={form.enableArticleSchema}
                  onChange={(e) => patch({ enableArticleSchema: e.target.checked })}
                />
                Enable Article schema (BlogPosting)
              </label>
              <label className="proj-blog__field proj-blog__field--row">
                <input
                  type="checkbox"
                  checked={form.enableFaqSchema}
                  onChange={(e) => patch({ enableFaqSchema: e.target.checked })}
                />
                Enable FAQ schema
              </label>

              <div className="proj-blog__field">
                <span>
                  FAQ repeater ({BLOG_EDITOR_LIMITS.faqMin}–{BLOG_EDITOR_LIMITS.faqMax})
                </span>
                <Counter current={filledFaqCount(form.faqs)} max={BLOG_EDITOR_LIMITS.faqMax} unit="filled FAQs" />
                {hints.faqs ? <small className="proj-blog__field-warn">{hints.faqs}</small> : null}
                {form.faqs.map((faq, index) => (
                  <div key={index} className="proj-blog__block-card">
                    <input
                      placeholder="Question"
                      value={faq.question}
                      onChange={(e) => {
                        const next = [...form.faqs];
                        next[index] = { ...next[index], question: e.target.value };
                        patch({ faqs: next });
                      }}
                    />
                    <textarea
                      rows={3}
                      placeholder="Answer"
                      value={faq.answer}
                      onChange={(e) => {
                        const next = [...form.faqs];
                        next[index] = { ...next[index], answer: e.target.value };
                        patch({ faqs: next });
                      }}
                    />
                    <button
                      type="button"
                      className="proj-blog__btn proj-blog__btn--ghost"
                      onClick={() => patch({ faqs: form.faqs.filter((_, i) => i !== index) })}
                      disabled={form.faqs.length <= 1}
                    >
                      Remove FAQ
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="proj-blog__btn proj-blog__btn--ghost"
                  disabled={form.faqs.length >= BLOG_EDITOR_LIMITS.faqMax}
                  onClick={() => patch({ faqs: [...form.faqs, { question: '', answer: '' }] })}
                >
                  + Add FAQ
                </button>
              </div>

              <label className="proj-blog__field">
                <span>Schema type</span>
                <select
                  value={form.schemaType}
                  onChange={(e) => patch({ schemaType: normalizeBlogSchemaType(e.target.value) })}
                >
                  {BLOG_SCHEMA_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="proj-blog__schema-actions">
                <button type="button" className="proj-blog__btn proj-blog__btn--ghost" onClick={generateSchemaIntoCustom}>
                  Auto-generate JSON-LD into Custom
                </button>
              </div>

              {form.schemaType === 'custom' ? (
                <label className="proj-blog__field">
                  <span>Custom JSON-LD markup</span>
                  <textarea
                    className="proj-blog__schema-json"
                    rows={14}
                    value={form.schemaJsonLdText}
                    onChange={(e) => patch({ schemaJsonLdText: e.target.value })}
                    placeholder={CUSTOM_SCHEMA_PLACEHOLDER}
                    spellCheck={false}
                  />
                  <small className="proj-blog__hint">
                    Citation / custom schema markup — valid JSON object or array saved to the live page.
                  </small>
                </label>
              ) : (
                <pre className="proj-blog__schema-preview">{JSON.stringify(autoSchema, null, 2) || '—'}</pre>
              )}
            </div>
          ) : null}

          {tab === 'publishing' ? (
            <div className="proj-blog__panel">
              <h3 className="proj-blog__section-title">5. Publishing</h3>
              <div className="proj-blog__grid-2">
                <label className="proj-blog__field">
                  <span>Status</span>
                  <select value={form.status} onChange={(e) => patch({ status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="proj-blog__field">
                  <span>Visibility</span>
                  <select value={form.visibility} onChange={(e) => patch({ visibility: e.target.value })}>
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </label>
              </div>
              <div className="proj-blog__grid-2">
                <label className="proj-blog__field">
                  <span>Publish date</span>
                  <input
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(e) => patch({ publishedAt: e.target.value })}
                  />
                </label>
                <label className="proj-blog__field">
                  <span>Scheduled date</span>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => patch({ scheduledAt: e.target.value })}
                  />
                </label>
              </div>
              <label className="proj-blog__field">
                <span>Read time</span>
                <input value={form.readTime} onChange={(e) => patch({ readTime: e.target.value })} />
              </label>

              <div className="proj-blog__publish-actions">
                <button type="button" className="proj-blog__btn proj-blog__btn--ghost" disabled={busy} onClick={() => save('draft')}>
                  Save draft
                </button>
                <button
                  type="button"
                  className="proj-blog__btn proj-blog__btn--ghost"
                  disabled={busy}
                  onClick={() => {
                    setTab('preview');
                    patch({ previewChecked: true });
                  }}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="proj-blog__btn proj-blog__btn--primary"
                  disabled={busy}
                  onClick={() => save('published')}
                >
                  {isNew ? 'Publish' : 'Update'}
                </button>
                {!isNew ? (
                  <button
                    type="button"
                    className="proj-blog__btn proj-blog__btn--ghost"
                    disabled={busy}
                    onClick={() => save('draft')}
                  >
                    Unpublish (draft)
                  </button>
                ) : null}
                {!isNew ? (
                  <button
                    type="button"
                    className="proj-blog__btn is-danger"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm('Soft-delete this post? It will leave the public site.')) {
                        save(null, { softDelete: true });
                      }
                    }}
                  >
                    Soft delete
                  </button>
                ) : null}
              </div>
              <p className="proj-blog__hint">
                Public live URL shows only <strong>published</strong> posts. Draft/admin preview is separate.
              </p>
            </div>
          ) : null}

          {tab === 'preview' ? (
            <div className="proj-blog__panel">
              <h3 className="proj-blog__section-title">6. Preview</h3>
              <p className="proj-blog__hint">
                Desktop / mobile preview of the shared <code>/blog/[slug]</code> article template. Save the post
                first so the slug resolves. Draft content uses Admin preview (builder); live URL is published-only.
              </p>
              <div className="proj-blog__preview-toolbar">
                <button
                  type="button"
                  className={previewMode === 'desktop' ? 'is-active' : ''}
                  onClick={() => setPreviewMode('desktop')}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  className={previewMode === 'mobile' ? 'is-active' : ''}
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </button>
                <label className="proj-blog__field proj-blog__field--row">
                  <input
                    type="checkbox"
                    checked={form.previewChecked}
                    onChange={(e) => patch({ previewChecked: e.target.checked })}
                  />
                  Mark preview checked
                </label>
                {builderHref ? (
                  <a href={builderHref} target="_blank" rel="noreferrer">
                    Open admin preview
                  </a>
                ) : null}
                {previewHref && form.status === 'published' ? (
                  <a href={previewHref} target="_blank" rel="noreferrer">
                    Open live URL
                  </a>
                ) : null}
              </div>
              <div
                className={[
                  'proj-blog__preview-frame-wrap',
                  previewMode === 'mobile' ? 'is-mobile' : 'is-desktop',
                ].join(' ')}
              >
                {builderHref || (previewHref && form.status === 'published') ? (
                  <iframe
                    title="Blog preview"
                    className="proj-blog__preview-frame"
                    src={builderHref || previewHref}
                  />
                ) : (
                  <p className="proj-blog__empty">Save the post with a slug to load preview.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <BlogEditorChecklist items={checklist} seoScore={seoScore} />
      </div>
    </div>
  );
}
