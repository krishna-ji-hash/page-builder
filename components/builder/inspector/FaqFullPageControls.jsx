'use client';

import { useMemo, useState } from 'react';
import {
  FAQ_FULL_PAGE_CATEGORIES,
  faqFullPageCategoryOptions,
  normalizeFaqFullPageCategories,
  normalizeFaqFullPageItems,
  resolveFaqFullPageProps,
} from '@/lib/faqFullPageDefaults';

/** FAQ full page — hero/CTA copy + per-tab FAQ items (add/edit/remove). */
export default function FaqFullPageControls({
  selectedNode,
  form,
  onChange,
  jsonErrors = {},
  editingViaParent = false,
  onFocusFaqFullPage = null,
}) {
  const items = normalizeFaqFullPageItems(selectedNode?.props?.items);
  const resolved = resolveFaqFullPageProps(selectedNode?.props || {});
  const categories = normalizeFaqFullPageCategories(selectedNode?.props?.categories || FAQ_FULL_PAGE_CATEGORIES);
  const categoryOptions = faqFullPageCategoryOptions(categories);
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredItems = useMemo(() => {
    if (filterCategory === 'all') return items.map((item, index) => ({ item, index }));
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.category === filterCategory);
  }, [items, filterCategory]);

  const addCategory = filterCategory === 'all' ? 'shipping' : filterCategory;

  return (
    <div className="bld-faq-full-page-inspector">
      {editingViaParent ? (
        <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
          Editing the embedded <strong>FAQ full page</strong> block inside this section.
          {typeof onFocusFaqFullPage === 'function' ? (
            <>
              {' '}
              <button type="button" className="bld-link-btn" onClick={onFocusFaqFullPage}>
                Select block on canvas
              </button>
            </>
          ) : null}
        </p>
      ) : (
        <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
          <strong>Canvas:</strong> click tabs, chips, CTA labels, question or answer to edit. Add FAQs below or with{' '}
          <strong>+ Add FAQ</strong> on canvas.
        </p>
      )}

      <div className="bld-field">
        <label className="bld-label">Hero title</label>
        <input
          className="bld-input"
          value={form.faqFullPageHeroTitle || ''}
          onChange={(e) => onChange('faqFullPageHeroTitle', e.target.value)}
        />
      </div>
      <div className="bld-field">
        <label className="bld-label">Hero subtitle</label>
        <textarea
          className="bld-input"
          rows={3}
          value={form.faqFullPageHeroSubtitle || ''}
          onChange={(e) => onChange('faqFullPageHeroSubtitle', e.target.value)}
        />
      </div>
      <div className="bld-field">
        <label className="bld-label">Search placeholder</label>
        <input
          className="bld-input"
          value={form.faqFullPageSearchPlaceholder || ''}
          onChange={(e) => onChange('faqFullPageSearchPlaceholder', e.target.value)}
        />
      </div>

      <div className="bld-faq-full-page-inspector__divider" />

      <div className="bld-field">
        <label className="bld-label bld-faq-accordion-inspector__heading">Category tabs</label>
        <p className="bld-field-note" style={{ marginTop: 0 }}>
          Edit tab labels shown in the category row on canvas.
        </p>
        <div className="bld-field" style={{ marginBottom: 8 }}>
          <label className="bld-label">Eyebrow label</label>
          <input
            className="bld-input"
            value={form.faqFullPageCategoryEyebrow || ''}
            onChange={(e) => onChange('faqFullPageCategoryEyebrow', e.target.value)}
          />
        </div>
        <ul className="bld-faq-full-page-inspector__list" style={{ marginTop: 8 }}>
          {categories.map((cat) => (
            <li key={cat.id} className="bld-faq-full-page-inspector__card" style={{ padding: '10px 12px' }}>
              <div className="bld-field" style={{ marginBottom: 0 }}>
                <label className="bld-label">{cat.id === 'all' ? 'All tab' : cat.id}</label>
                <input
                  className="bld-input"
                  value={cat.label}
                  onChange={(e) =>
                    onChange('faqFullPagePatchCategory', { id: cat.id, label: e.target.value })
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bld-faq-full-page-inspector__divider" />

      <div className="bld-field">
        <label className="bld-label bld-faq-accordion-inspector__heading">Popular searches</label>
        <ul className="bld-faq-full-page-inspector__list" style={{ marginTop: 8 }}>
          {resolved.popularSearches.map((tag, index) => (
            <li key={`popular-${index}`} className="bld-faq-full-page-inspector__card" style={{ padding: '10px 12px' }}>
              <div className="bld-field" style={{ marginBottom: 8 }}>
                <label className="bld-label">Chip label</label>
                <input
                  className="bld-input"
                  value={tag.label}
                  onChange={(e) =>
                    onChange('faqFullPagePatchPopularSearch', { index, label: e.target.value })
                  }
                />
              </div>
              <div className="bld-field" style={{ marginBottom: 0 }}>
                <label className="bld-label">Search keyword</label>
                <input
                  className="bld-input"
                  value={tag.query}
                  onChange={(e) =>
                    onChange('faqFullPagePatchPopularSearch', { index, query: e.target.value })
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bld-faq-full-page-inspector__divider" />

      <div className="bld-field">
        <label className="bld-label bld-faq-accordion-inspector__heading">
          FAQ items ({items.length})
        </label>
        <div className="bld-faq-full-page-inspector__filter">
          <span className="bld-faq-full-page-inspector__filter-label">Show tab</span>
          <select
            className="bld-input"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="bld-faq-accordion-inspector__add"
          onClick={() => onChange('faqFullPageAddItem', { category: addCategory })}
        >
          + Add FAQ to {categoryOptions.find((c) => c.id === addCategory)?.label || 'Shipping'}
        </button>
      </div>

      {filteredItems.length ? (
        <ul className="bld-faq-full-page-inspector__list">
          {filteredItems.map(({ item, index }) => (
            <li key={String(item.id || index)} className="bld-faq-full-page-inspector__card">
              <div className="bld-faq-full-page-inspector__card-head">
                <span className="bld-faq-full-page-inspector__card-badge">
                  {categoryOptions.find((c) => c.id === item.category)?.label || item.category}
                </span>
                {items.length > 1 ? (
                  <button
                    type="button"
                    className="bld-chip bld-chip--danger"
                    onClick={() => onChange('faqFullPageRemoveItem', index)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="bld-field" style={{ marginBottom: 10 }}>
                <label className="bld-label">Category</label>
                <select
                  className="bld-input"
                  value={item.category}
                  onChange={(e) =>
                    onChange('faqFullPagePatch', { index, patch: { category: e.target.value } })
                  }
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bld-field" style={{ marginBottom: 10 }}>
                <label className="bld-label">Question</label>
                <input
                  className="bld-input"
                  value={item.question}
                  onChange={(e) =>
                    onChange('faqFullPagePatch', { index, patch: { question: e.target.value } })
                  }
                />
              </div>
              <div className="bld-field" style={{ marginBottom: 0 }}>
                <label className="bld-label">Answer</label>
                <textarea
                  className="bld-input"
                  rows={4}
                  value={item.answer}
                  onChange={(e) =>
                    onChange('faqFullPagePatch', { index, patch: { answer: e.target.value } })
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="bld-field-note">No FAQs in this tab yet. Use the add button above.</p>
      )}

      <div className="bld-faq-full-page-inspector__divider" />

      <div className="bld-field">
        <label className="bld-label">CTA title</label>
        <input
          className="bld-input"
          value={form.faqFullPageCtaTitle || ''}
          onChange={(e) => onChange('faqFullPageCtaTitle', e.target.value)}
        />
      </div>
      <div className="bld-field">
        <label className="bld-label">CTA subtitle</label>
        <textarea
          className="bld-input"
          rows={3}
          value={form.faqFullPageCtaSubtitle || ''}
          onChange={(e) => onChange('faqFullPageCtaSubtitle', e.target.value)}
        />
      </div>

      <div className="bld-field">
        <label className="bld-label bld-faq-accordion-inspector__heading">CTA features</label>
        <ul className="bld-faq-full-page-inspector__list" style={{ marginTop: 8 }}>
          {resolved.ctaFeatures.map((feat) => (
            <li key={feat.id} className="bld-faq-full-page-inspector__card" style={{ padding: '10px 12px' }}>
              <div className="bld-field" style={{ marginBottom: 0 }}>
                <label className="bld-label">{feat.id}</label>
                <input
                  className="bld-input"
                  value={feat.label}
                  onChange={(e) =>
                    onChange('faqFullPagePatchCtaFeature', { id: feat.id, label: e.target.value })
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bld-field">
        <label className="bld-label">Primary button label</label>
        <input
          className="bld-input"
          value={form.faqFullPageCtaPrimaryLabel || ''}
          onChange={(e) => onChange('faqFullPageCtaPrimaryLabel', e.target.value)}
        />
      </div>
      <div className="bld-field">
        <label className="bld-label">Primary button link</label>
        <input
          className="bld-input"
          value={form.faqFullPageCtaPrimaryHref || ''}
          onChange={(e) => onChange('faqFullPageCtaPrimaryHref', e.target.value)}
        />
      </div>
      <div className="bld-field">
        <label className="bld-label">Secondary button label</label>
        <input
          className="bld-input"
          value={form.faqFullPageCtaSecondaryLabel || ''}
          onChange={(e) => onChange('faqFullPageCtaSecondaryLabel', e.target.value)}
        />
      </div>
      <div className="bld-field">
        <label className="bld-label">Secondary button link</label>
        <input
          className="bld-input"
          value={form.faqFullPageCtaSecondaryHref || ''}
          onChange={(e) => onChange('faqFullPageCtaSecondaryHref', e.target.value)}
        />
      </div>

      <details className="bld-details">
        <summary className="bld-details__summary">Advanced: Items JSON</summary>
        <div className="bld-field">
          <textarea
            className="bld-input"
            rows={8}
            value={form.faqFullPageJson || '[]'}
            onChange={(e) => onChange('faqFullPageJson', e.target.value)}
          />
          {jsonErrors.faqFullPageJson ? <p className="bld-field-error">{jsonErrors.faqFullPageJson}</p> : null}
        </div>
      </details>
    </div>
  );
}
