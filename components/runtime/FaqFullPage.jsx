'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import FeatureTabCanvasField from '@/components/builder/canvas/FeatureTabCanvasField';
import { resolveFaqFullPageProps } from '@/lib/faqFullPageDefaults';

function CategoryIcon({ name }) {
  const common = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true };
  switch (name) {
    case 'shipping':
      return (
        <svg {...common}>
          <path d="M3 7h11v8H3z" strokeLinejoin="round" />
          <path d="M14 10h4l3 3v2h-7V10z" strokeLinejoin="round" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case 'tracking':
      return (
        <svg {...common}>
          <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <circle cx="16" cy="14" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'courier':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M4 19c0-3 2.5-5 5-5s5 2 5 5M14 19c0-2.2 1.8-4 4-4" />
        </svg>
      );
    case 'integrations':
      return (
        <svg {...common}>
          <path d="M8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM16 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
          <path d="M8 6v4a4 4 0 0 0 4 4h0M16 14v4" />
        </svg>
      );
    case 'billing':
      return (
        <svg {...common}>
          <path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V3z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      );
    case 'support':
      return (
        <svg {...common}>
          <path d="M4 11a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-1v-5H7v5H6a2 2 0 0 1-2-2v-4z" />
        </svg>
      );
  }
  return (
    <svg {...common}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function CtaFeatureIcon({ name }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true };
  if (name === 'shield') {
    return (
      <svg {...common}>
        <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
      </svg>
    );
  }
  if (name === 'user') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 20c0-4 3-6 7-6s7 2 7 6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l2.5 2.5L16 9" />
    </svg>
  );
}

function HeroQuestionBubble() {
  return (
    <svg className="live-faq-full-page__hero-illus live-faq-full-page__hero-illus--bubble" viewBox="0 0 120 120" aria-hidden>
      <defs>
        <linearGradient id="faq-bubble-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary, #2563eb)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--color-primary, #2563eb)" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="62" rx="48" ry="44" fill="url(#faq-bubble-grad)" />
      <text x="60" y="72" textAnchor="middle" fontSize="42" fontWeight="700" fill="var(--color-primary, #2563eb)">
        ?
      </text>
    </svg>
  );
}

function HeroPackageIllus() {
  return (
    <svg className="live-faq-full-page__hero-illus live-faq-full-page__hero-illus--package" viewBox="0 0 120 120" aria-hidden>
      <rect x="28" y="38" width="64" height="52" rx="6" fill="var(--token-bg-surface, #fff)" stroke="color-mix(in srgb, var(--color-primary, #2563eb) 25%, transparent)" strokeWidth="2" />
      <path d="M28 52h64" stroke="color-mix(in srgb, var(--color-primary, #2563eb) 25%, transparent)" strokeWidth="2" />
      <rect x="52" y="38" width="16" height="52" fill="color-mix(in srgb, var(--color-primary, #2563eb) 8%, transparent)" />
      <ellipse cx="88" cy="32" rx="18" ry="14" fill="color-mix(in srgb, var(--color-primary, #2563eb) 12%, var(--token-bg-surface))" />
      <text x="88" y="37" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--color-primary, #2563eb)">
        ?
      </text>
    </svg>
  );
}

function CtaHeadsetIllus() {
  return (
    <svg className="live-faq-full-page__cta-headset" viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="46" fill="color-mix(in srgb, var(--color-primary, #2563eb) 10%, var(--token-bg-surface))" />
      <path
        d="M28 48a22 22 0 0 1 44 0v14a6 6 0 0 1-6 6h-4v-8h4a2 2 0 0 0 2-2V48a18 18 0 0 0-36 0v12a2 2 0 0 0 2 2h4v8h-4a6 6 0 0 1-6-6V48z"
        fill="var(--color-primary, #2563eb)"
      />
      <rect x="24" y="58" width="10" height="18" rx="5" fill="var(--color-primary, #2563eb)" />
      <rect x="66" y="58" width="10" height="18" rx="5" fill="var(--color-primary, #2563eb)" />
    </svg>
  );
}

