'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FeatureTabCanvasField from '@/components/builder/canvas/FeatureTabCanvasField';
import { resolveBlogFullPageProps } from '@/lib/blogFullPageDefaults';
import {
  getBlogHubState,
  publishBlogHubCategory,
  publishBlogHubSearch,
  subscribeBlogHubCategory,
  subscribeBlogHubSearch,
} from '@/lib/blogHubBus';

function TabIcon({ name }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true,
  };
  if (name === 'shipping' || name === '🚚') {
    return (
      <svg {...common}>
        <path d="M3 7h11v8H3z" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    );
  }
  if (name === 'tracking' || name === '📍') {
    return (
      <svg {...common}>
        <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      </svg>
    );
  }
  if (name === 'wallet' || name === '💳') {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
      </svg>
    );
  }
  if (name === 'cart' || name === '🛒') {
    return (
      <svg {...common}>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M3 4h2l2.5 12h11l2-8H7" />
      </svg>
    );
  }
  if (/[\u{1F300}-\u{1FAFF}]/u.test(String(name))) {
    return <span aria-hidden>{name}</span>;
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

function HeroVisual() {
  return (
    <div className="live-blog-full-page__hero-visual" aria-hidden>
      <div className="live-blog-full-page__visual-card" />
    </div>
  );
}

function CtaVisual() {
  return (
    <div className="live-blog-full-page__cta-visual" aria-hidden>
      <div className="live-blog-full-page__dash-card" />
    </div>
  );
}

function ArticleBody({ body, bodyFieldKey, canvasEdit, onPatchContent, stopCanvasBubble }) {
  const text = String(body || '').trim();
  if (canvasEdit && onPatchContent) {
    return (
      <FeatureTabCanvasField
        as="div"
        className="live-blog-full-page__article-body live-blog-full-page__editable"
        value={text}
        multiline
        onCommit={(next) => onPatchContent(bodyFieldKey, next)}
        onPointerDown={stopCanvasBubble}
      />
    );
  }
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  return (
    <div className="live-blog-full-page__article-body">
      {paragraphs.length ? (
        paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
      ) : (
        <p>Add your full article content here.</p>
      )}
    </div>
  );
}

export default function BlogFullPage({
  heroPill: heroPillProp,
  heroTitle: heroTitleProp,
  heroSubtitle: heroSubtitleProp,
  searchPlaceholder: searchPlaceholderProp,
  popularTopics: popularTopicsProp,
  heroStats: heroStatsProp,
  heroNoteTitle: heroNoteTitleProp,
  heroNoteText: heroNoteTextProp,
  categories: categoriesProp,
  featured: featuredProp,
  latestKicker: latestKickerProp,
  latestTitle: latestTitleProp,
  latestSubtitle: latestSubtitleProp,
  latestViewAllLabel: latestViewAllLabelProp,
  latestViewAllHref: latestViewAllHrefProp,
  posts: postsProp,
  guidesKicker: guidesKickerProp,
  guidesTitle: guidesTitleProp,
  guidesSubtitle: guidesSubtitleProp,
  guidesViewAllLabel: guidesViewAllLabelProp,
  guidesViewAllHref: guidesViewAllHrefProp,
  guides: guidesProp,
  newsletterTitle: newsletterTitleProp,
  newsletterSubtitle: newsletterSubtitleProp,
  newsletterPlaceholder: newsletterPlaceholderProp,
  newsletterButtonLabel: newsletterButtonLabelProp,
  ctaPill: ctaPillProp,
  ctaTitle: ctaTitleProp,
  ctaSubtitle: ctaSubtitleProp,
  ctaPrimaryLabel: ctaPrimaryLabelProp,
  ctaPrimaryHref: ctaPrimaryHrefProp,
  ctaSecondaryLabel: ctaSecondaryLabelProp,
  ctaSecondaryHref: ctaSecondaryHrefProp,
  builderMode = false,
  builderEditable = false,
  onPatchContent,
  onPatchPost,
  onAddPost,
  sectionOnly = null,
  blogHubGroupId = 'default',
  style,
  className,
}) {
  const resolved = useMemo(
    () =>
      resolveBlogFullPageProps({
        heroPill: heroPillProp,
        heroTitle: heroTitleProp,
        heroSubtitle: heroSubtitleProp,
        searchPlaceholder: searchPlaceholderProp,
        popularTopics: popularTopicsProp,
        heroStats: heroStatsProp,
        heroNoteTitle: heroNoteTitleProp,
        heroNoteText: heroNoteTextProp,
        categories: categoriesProp,
        featured: featuredProp,
        latestKicker: latestKickerProp,
        latestTitle: latestTitleProp,
        latestSubtitle: latestSubtitleProp,
        latestViewAllLabel: latestViewAllLabelProp,
        latestViewAllHref: latestViewAllHrefProp,
        posts: postsProp,
        guidesKicker: guidesKickerProp,
        guidesTitle: guidesTitleProp,
        guidesSubtitle: guidesSubtitleProp,
        guidesViewAllLabel: guidesViewAllLabelProp,
        guidesViewAllHref: guidesViewAllHrefProp,
        guides: guidesProp,
        newsletterTitle: newsletterTitleProp,
        newsletterSubtitle: newsletterSubtitleProp,
        newsletterPlaceholder: newsletterPlaceholderProp,
        newsletterButtonLabel: newsletterButtonLabelProp,
        ctaPill: ctaPillProp,
        ctaTitle: ctaTitleProp,
        ctaSubtitle: ctaSubtitleProp,
        ctaPrimaryLabel: ctaPrimaryLabelProp,
        ctaPrimaryHref: ctaPrimaryHrefProp,
        ctaSecondaryLabel: ctaSecondaryLabelProp,
        ctaSecondaryHref: ctaSecondaryHrefProp,
      }),
    [
      heroPillProp,
      heroTitleProp,
      heroSubtitleProp,
      searchPlaceholderProp,
      popularTopicsProp,
      heroStatsProp,
      heroNoteTitleProp,
      heroNoteTextProp,
      categoriesProp,
      featuredProp,
      latestKickerProp,
      latestTitleProp,
      latestSubtitleProp,
      latestViewAllLabelProp,
      latestViewAllHrefProp,
      postsProp,
      guidesKickerProp,
      guidesTitleProp,
      guidesSubtitleProp,
      guidesViewAllLabelProp,
      guidesViewAllHrefProp,
      guidesProp,
      newsletterTitleProp,
      newsletterSubtitleProp,
      newsletterPlaceholderProp,
      newsletterButtonLabelProp,
      ctaPillProp,
      ctaTitleProp,
      ctaSubtitleProp,
      ctaPrimaryLabelProp,
      ctaPrimaryHrefProp,
      ctaSecondaryLabelProp,
      ctaSecondaryHrefProp,
    ]
  );

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openPostId, setOpenPostId] = useState(null);
  const mainRef = useRef(null);

  const canvasEdit = builderMode && builderEditable;
  const stopCanvasBubble = builderMode ? (e) => e.stopPropagation() : undefined;

  const patchContent = useCallback(
    (key, value) => {
      if (onPatchContent) onPatchContent(key, value);
    },
    [onPatchContent]
  );

  const categoryLabel = (id) =>
    resolved.categories.find((c) => c.id === id)?.label || id;

  const hubGroup = String(blogHubGroupId || 'default').trim() || 'default';
  const usesHubBus = Boolean(sectionOnly);

  const selectCategory = useCallback(
    (categoryId, { clearSearch = true } = {}) => {
      const nextCategory = String(categoryId || 'all').trim() || 'all';
      setActiveCategory(nextCategory);
      if (clearSearch) {
        setSearchQuery('');
        if (usesHubBus) publishBlogHubSearch('', hubGroup);
      }
      if (usesHubBus) publishBlogHubCategory(nextCategory, hubGroup);
      if (usesHubBus && sectionOnly === 'tabs' && typeof document !== 'undefined') {
        requestAnimationFrame(() => {
          const articlesSection = document.querySelector(
            `[data-blog-hub-group="${hubGroup}"][data-blog-section="articles"]`
          );
          articlesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    },
    [hubGroup, sectionOnly, usesHubBus]
  );

  const submitHubSearch = useCallback(
    (query) => {
      const nextQuery = String(query ?? '');
      setSearchQuery(nextQuery);
      if (usesHubBus) publishBlogHubSearch(nextQuery, hubGroup);
    },
    [hubGroup, usesHubBus]
  );

  useEffect(() => {
    if (!usesHubBus) return undefined;
    const { categoryId, searchQuery: savedSearch } = getBlogHubState(hubGroup);
    if (sectionOnly === 'tabs' || sectionOnly === 'articles') {
      setActiveCategory(categoryId || 'all');
    }
    if (sectionOnly === 'articles' || sectionOnly === 'hero') {
      setSearchQuery(savedSearch || '');
    }
    const unsubCategory =
      sectionOnly === 'tabs' || sectionOnly === 'articles'
        ? subscribeBlogHubCategory((nextCategory) => {
            setActiveCategory(nextCategory);
          }, hubGroup)
        : () => {};
    const unsubSearch =
      sectionOnly === 'articles' || sectionOnly === 'hero'
        ? subscribeBlogHubSearch((nextQuery) => {
            setSearchQuery(nextQuery);
          }, hubGroup)
        : () => {};
    return () => {
      unsubCategory();
      unsubSearch();
    };
  }, [hubGroup, sectionOnly, usesHubBus]);

  const openArticle = useCallback(
    (postId, event) => {
      if (event) {
        event.preventDefault();
        if (builderMode) event.stopPropagation();
      }
      setOpenPostId(postId);
    },
    [builderMode]
  );

  const closeArticle = useCallback(
    (event) => {
      if (event) {
        event.preventDefault();
        if (builderMode) event.stopPropagation();
      }
      setOpenPostId(null);
    },
    [builderMode]
  );

  const openArticleData = useMemo(() => {
    if (!openPostId) return null;
    if (openPostId === 'featured') {
      const featured = resolved.featured;
      return {
        id: 'featured',
        title: featured.title,
        description: featured.description,
        body: featured.body,
        image: featured.image,
        readTime: featured.readTime,
        categoryLabel: featured.metaCategory,
        bodyFieldKey: 'featured.body',
      };
    }
    const post = resolved.posts.find((item) => item.id === openPostId);
    if (!post) return null;
    return {
      id: post.id,
      title: post.title,
      description: post.description,
      body: post.body,
      image: post.image,
      readTime: post.readTime,
      categoryLabel: categoryLabel(post.category),
      bodyFieldKey: `postBody:${post.id}`,
    };
  }, [openPostId, resolved.featured, resolved.posts, resolved.categories]);

  useEffect(() => {
    if (!openPostId || !mainRef.current) return;
    mainRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [openPostId]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resolved.posts.filter((post) => {
      const catOk = activeCategory === 'all' || post.category === activeCategory;
      if (!catOk) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        categoryLabel(post.category).toLowerCase().includes(q)
      );
    });
  }, [resolved.posts, activeCategory, searchQuery, resolved.categories]);

  const addPostCategory = activeCategory === 'all' ? 'shipping-guide' : activeCategory;

  const showHero = !sectionOnly || sectionOnly === 'hero';
  const showTabs = !sectionOnly || sectionOnly === 'tabs';
  const showFeatured = !sectionOnly || sectionOnly === 'featured';
  const showArticles = !sectionOnly || sectionOnly === 'articles';
  const showGuides = !sectionOnly || sectionOnly === 'guides';
  const showNewsletter = !sectionOnly || sectionOnly === 'newsletter';
  const showCta = !sectionOnly || sectionOnly === 'cta';
  const articleDetailAllowed =
    !sectionOnly || sectionOnly === 'featured' || sectionOnly === 'articles';
  const showArticleDetail = canvasEdit && articleDetailAllowed && openArticleData;

  const RootTag = sectionOnly ? 'div' : 'main';

  const Editable = useCallback(
    ({ fieldKey, as = 'span', className: cls, value, multiline = false }) => {
      if (canvasEdit && onPatchContent) {
        return (
          <FeatureTabCanvasField
            as={as}
            className={`${cls} live-blog-full-page__editable`}
            value={value}
            multiline={multiline}
            onCommit={(next) => patchContent(fieldKey, next)}
            onPointerDown={stopCanvasBubble}
          />
        );
      }
      if (as === 'h1') return <h1 className={cls}>{value}</h1>;
      if (as === 'h2') return <h2 className={cls}>{value}</h2>;
      if (as === 'h3') return <h3 className={cls}>{value}</h3>;
      if (as === 'p') return <p className={cls}>{value}</p>;
      if (as === 'strong') return <strong className={cls}>{value}</strong>;
      return <span className={cls}>{value}</span>;
    },
    [canvasEdit, onPatchContent, patchContent, stopCanvasBubble]
  );

  return (
    <RootTag
      ref={mainRef}
      className={[
        'live-blog-full-page',
        builderMode ? 'live-blog-full-page--builder' : '',
        sectionOnly ? 'live-blog-full-page--section' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      data-blog-full-page={sectionOnly ? undefined : true}
      data-blog-section={sectionOnly || undefined}
      data-blog-hub-group={usesHubBus ? hubGroup : undefined}
      data-blog-article-open={showArticleDetail ? 'true' : undefined}
    >
      {showArticleDetail ? (
        <section className="live-blog-full-page__article" aria-labelledby="blog-article-title">
          <div className="live-blog-full-page__container">
            <button
              type="button"
              className="live-blog-full-page__back-btn"
              onClick={closeArticle}
              onPointerDown={stopCanvasBubble}
            >
              ← Back to Blog
            </button>
            {openArticleData.image ? (
              <div className="live-blog-full-page__article-hero">
                <img src={openArticleData.image} alt={openArticleData.title} />
              </div>
            ) : null}
            <div className="live-blog-full-page__article-meta">
              <span>{openArticleData.categoryLabel}</span>
              <span aria-hidden>•</span>
              <span>{openArticleData.readTime}</span>
            </div>
            {canvasEdit ? (
              <FeatureTabCanvasField
                as="h1"
                id="blog-article-title"
                className="live-blog-full-page__article-title live-blog-full-page__editable"
                value={openArticleData.title}
                onCommit={(next) => {
                  if (openArticleData.id === 'featured') {
                    patchContent('featured.title', next);
                  } else {
                    onPatchPost?.(openArticleData.id, { title: next });
                  }
                }}
                onPointerDown={stopCanvasBubble}
              />
            ) : (
              <h1 id="blog-article-title" className="live-blog-full-page__article-title">
                {openArticleData.title}
              </h1>
            )}
            <ArticleBody
              body={openArticleData.body}
              bodyFieldKey={openArticleData.bodyFieldKey}
              canvasEdit={canvasEdit}
              onPatchContent={patchContent}
              stopCanvasBubble={stopCanvasBubble}
            />
          </div>
        </section>
      ) : (
        <>
      {showHero ? (
      <section className="live-blog-full-page__hero">
        <div
          className={[
            'live-blog-full-page__container',
            sectionOnly === 'hero' ? 'live-blog-full-page__hero-grid--single' : 'live-blog-full-page__hero-grid',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div>
            <Editable as="span" className="live-blog-full-page__pill" fieldKey="heroPill" value={resolved.heroPill} />
            <Editable as="h1" className="live-blog-full-page__hero-title" fieldKey="heroTitle" value={resolved.heroTitle} />
            <Editable
              as="p"
              className="live-blog-full-page__hero-subtitle"
              fieldKey="heroSubtitle"
              value={resolved.heroSubtitle}
              multiline
            />
            <form
              className="live-blog-full-page__search-panel"
              onSubmit={(e) => {
                e.preventDefault();
                if (builderMode) e.stopPropagation();
                if (sectionOnly === 'hero') submitHubSearch(searchQuery);
              }}
              onPointerDown={stopCanvasBubble}
            >
              <div className="live-blog-full-page__search-input-wrap">
                <span aria-hidden>⌕</span>
                <input
                  type="search"
                  placeholder={resolved.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSearchQuery(next);
                    if (sectionOnly === 'hero') submitHubSearch(next);
                  }}
                  aria-label="Search blog"
                />
              </div>
              <button
                type="submit"
                className="live-blog-full-page__search-btn"
                onClick={(e) => {
                  if (sectionOnly === 'hero') {
                    e.preventDefault();
                    submitHubSearch(searchQuery);
                  }
                }}
              >
                Search →
              </button>
            </form>
            <div className="live-blog-full-page__topics">
              <strong>Popular:</strong>
              {resolved.popularTopics.map((topic, index) =>
                canvasEdit ? (
                  <FeatureTabCanvasField
                    key={`topic-${index}`}
                    as="span"
                    className="live-blog-full-page__topic-chip live-blog-full-page__editable"
                    value={topic.label}
                    onCommit={(next) => patchContent(`popularTopic:${index}`, next)}
                    onPointerDown={stopCanvasBubble}
                  />
                ) : (
                  <span key={`topic-${index}`} className="live-blog-full-page__topic-chip">
                    {topic.label}
                  </span>
                )
              )}
            </div>
            <div className="live-blog-full-page__stats">
              {resolved.heroStats.map((stat) => (
                <div key={stat.id} className="live-blog-full-page__stat">
                  {canvasEdit ? (
                    <>
                      <FeatureTabCanvasField
                        as="strong"
                        className="live-blog-full-page__editable"
                        value={stat.value}
                        onCommit={(next) => patchContent(`heroStatValue:${stat.id}`, next)}
                        onPointerDown={stopCanvasBubble}
                      />
                      <FeatureTabCanvasField
                        as="span"
                        className="live-blog-full-page__editable"
                        value={stat.label}
                        onCommit={(next) => patchContent(`heroStatLabel:${stat.id}`, next)}
                        onPointerDown={stopCanvasBubble}
                      />
                    </>
                  ) : (
                    <>
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          {sectionOnly !== 'hero' ? (
          <div>
            <HeroVisual />
            {resolved.heroNoteTitle || resolved.heroNoteText ? (
              <div className="live-blog-full-page__hero-note">
                {canvasEdit ? (
                  <button
                    type="button"
                    className="live-blog-full-page__hero-note-remove"
                    aria-label="Remove notification card"
                    onClick={(event) => {
                      if (builderMode) event.stopPropagation();
                      patchContent('heroNote.clear', true);
                    }}
                    onPointerDown={stopCanvasBubble}
                  >
                    ×
                  </button>
                ) : null}
                <Editable as="strong" fieldKey="heroNoteTitle" value={resolved.heroNoteTitle} />
                <Editable as="span" fieldKey="heroNoteText" value={resolved.heroNoteText} multiline />
              </div>
            ) : canvasEdit ? (
              <button
                type="button"
                className="live-blog-full-page__hero-note-add"
                onClick={(event) => {
                  if (builderMode) event.stopPropagation();
                  patchContent('heroNote.restore', true);
                }}
                onPointerDown={stopCanvasBubble}
              >
                + Add notification card
              </button>
            ) : null}
          </div>
          ) : null}
        </div>
      </section>
      ) : null}

      {showTabs ? (
      <section className="live-blog-full-page__tabs-section">
        <div className="live-blog-full-page__container">
          {canvasEdit ? (
            <p className="live-blog-full-page__builder-hint" aria-hidden>
              {sectionOnly === 'tabs'
                ? 'Click tabs to filter the Blog Articles section on this page · click labels to rename'
                : 'Click tab labels to edit · filter articles · add posts from inspector or button below'}
            </p>
          ) : null}
          <div className="live-blog-full-page__tabs-shell">
            <div className="live-blog-full-page__tabs" role="tablist" onPointerDown={stopCanvasBubble}>
              {resolved.categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  className={`live-blog-full-page__tab${activeCategory === cat.id ? ' is-active' : ''}`}
                  onClick={(e) => {
                    if (builderMode) e.stopPropagation();
                    selectCategory(cat.id);
                  }}
                >
                  <span className="live-blog-full-page__tab-icon">
                    <TabIcon name={cat.icon || cat.id} />
                  </span>
                  {canvasEdit ? (
                    <FeatureTabCanvasField
                      as="span"
                      className="live-blog-full-page__editable"
                      value={cat.label}
                      onCommit={(next) => patchContent(`categoryLabel:${cat.id}`, next)}
                      onPointerDown={stopCanvasBubble}
                    />
                  ) : (
                    cat.label
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {showFeatured ? (
      <section className="live-blog-full-page__featured-section">
        <div className="live-blog-full-page__container">
          <div className="live-blog-full-page__featured-card">
            <div>
              <Editable as="span" className="live-blog-full-page__featured-badge" fieldKey="featured.badge" value={resolved.featured.badge} />
              <Editable as="h2" className="live-blog-full-page__featured-title" fieldKey="featured.title" value={resolved.featured.title} />
              <Editable
                as="p"
                className="live-blog-full-page__featured-desc"
                fieldKey="featured.description"
                value={resolved.featured.description}
                multiline
              />
              <div className="live-blog-full-page__meta">
                <Editable as="span" fieldKey="featured.metaCategory" value={resolved.featured.metaCategory} />
                <span>•</span>
                <Editable as="span" fieldKey="featured.readTime" value={resolved.featured.readTime} />
                <span>•</span>
                <Editable as="span" fieldKey="featured.updated" value={resolved.featured.updated} />
              </div>
              {canvasEdit ? (
                <button
                  type="button"
                  className="live-blog-full-page__btn-primary"
                  onClick={(event) => openArticle('featured', event)}
                  onPointerDown={stopCanvasBubble}
                >
                  <FeatureTabCanvasField
                    as="span"
                    className="live-blog-full-page__editable"
                    value={resolved.featured.buttonLabel}
                    onCommit={(next) => patchContent('featured.buttonLabel', next)}
                    onPointerDown={stopCanvasBubble}
                  />
                </button>
              ) : (
                <a
                  href={resolved.featured.buttonHref}
                  className="live-blog-full-page__btn-primary"
                  onPointerDown={stopCanvasBubble}
                >
                  {resolved.featured.buttonLabel}
                </a>
              )}
            </div>
            <div className="live-blog-full-page__featured-image">
              {resolved.featured.image ? (
                <img src={resolved.featured.image} alt={resolved.featured.title} loading="lazy" />
              ) : null}
              <div className="live-blog-full-page__image-overlay">
                <Editable as="strong" fieldKey="featured.overlayTitle" value={resolved.featured.overlayTitle} />
                <Editable as="span" fieldKey="featured.overlaySubtitle" value={resolved.featured.overlaySubtitle} />
              </div>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {showArticles ? (
      <section className="live-blog-full-page__latest">
        <div className="live-blog-full-page__container">
          <div className="live-blog-full-page__section-head">
            <div>
              <Editable as="p" className="live-blog-full-page__kicker" fieldKey="latestKicker" value={resolved.latestKicker} />
              <Editable as="h2" className="live-blog-full-page__section-title" fieldKey="latestTitle" value={resolved.latestTitle} />
              <Editable as="p" className="live-blog-full-page__section-subtitle" fieldKey="latestSubtitle" value={resolved.latestSubtitle} multiline />
            </div>
            <a href={resolved.latestViewAllHref} className="live-blog-full-page__ghost-btn" onPointerDown={stopCanvasBubble}>
              {canvasEdit ? (
                <FeatureTabCanvasField
                  as="span"
                  className="live-blog-full-page__editable"
                  value={resolved.latestViewAllLabel}
                  onCommit={(next) => patchContent('latestViewAllLabel', next)}
                  onPointerDown={stopCanvasBubble}
                />
              ) : (
                resolved.latestViewAllLabel
              )}
            </a>
          </div>
          <div className="live-blog-full-page__grid">
            {filteredPosts.length ? (
              filteredPosts.map((post) => (
                <article key={post.id} className="live-blog-full-page__card">
                  <div className="live-blog-full-page__card-image">
                    {post.image ? <img src={post.image} alt={post.title} loading="lazy" /> : null}
                    <span className="live-blog-full-page__card-cat">{categoryLabel(post.category)}</span>
                    {canvasEdit ? (
                      <FeatureTabCanvasField
                        as="span"
                        className="live-blog-full-page__card-time live-blog-full-page__editable"
                        value={post.readTime}
                        onCommit={(next) => onPatchPost?.(post.id, { readTime: next })}
                        onPointerDown={stopCanvasBubble}
                      />
                    ) : (
                      <span className="live-blog-full-page__card-time">{post.readTime}</span>
                    )}
                  </div>
                  <div className="live-blog-full-page__card-body">
                    {canvasEdit ? (
                      <>
                        <FeatureTabCanvasField
                          as="h3"
                          className="live-blog-full-page__card-title live-blog-full-page__editable"
                          value={post.title}
                          onCommit={(next) => onPatchPost?.(post.id, { title: next })}
                          onPointerDown={stopCanvasBubble}
                        />
                        <FeatureTabCanvasField
                          as="p"
                          className="live-blog-full-page__card-desc live-blog-full-page__editable"
                          value={post.description}
                          multiline
                          onCommit={(next) => onPatchPost?.(post.id, { description: next })}
                          onPointerDown={stopCanvasBubble}
                        />
                      </>
                    ) : (
                      <>
                        <h3 className="live-blog-full-page__card-title">{post.title}</h3>
                        <p className="live-blog-full-page__card-desc">{post.description}</p>
                      </>
                    )}
                    {canvasEdit ? (
                      <button
                        type="button"
                        className="live-blog-full-page__read-more"
                        onClick={(event) => openArticle(post.id, event)}
                        onPointerDown={stopCanvasBubble}
                      >
                        Read More →
                      </button>
                    ) : (
                      <a
                        href={post.href}
                        className="live-blog-full-page__read-more"
                        onPointerDown={stopCanvasBubble}
                      >
                        Read More →
                      </a>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="live-blog-full-page__empty">No articles found in this category yet.</div>
            )}
          </div>
          {canvasEdit && typeof onAddPost === 'function' ? (
            <button type="button" className="live-blog-full-page__add-btn" onClick={() => onAddPost(addPostCategory)} onPointerDown={stopCanvasBubble}>
              + Add article to {categoryLabel(addPostCategory)}
            </button>
          ) : null}
        </div>
      </section>
      ) : null}

      {showGuides ? (
      <section className="live-blog-full-page__guides">
        <div className="live-blog-full-page__container">
          <div className="live-blog-full-page__guides-card">
            <div className="live-blog-full-page__section-head">
              <div>
                <Editable as="p" className="live-blog-full-page__kicker" fieldKey="guidesKicker" value={resolved.guidesKicker} />
                <Editable as="h2" className="live-blog-full-page__section-title" fieldKey="guidesTitle" value={resolved.guidesTitle} />
                <Editable as="p" className="live-blog-full-page__section-subtitle" fieldKey="guidesSubtitle" value={resolved.guidesSubtitle} multiline />
              </div>
              <a href={resolved.guidesViewAllHref} className="live-blog-full-page__ghost-btn" onPointerDown={stopCanvasBubble}>
                {canvasEdit ? (
                  <FeatureTabCanvasField
                    as="span"
                    className="live-blog-full-page__editable"
                    value={resolved.guidesViewAllLabel}
                    onCommit={(next) => patchContent('guidesViewAllLabel', next)}
                    onPointerDown={stopCanvasBubble}
                  />
                ) : (
                  resolved.guidesViewAllLabel
                )}
              </a>
            </div>
            <div className="live-blog-full-page__guide-list">
              {resolved.guides.map((guide) => (
                <div key={guide.id} className="live-blog-full-page__guide-item">
                  <div className="live-blog-full-page__guide-icon" aria-hidden>
                    {guide.icon}
                  </div>
                  {canvasEdit ? (
                    <>
                      <FeatureTabCanvasField
                        as="h3"
                        className="live-blog-full-page__guide-title live-blog-full-page__editable"
                        value={guide.title}
                        onCommit={(next) => patchContent(`guideTitle:${guide.id}`, next)}
                        onPointerDown={stopCanvasBubble}
                      />
                      <FeatureTabCanvasField
                        as="p"
                        className="live-blog-full-page__guide-text live-blog-full-page__editable"
                        value={guide.text}
                        multiline
                        onCommit={(next) => patchContent(`guideText:${guide.id}`, next)}
                        onPointerDown={stopCanvasBubble}
                      />
                    </>
                  ) : (
                    <>
                      <h3 className="live-blog-full-page__guide-title">{guide.title}</h3>
                      <p className="live-blog-full-page__guide-text">{guide.text}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {showNewsletter ? (
      <section className="live-blog-full-page__newsletter">
        <div className="live-blog-full-page__container">
          <div className="live-blog-full-page__newsletter-card">
            <div>
              <Editable as="h2" fieldKey="newsletterTitle" value={resolved.newsletterTitle} />
              <Editable as="p" fieldKey="newsletterSubtitle" value={resolved.newsletterSubtitle} multiline />
            </div>
            <form
              className="live-blog-full-page__newsletter-form"
              onSubmit={(e) => e.preventDefault()}
              onPointerDown={stopCanvasBubble}
            >
              <input type="email" placeholder={resolved.newsletterPlaceholder} aria-label="Email" />
              <button type="button">
                {canvasEdit ? (
                  <FeatureTabCanvasField
                    as="span"
                    className="live-blog-full-page__editable"
                    value={resolved.newsletterButtonLabel}
                    onCommit={(next) => patchContent('newsletterButtonLabel', next)}
                    onPointerDown={stopCanvasBubble}
                  />
                ) : (
                  resolved.newsletterButtonLabel
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
      ) : null}

      {showCta ? (
      <section className="live-blog-full-page__final-cta">
        <div className="live-blog-full-page__container">
          <div className="live-blog-full-page__cta-card">
            <div>
              <Editable as="span" className="live-blog-full-page__pill" fieldKey="ctaPill" value={resolved.ctaPill} />
              <Editable as="h2" className="live-blog-full-page__cta-title" fieldKey="ctaTitle" value={resolved.ctaTitle} />
              <Editable as="p" className="live-blog-full-page__cta-subtitle" fieldKey="ctaSubtitle" value={resolved.ctaSubtitle} multiline />
              <div className="live-blog-full-page__cta-btns" onPointerDown={stopCanvasBubble}>
                <a href={resolved.ctaPrimaryHref} className="live-blog-full-page__btn-primary">
                  {canvasEdit ? (
                    <FeatureTabCanvasField
                      as="span"
                      className="live-blog-full-page__editable"
                      value={resolved.ctaPrimaryLabel}
                      onCommit={(next) => patchContent('ctaPrimaryLabel', next)}
                      onPointerDown={stopCanvasBubble}
                    />
                  ) : (
                    resolved.ctaPrimaryLabel
                  )}
                </a>
                <a href={resolved.ctaSecondaryHref} className="live-blog-full-page__btn-secondary">
                  {canvasEdit ? (
                    <FeatureTabCanvasField
                      as="span"
                      className="live-blog-full-page__editable"
                      value={resolved.ctaSecondaryLabel}
                      onCommit={(next) => patchContent('ctaSecondaryLabel', next)}
                      onPointerDown={stopCanvasBubble}
                    />
                  ) : (
                    resolved.ctaSecondaryLabel
                  )}
                </a>
              </div>
            </div>
            <CtaVisual />
          </div>
        </div>
      </section>
      ) : null}
        </>
      )}
    </RootTag>
  );
}
