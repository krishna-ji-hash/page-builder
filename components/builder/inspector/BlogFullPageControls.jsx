'use client';

import { useMemo, useState } from 'react';
import {
  BLOG_FULL_PAGE_CATEGORIES,
  blogCategoryOptions,
  normalizeBlogPosts,
  resolveBlogFullPageProps,
} from '@/lib/blogFullPageDefaults';

function showBlock(sectionKey, block) {
  if (!sectionKey) return true;
  return sectionKey === block;
}

export default function BlogFullPageControls({
  selectedNode,
  form,
  onChange,
  jsonErrors = {},
  editingViaParent = false,
  onFocusBlogFullPage = null,
  sectionKey = null,
  sectionLabel = 'Blog section',
}) {
  const resolved = resolveBlogFullPageProps(selectedNode?.props || {});
  const posts = normalizeBlogPosts(selectedNode?.props?.posts);
  const categoryOptions = blogCategoryOptions(selectedNode?.props?.categories || BLOG_FULL_PAGE_CATEGORIES);
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredPosts = useMemo(() => {
    if (filterCategory === 'all') return posts.map((post, index) => ({ post, index }));
    return posts
      .map((post, index) => ({ post, index }))
      .filter(({ post }) => post.category === filterCategory);
  }, [posts, filterCategory]);

  const addCategory = filterCategory === 'all' ? 'shipping-guide' : filterCategory;

  return (
    <div className="bld-blog-full-page-inspector">
      {editingViaParent ? (
        <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
          Editing the embedded <strong>{sectionLabel}</strong> block.
          {typeof onFocusBlogFullPage === 'function' ? (
            <>
              {' '}
              <button type="button" className="bld-link-btn" onClick={onFocusBlogFullPage}>
                Select block on canvas
              </button>
            </>
          ) : null}
        </p>
      ) : (
        <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
        <strong>Canvas:</strong> click text, tabs, articles or guides to edit inline. Article changes here
        appear on live <code>/blog/[slug]</code> after you <strong>publish the Blog page</strong>.
      </p>
      )}

      {showBlock(sectionKey, 'hero') ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Hero pill</label>
            <input className="bld-input" value={form.blogFullPageHeroPill || ''} onChange={(e) => onChange('blogFullPageHeroPill', e.target.value)} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Hero title</label>
            <input className="bld-input" value={form.blogFullPageHeroTitle || ''} onChange={(e) => onChange('blogFullPageHeroTitle', e.target.value)} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Hero subtitle</label>
            <textarea className="bld-input" rows={3} value={form.blogFullPageHeroSubtitle || ''} onChange={(e) => onChange('blogFullPageHeroSubtitle', e.target.value)} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Search placeholder</label>
            <input className="bld-input" value={form.blogFullPageSearchPlaceholder || ''} onChange={(e) => onChange('blogFullPageSearchPlaceholder', e.target.value)} />
          </div>
          <div className="bld-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <label className="bld-label" style={{ marginBottom: 0 }}>
                Notification card (optional)
              </label>
              {form.blogFullPageHeroNoteTitle || form.blogFullPageHeroNoteText ? (
                <button
                  type="button"
                  className="bld-chip bld-chip--danger"
                  onClick={() => onChange('blogFullPageClearHeroNote', true)}
                >
                  Remove card
                </button>
              ) : null}
            </div>
            <input
              className="bld-input"
              style={{ marginTop: 8 }}
              value={form.blogFullPageHeroNoteTitle || ''}
              onChange={(e) => onChange('blogFullPageHeroNoteTitle', e.target.value)}
              placeholder="Card title (e.g. New Guide Published)"
            />
            <textarea
              className="bld-input"
              rows={2}
              style={{ marginTop: 8 }}
              value={form.blogFullPageHeroNoteText || ''}
              onChange={(e) => onChange('blogFullPageHeroNoteText', e.target.value)}
              placeholder="Card text — clear both fields to hide the card"
            />
          </div>
          {!sectionKey ? <div className="bld-blog-full-page-inspector__divider" /> : null}
        </>
      ) : null}

      {showBlock(sectionKey, 'tabs') ? (
        <p className="bld-field-note">Click tab labels on the canvas to rename categories.</p>
      ) : null}

      {showBlock(sectionKey, 'featured') ? (
        <>
          <div className="bld-field">
            <label className="bld-label bld-faq-accordion-inspector__heading">Featured article</label>
            <input className="bld-input" value={form.blogFullPageFeaturedTitle || ''} onChange={(e) => onChange('blogFullPageFeaturedTitle', e.target.value)} placeholder="Title" />
            <textarea className="bld-input" rows={3} style={{ marginTop: 8 }} value={form.blogFullPageFeaturedDescription || ''} onChange={(e) => onChange('blogFullPageFeaturedDescription', e.target.value)} placeholder="Description" />
            <input className="bld-input" style={{ marginTop: 8 }} value={form.blogFullPageFeaturedImage || ''} onChange={(e) => onChange('blogFullPageFeaturedImage', e.target.value)} placeholder="Image URL" />
            <input className="bld-input" style={{ marginTop: 8 }} value={form.blogFullPageFeaturedButtonLabel || ''} onChange={(e) => onChange('blogFullPageFeaturedButtonLabel', e.target.value)} placeholder="Button label" />
            <textarea className="bld-input" rows={5} style={{ marginTop: 8 }} value={resolved.featured.body || ''} onChange={(e) => onChange('blogFullPageFeaturedBody', e.target.value)} placeholder="Full article body (shown on Read More)" />
          </div>
          {!sectionKey ? <div className="bld-blog-full-page-inspector__divider" /> : null}
        </>
      ) : null}

      {showBlock(sectionKey, 'articles') ? (
        <>
          {sectionKey === 'articles' ? (
            <div className="bld-field">
              <label className="bld-label">Section title</label>
              <input className="bld-input" value={form.blogFullPageLatestTitle || ''} onChange={(e) => onChange('blogFullPageLatestTitle', e.target.value)} />
            </div>
          ) : null}
          <div className="bld-field">
            <label className="bld-label bld-faq-accordion-inspector__heading">Articles ({posts.length})</label>
            <select className="bld-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ marginBottom: 10 }}>
              <option value="all">All categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <button type="button" className="bld-faq-accordion-inspector__add" onClick={() => onChange('blogFullPageAddPost', { category: addCategory })}>
              + Add article to {categoryOptions.find((c) => c.id === addCategory)?.label || 'Shipping Guide'}
            </button>
          </div>

          {filteredPosts.length ? (
            <ul className="bld-blog-full-page-inspector__list">
              {filteredPosts.map(({ post, index }) => (
                <li key={post.id} className="bld-blog-full-page-inspector__card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <span className="bld-faq-full-page-inspector__card-badge">{categoryOptions.find((c) => c.id === post.category)?.label || post.category}</span>
                    {posts.length > 1 ? (
                      <button type="button" className="bld-chip bld-chip--danger" onClick={() => onChange('blogFullPageRemovePost', index)}>
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="bld-field" style={{ marginBottom: 8 }}>
                    <label className="bld-label">Category</label>
                    <select className="bld-input" value={post.category} onChange={(e) => onChange('blogFullPagePatchPost', { index, patch: { category: e.target.value } })}>
                      {categoryOptions.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bld-field" style={{ marginBottom: 8 }}>
                    <label className="bld-label">Title</label>
                    <input className="bld-input" value={post.title} onChange={(e) => onChange('blogFullPagePatchPost', { index, patch: { title: e.target.value } })} />
                  </div>
                  <div className="bld-field" style={{ marginBottom: 8 }}>
                    <label className="bld-label">Description</label>
                    <textarea className="bld-input" rows={3} value={post.description} onChange={(e) => onChange('blogFullPagePatchPost', { index, patch: { description: e.target.value } })} />
                  </div>
                  <div className="bld-field" style={{ marginBottom: 8 }}>
                    <label className="bld-label">URL slug</label>
                    <input
                      className="bld-input"
                      value={post.slug}
                      onChange={(e) => onChange('blogFullPagePatchPost', { index, patch: { slug: e.target.value } })}
                      placeholder="courier-rate-comparison"
                    />
                    <p className="bld-field-note">Live URL: /blog/{post.slug || 'your-slug'}</p>
                  </div>
                  <div className="bld-field" style={{ marginBottom: 8 }}>
                    <label className="bld-label">Full article body</label>
                    <textarea
                      className="bld-input"
                      rows={5}
                      value={post.body || ''}
                      onChange={(e) => onChange('blogFullPagePatchPost', { index, patch: { body: e.target.value } })}
                      placeholder="Section heading\n\nParagraph text.\n\nNext section heading\n\nMore text."
                    />
                    <p className="bld-field-note">
                      Use blank lines between sections. First line of each block becomes the section heading on the detail page.
                    </p>
                  </div>
                  <div className="bld-field" style={{ marginBottom: 0 }}>
                    <label className="bld-label">Image URL</label>
                    <input className="bld-input" value={post.image} onChange={(e) => onChange('blogFullPagePatchPost', { index, patch: { image: e.target.value } })} />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {!sectionKey ? <div className="bld-blog-full-page-inspector__divider" /> : null}
        </>
      ) : null}

      {showBlock(sectionKey, 'guides') ? (
        <p className="bld-field-note">Click guide titles and text on the canvas to edit each card.</p>
      ) : null}

      {showBlock(sectionKey, 'newsletter') ? (
        <div className="bld-field">
          <label className="bld-label">Newsletter title</label>
          <input className="bld-input" value={form.blogFullPageNewsletterTitle || ''} onChange={(e) => onChange('blogFullPageNewsletterTitle', e.target.value)} />
        </div>
      ) : null}

      {showBlock(sectionKey, 'cta') ? (
        <>
          <div className="bld-field">
            <label className="bld-label">CTA title</label>
            <input className="bld-input" value={form.blogFullPageCtaTitle || ''} onChange={(e) => onChange('blogFullPageCtaTitle', e.target.value)} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Primary button</label>
            <input className="bld-input" value={form.blogFullPageCtaPrimaryLabel || ''} onChange={(e) => onChange('blogFullPageCtaPrimaryLabel', e.target.value)} />
          </div>
          <div className="bld-field">
            <label className="bld-label">Secondary button</label>
            <input className="bld-input" value={form.blogFullPageCtaSecondaryLabel || ''} onChange={(e) => onChange('blogFullPageCtaSecondaryLabel', e.target.value)} />
          </div>
        </>
      ) : null}

      {!sectionKey || sectionKey === 'articles' ? (
        <details className="bld-details" style={{ marginTop: sectionKey ? 12 : 0 }}>
          <summary className="bld-details__summary">Advanced: Posts JSON</summary>
          <div className="bld-field">
            <textarea className="bld-input" rows={8} value={form.blogFullPagePostsJson || '[]'} onChange={(e) => onChange('blogFullPagePostsJson', e.target.value)} />
            {jsonErrors.blogFullPagePostsJson ? <p className="bld-field-error">{jsonErrors.blogFullPagePostsJson}</p> : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}