/**
 * Full FAQ page — hero search, category tabs, 2-col accordion, support CTA.
 */
export default function FaqFullPage({
  heroTitle: heroTitleProp,
  heroSubtitle: heroSubtitleProp,
  searchPlaceholder: searchPlaceholderProp,
  popularSearches: popularSearchesProp,
  categoryEyebrow: categoryEyebrowProp,
  categoryTitle: categoryTitleProp,
  categorySubtitle: categorySubtitleProp,
  accordionEyebrow: accordionEyebrowProp,
  accordionTitle: accordionTitleProp,
  accordionSubtitle: accordionSubtitleProp,
  categories: categoriesProp,
  items: itemsProp,
  openItemId: openItemIdProp,
  ctaTitle: ctaTitleProp,
  ctaSubtitle: ctaSubtitleProp,
  ctaFeatures: ctaFeaturesProp,
  ctaPrimary: ctaPrimaryProp,
  ctaSecondary: ctaSecondaryProp,
  builderMode = false,
  builderEditable = false,
  onOpenItemChange,
  onPatchItem,
  onPatchContent,
  onAddItem,
  style,
  className,
}) {
  const resolved = useMemo(
    () =>
      resolveFaqFullPageProps({
        heroTitle: heroTitleProp,
        heroSubtitle: heroSubtitleProp,
        searchPlaceholder: searchPlaceholderProp,
        popularSearches: popularSearchesProp,
        categoryEyebrow: categoryEyebrowProp,
        categoryTitle: categoryTitleProp,
        categorySubtitle: categorySubtitleProp,
        accordionEyebrow: accordionEyebrowProp,
        accordionTitle: accordionTitleProp,
        accordionSubtitle: accordionSubtitleProp,
        categories: categoriesProp,
        items: itemsProp,
        openItemId: openItemIdProp,
        ctaTitle: ctaTitleProp,
        ctaSubtitle: ctaSubtitleProp,
        ctaFeatures: ctaFeaturesProp,
        ctaPrimary: ctaPrimaryProp,
        ctaSecondary: ctaSecondaryProp,
      }),
    [
      heroTitleProp,
      heroSubtitleProp,
      searchPlaceholderProp,
      popularSearchesProp,
      categoryEyebrowProp,
      categoryTitleProp,
      categorySubtitleProp,
      accordionEyebrowProp,
      accordionTitleProp,
      accordionSubtitleProp,
      categoriesProp,
      itemsProp,
      openItemIdProp,
      ctaTitleProp,
      ctaSubtitleProp,
      ctaFeaturesProp,
      ctaPrimaryProp,
      ctaSecondaryProp,
    ]
  );

  const rootId = useId();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState(() => resolved.openItemId || '');

  useEffect(() => {
    const next = String(openItemIdProp ?? resolved.openItemId ?? '').trim();
    if (resolved.items.some((it) => it.id === next)) setOpenId(next);
  }, [openItemIdProp, resolved.openItemId, resolved.items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resolved.items.filter((item) => {
      const catOk = activeCategory === 'all' || item.category === activeCategory;
      if (!catOk) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [resolved.items, activeCategory, searchQuery]);

  useEffect(() => {
    if (!filteredItems.length) {
      setOpenId('');
      return;
    }
    if (!filteredItems.some((it) => it.id === openId)) {
      const first = filteredItems[0].id;
      setOpenId(first);
      onOpenItemChange?.(first);
    }
  }, [filteredItems, openId, onOpenItemChange]);

  const stopCanvasBubble = builderMode
    ? (event) => {
        event.stopPropagation();
      }
    : undefined;

  const canvasEdit = builderMode && builderEditable;

  const toggleItem = useCallback(
    (id, event) => {
      if (event) {
        event.preventDefault();
        if (builderMode) event.stopPropagation();
      }
      const next = openId === id ? '' : id;
      setOpenId(next);
      onOpenItemChange?.(next);
    },
    [openId, builderMode, onOpenItemChange]
  );

  const selectCategory = useCallback(
    (categoryId, event) => {
      if (event) {
        event.preventDefault();
        if (builderMode) event.stopPropagation();
      }
      setActiveCategory(categoryId);
      setSearchQuery('');
    },
    [builderMode]
  );

  const runSearch = useCallback(
    (event) => {
      event?.preventDefault();
      if (builderMode) event?.stopPropagation();
    },
    [builderMode]
  );

  const patchItem = useCallback(
    (itemId, patch) => {
      if (!itemId || !onPatchItem) return;
      onPatchItem(itemId, patch);
    },
    [onPatchItem]
  );

  const patchContent = useCallback(
    (key, value) => {
      if (!onPatchContent) return;
      onPatchContent(key, value);
    },
    [onPatchContent]
  );

  const EditableText = useCallback(
    ({ fieldKey, as = 'span', className: cls, value, multiline = false }) => {
      if (canvasEdit && onPatchContent) {
        return (
          <FeatureTabCanvasField
            as={as}
            className={cls}
            value={value}
            multiline={multiline}
            onCommit={(next) => patchContent(fieldKey, next)}
            onPointerDown={stopCanvasBubble}
          />
        );
      }
      if (as === 'p') return <p className={cls}>{value}</p>;
      if (as === 'h1') return <h1 className={cls}>{value}</h1>;
      if (as === 'h2') return <h2 className={cls}>{value}</h2>;
      return <span className={cls}>{value}</span>;
    },
    [canvasEdit, onPatchContent, patchContent, stopCanvasBubble]
  );

  const activeCategoryLabel =
    resolved.categories.find((c) => c.id === activeCategory)?.label || 'All FAQs';

  const addFaqCategory = activeCategory === 'all' ? 'shipping' : activeCategory;
  const addFaqCategoryLabel =
    resolved.categories.find((c) => c.id === addFaqCategory)?.label || 'Shipping';

  const handleAddItem = useCallback(
    (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      onAddItem?.(addFaqCategory);
    },
    [onAddItem, addFaqCategory]
  );

  return (
    <section
      className={['live-faq-full-page', builderMode ? 'live-faq-full-page--builder' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      data-faq-full-page
    >
      <div className="live-faq-full-page__hero">
        <div className="live-faq-full-page__hero-bg" aria-hidden />
        <HeroQuestionBubble />
        <HeroPackageIllus />
        <div className="live-faq-full-page__container live-faq-full-page__hero-inner">
          <EditableText as="h1" className="live-faq-full-page__hero-title" fieldKey="heroTitle" value={resolved.heroTitle} />
          <EditableText
            as="p"
            className="live-faq-full-page__hero-subtitle"
            fieldKey="heroSubtitle"
            value={resolved.heroSubtitle}
            multiline
          />
          <form className="live-faq-full-page__search" onSubmit={runSearch} onPointerDown={stopCanvasBubble}>
            <span className="live-faq-full-page__search-icon" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
            </span>
            <input
              type="search"
              className="live-faq-full-page__search-input"
              placeholder={resolved.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search FAQ"
            />
            <button type="submit" className="live-faq-full-page__search-btn">
              Search
            </button>
          </form>
          <div className="live-faq-full-page__popular">
            <span className="live-faq-full-page__popular-label">Popular Searches:</span>
            <div className="live-faq-full-page__popular-chips">
              {resolved.popularSearches.map((tag, index) =>
                canvasEdit ? (
                  <FeatureTabCanvasField
                    key={`${tag.label}-${index}`}
                    as="span"
                    className="live-faq-full-page__popular-chip live-faq-full-page__editable"
                    value={tag.label}
                    onCommit={(next) => patchContent(`popularSearchLabel:${index}`, next)}
                    onPointerDown={stopCanvasBubble}
                  />
                ) : (
                  <button
                    key={`${tag.label}-${index}`}
                    type="button"
                    className="live-faq-full-page__popular-chip"
                    onClick={(e) => {
                      if (builderMode) e.stopPropagation();
                      setSearchQuery(tag.query);
                      setActiveCategory('all');
                    }}
                  >
                    {tag.label}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="live-faq-full-page__body">
        <div className="live-faq-full-page__container">
          {canvasEdit ? (
            <p className="live-faq-full-page__builder-hint" aria-hidden>
              Click tabs, chips, CTA labels to edit · click question/answer to edit · add FAQs per tab below
            </p>
          ) : null}
          <div className="live-faq-full-page__tabs-bar">
            <div className="live-faq-full-page__tabs-meta">
              <EditableText
                as="span"
                className="live-faq-full-page__eyebrow"
                fieldKey="categoryEyebrow"
                value={resolved.categoryEyebrow}
              />
              <p className="live-faq-full-page__tabs-hint">
                {filteredItems.length} question{filteredItems.length === 1 ? '' : 's'} in{' '}
                <strong>{activeCategoryLabel}</strong>
              </p>
            </div>
            <div className="live-faq-full-page__tabs-wrap" role="tablist" aria-label="FAQ categories" onPointerDown={stopCanvasBubble}>
              {resolved.categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`live-faq-full-page__tab${isActive ? ' is-active' : ''}`}
                    onClick={(e) => selectCategory(cat.id, e)}
                  >
                    <span className="live-faq-full-page__tab-icon">
                      <CategoryIcon name={cat.icon || cat.id} />
                    </span>
                    {canvasEdit ? (
                      <FeatureTabCanvasField
                        as="span"
                        className="live-faq-full-page__tab-label live-faq-full-page__editable"
                        value={cat.label}
                        onCommit={(next) => patchContent(`categoryLabel:${cat.id}`, next)}
                        onPointerDown={stopCanvasBubble}
                      />
                    ) : (
                      <span className="live-faq-full-page__tab-label">{cat.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="live-faq-full-page__accordion-grid">
            {filteredItems.length ? (
              filteredItems.map((item) => {
                const isOpen = item.id === openId;
                const panelId = `${rootId}-panel-${item.id}`;
                const triggerId = `${rootId}-trigger-${item.id}`;
                return (
                  <article
                    key={item.id}
                    className={`live-faq-full-page__accordion-item${isOpen ? ' is-open' : ''}`}
                    data-category={item.category}
                  >
                    {canvasEdit ? (
                      <span className="live-faq-full-page__item-category" aria-hidden>
                        {resolved.categories.find((c) => c.id === item.category)?.label || item.category}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      id={triggerId}
                      className="live-faq-full-page__accordion-toggle"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={(e) => toggleItem(item.id, e)}
                      onPointerDown={stopCanvasBubble}
                    >
                      <span className="live-faq-full-page__accordion-icon" aria-hidden>
                        {isOpen ? '−' : '+'}
                      </span>
                      {canvasEdit ? (
                        <FeatureTabCanvasField
                          as="span"
                          className="live-faq-full-page__accordion-question live-faq-full-page__editable"
                          value={item.question}
                          onCommit={(next) => patchItem(item.id, { question: next })}
                          onPointerDown={stopCanvasBubble}
                        />
                      ) : (
                        <span className="live-faq-full-page__accordion-question">{item.question}</span>
                      )}
                      <span className="live-faq-full-page__accordion-chevron" aria-hidden />
                    </button>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      className="live-faq-full-page__accordion-panel"
                      hidden={!isOpen}
                      onPointerDown={stopCanvasBubble}
                    >
                      {canvasEdit ? (
                        <FeatureTabCanvasField
                          as="p"
                          className="live-faq-full-page__accordion-answer live-faq-full-page__editable"
                          value={item.answer}
                          multiline
                          onCommit={(next) => patchItem(item.id, { answer: next })}
                          onPointerDown={stopCanvasBubble}
                        />
                      ) : (
                        <p className="live-faq-full-page__accordion-answer">{item.answer}</p>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="live-faq-full-page__empty">
                <p>No questions match your search.</p>
                <button
                  type="button"
                  className="live-faq-full-page__empty-reset"
                  onClick={(e) => {
                    if (builderMode) e.stopPropagation();
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {canvasEdit && typeof onAddItem === 'function' ? (
            <div className="live-faq-full-page__add-wrap" onPointerDown={stopCanvasBubble}>
              <button type="button" className="live-faq-full-page__add-btn" onClick={handleAddItem}>
                + Add FAQ to {addFaqCategoryLabel}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="live-faq-full-page__cta-wrap">
        <div className="live-faq-full-page__container">
          <div className="live-faq-full-page__cta">
            <div className="live-faq-full-page__cta-visual" aria-hidden>
              <CtaHeadsetIllus />
            </div>
            <div className="live-faq-full-page__cta-body">
              <EditableText as="h2" className="live-faq-full-page__cta-title" fieldKey="ctaTitle" value={resolved.ctaTitle} />
              <EditableText
                as="p"
                className="live-faq-full-page__cta-subtitle"
                fieldKey="ctaSubtitle"
                value={resolved.ctaSubtitle}
                multiline
              />
              <ul className="live-faq-full-page__cta-features">
                {resolved.ctaFeatures.map((feat) => (
                  <li key={feat.id}>
                    <span className="live-faq-full-page__cta-feature-icon">
                      <CtaFeatureIcon name={feat.icon} />
                    </span>
                    {canvasEdit ? (
                      <FeatureTabCanvasField
                        as="span"
                        className="live-faq-full-page__cta-feature-label live-faq-full-page__editable"
                        value={feat.label}
                        onCommit={(next) => patchContent(`ctaFeatureLabel:${feat.id}`, next)}
                        onPointerDown={stopCanvasBubble}
                      />
                    ) : (
                      feat.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="live-faq-full-page__cta-actions" onPointerDown={stopCanvasBubble}>
              <a href={resolved.ctaPrimary.href} className="live-faq-full-page__cta-btn live-faq-full-page__cta-btn--primary">
                <span className="live-faq-full-page__cta-btn-icon" aria-hidden>
                  <CategoryIcon name="support" />
                </span>
                {canvasEdit ? (
                  <FeatureTabCanvasField
                    as="span"
                    className="live-faq-full-page__cta-btn-text live-faq-full-page__editable"
                    value={resolved.ctaPrimary.label}
                    onCommit={(next) => patchContent('ctaPrimaryLabel', next)}
                    onPointerDown={stopCanvasBubble}
                  />
                ) : (
                  <span className="live-faq-full-page__cta-btn-text">{resolved.ctaPrimary.label}</span>
                )}
                <span className="live-faq-full-page__cta-btn-arrow" aria-hidden>
                  →
                </span>
              </a>
              <a href={resolved.ctaSecondary.href} className="live-faq-full-page__cta-btn live-faq-full-page__cta-btn--secondary">
                <span className="live-faq-full-page__cta-btn-icon" aria-hidden>
                  <CategoryIcon name="billing" />
                </span>
                {canvasEdit ? (
                  <FeatureTabCanvasField
                    as="span"
                    className="live-faq-full-page__cta-btn-text live-faq-full-page__editable"
                    value={resolved.ctaSecondary.label}
                    onCommit={(next) => patchContent('ctaSecondaryLabel', next)}
                    onPointerDown={stopCanvasBubble}
                  />
                ) : (
                  <span className="live-faq-full-page__cta-btn-text">{resolved.ctaSecondary.label}</span>
                )}
                <span className="live-faq-full-page__cta-btn-arrow" aria-hidden>
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
