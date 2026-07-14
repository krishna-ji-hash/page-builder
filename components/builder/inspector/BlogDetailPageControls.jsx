'use client';

import { resolveBlogDetailPageProps } from '@/lib/blogDetailPageDefaults';

function showBlock(sectionKey, block) {
  if (!sectionKey) return true;
  return sectionKey === block;
}

export default function BlogDetailPageControls({
  selectedNode,
  form,
  onChange,
  jsonErrors = {},
  sectionKey = null,
  sectionLabel = 'Blog detail section',
}) {
  const resolved = resolveBlogDetailPageProps(selectedNode?.props || {});

  return (
    <div className="bld-blog-detail-inspector">
      <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
        <strong>Article content:</strong> add and edit posts in{' '}
        <strong>Admin → Blog workspace</strong> (title, excerpt, body, image, SEO). Published posts
        appear on <code>/blog</code> and <code>/blog/[slug]</code> automatically.
      </p>
      <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
        <strong>Template chrome:</strong> click text on the {sectionLabel} canvas to edit sidebar labels,
        TOC title, and share section. Use the fields below for hero + content blocks on this template preview.
      </p>

      {showBlock(sectionKey, 'hero') ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Category</label>
            <input
              className="bld-input"
              value={form.blogDetailCategory || ''}
              onChange={(e) => onChange('blogDetailCategory', e.target.value)}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Title</label>
            <input
              className="bld-input"
              value={form.blogDetailTitle || ''}
              onChange={(e) => onChange('blogDetailTitle', e.target.value)}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Description</label>
            <textarea
              className="bld-input"
              rows={3}
              value={form.blogDetailDescription || ''}
              onChange={(e) => onChange('blogDetailDescription', e.target.value)}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Hero image URL</label>
            <input
              className="bld-input"
              value={form.blogDetailImage || ''}
              onChange={(e) => onChange('blogDetailImage', e.target.value)}
            />
          </div>
        </>
      ) : null}

      {showBlock(sectionKey, 'article') ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Content blocks (JSON)</label>
            <textarea
              className="bld-input"
              rows={8}
              value={form.blogDetailContentJson || '[]'}
              onChange={(e) => onChange('blogDetailContentJson', e.target.value)}
            />
            {jsonErrors.blogDetailContentJson ? (
              <p className="bld-field-error">{jsonErrors.blogDetailContentJson}</p>
            ) : null}
            <p className="bld-field-note">Preview blocks: {resolved.content.length}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="bld-faq-accordion-inspector__add" onClick={() => onChange('blogDetailAddSection')}>
              + Add section
            </button>
            {resolved.content.length > 1 ? (
              <button
                type="button"
                className="bld-chip bld-chip--danger"
                onClick={() => onChange('blogDetailRemoveSection', resolved.content.length - 1)}
              >
                Remove last section
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {showBlock(sectionKey, 'sidebar') ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Lead form title</label>
            <input
              className="bld-input"
              value={resolved.leadFormTitle}
              onChange={(e) => onChange('blogDetailLeadFormTitle', e.target.value)}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Newsletter title</label>
            <input
              className="bld-input"
              value={resolved.newsletterTitle}
              onChange={(e) => onChange('blogDetailNewsletterTitle', e.target.value)}
            />
          </div>
        </>
      ) : null}

      {showBlock(sectionKey, 'cta') ? (
        <div className="bld-field">
          <label className="bld-label">Related blogs section title</label>
          <input
            className="bld-input"
            value={resolved.relatedTitle}
            onChange={(e) => onChange('blogDetailRelatedTitle', e.target.value)}
          />
        </div>
      ) : null}

      {!sectionKey ? (
        <>
          <div className="bld-field">
            <label className="bld-label">Category</label>
            <input
              className="bld-input"
              value={form.blogDetailCategory || ''}
              onChange={(e) => onChange('blogDetailCategory', e.target.value)}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Title</label>
            <input
              className="bld-input"
              value={form.blogDetailTitle || ''}
              onChange={(e) => onChange('blogDetailTitle', e.target.value)}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Description</label>
            <textarea
              className="bld-input"
              rows={3}
              value={form.blogDetailDescription || ''}
              onChange={(e) => onChange('blogDetailDescription', e.target.value)}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Hero image URL</label>
            <input
              className="bld-input"
              value={form.blogDetailImage || ''}
              onChange={(e) => onChange('blogDetailImage', e.target.value)}
            />
          </div>
          <div className="bld-field">
            <label className="bld-label">Content blocks (JSON)</label>
            <textarea
              className="bld-input"
              rows={8}
              value={form.blogDetailContentJson || '[]'}
              onChange={(e) => onChange('blogDetailContentJson', e.target.value)}
            />
            {jsonErrors.blogDetailContentJson ? (
              <p className="bld-field-error">{jsonErrors.blogDetailContentJson}</p>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button type="button" className="bld-faq-accordion-inspector__add" onClick={() => onChange('blogDetailAddSection')}>
              + Add section
            </button>
            {resolved.content.length > 1 ? (
              <button
                type="button"
                className="bld-chip bld-chip--danger"
                onClick={() => onChange('blogDetailRemoveSection', resolved.content.length - 1)}
              >
                Remove last section
              </button>
            ) : null}
          </div>
          <div className="bld-field">
            <label className="bld-label">Related blogs section title</label>
            <input
              className="bld-input"
              value={resolved.relatedTitle}
              onChange={(e) => onChange('blogDetailRelatedTitle', e.target.value)}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
