'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import FeatureTabCanvasField from '@/components/builder/canvas/FeatureTabCanvasField';
import { resolveBlogDetailPageProps } from '@/lib/blogDetailPageDefaults';
import { BlogPlainText } from '@/lib/blogPlainText';
import { getAllSiteBlogPosts, siteBlogPostHref, siteBlogPostPublishedDate } from '@/lib/siteBlogPosts';
import {
  BLOG_DETAIL_GOTO_SECTION_EVENT,
  blogDetailSectionId,
  requestBlogDetailSection,
  resolveActiveBlogSectionIndex,
  scrollToBlogDetailSectionWhenReady,
  syncBlogDetailHeaderOffsetVars,
} from '@/lib/blogDetailTocScroll';
import '@/styles/shared/blog-detail-page.css';

const TOC_PREVIEW_COUNT = 2;
const LEAD_PREVIEW_CHARS = 240;
/** Live article shows this many H2 sections before a Read more control. */
const ARTICLE_PREVIEW_HEADINGS = 5;

const SHARE_ITEMS = [
  { label: 'Facebook', icon: 'facebook' },
  { label: 'LinkedIn', icon: 'linkedin' },
  { label: 'Twitter', icon: 'twitter' },
  { label: 'Email', icon: 'email' },
  { label: 'Telegram', icon: 'telegram' },
  { label: 'Pinterest', icon: 'pinterest' },
  { label: 'Reddit', icon: 'reddit' },
  { label: 'Copy Link', icon: 'link' },
];

function ShareIcon({ name }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
  };

  switch (name) {
    case 'facebook':
      return (
        <svg {...common}>
          <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v8h4v-8h3.1L17 11h-4V9c0-.6.4-1 1-1z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg {...common}>
          <path d="M6 9H2v13h4V9zm2-4a2.3 2.3 0 1 0 0 4.6A2.3 2.3 0 0 0 8 5zM22 22h-4v-7c0-1.7-1.3-3-3-3s-2 1.3-2 3v7h-4V9h4v2.1c.8-1.2 2.2-2.1 3.7-2.1 2.7 0 4.3 1.8 4.3 4.9V22z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg {...common}>
          <path d="M17.3 4H20l-6.4 7.3L21 20h-5.5l-4.3-5.6L6.4 20H3.7l6.9-7.9L3 4h5.6l3.9 5.1L17.3 4zm-1.9 14.3h1.5L8.2 5.6H6.6l8.8 12.7z" />
        </svg>
      );
    case 'email':
      return (
        <svg {...common}>
          <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm0 2 8 5 8-5H4zm16 2.2-7.2 4.5a1 1 0 0 1-1 1 0L4 10.2V18h16v-9.8z" />
        </svg>
      );
    case 'telegram':
      return (
        <svg {...common}>
          <path d="M21.9 4.6 3.5 11.8c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.5c.2.7.8.9 1.3.5l2.9-2.6 4.8 3.5c.9.5 1.5.2 1.7-.9L23.8 6.2c.3-1.3-.5-1.9-1.9-1.6zM9.2 13.8l9.7-6.1c.5-.3.9-.1.5.2l-8.3 7.5-.3 3.2-1.6-4.8z" />
        </svg>
      );
    case 'pinterest':
      return (
        <svg {...common}>
          <path d="M12 2a10 10 0 0 0-3.5 19.4c-.1-.8-.2-2 .1-3 .2-.9 1.4-5.8 1.4-5.8s-.4-.8-.4-2c0-1.9 1.1-3.3 2.5-3.3 1.2 0 1.7.9 1.7 2 0 1.2-.8 3-.1 4.6.6 1 .9 1.7.9 2.8 0 2.3-1.4 4-3.5 4-2.4 0-3.8-1.8-3.8-3.7 0-1 .4-2.1 1.2-2.5.1 0 .3-.1.3.1.1.2.2.7.2.9 0 .3-.2 1.2-.3 1.5-.1.4.1.7.5.7 1.4 0 2.5-1.9 2.5-4.7 0-2.4-1.7-4.1-4.2-4.1-2.9 0-4.6 2.2-4.6 4.5 0 .9.3 1.8.8 2.3.1.1.1.1.1 0l-.3-1.2c-.4-1.3.3-2.9 1.3-2.9.7 0 1.1.6 1.1 1.3 0 .8-.5 2-.8 3.1-.2.9.4 1.6 1.2 1.6 1.5 0 2.6-1.6 2.6-3.9C16.8 5.8 14.8 2 12 2z" />
        </svg>
      );
    case 'reddit':
      return (
        <svg {...common}>
          <path d="M14.5 13.2c.2.7.7 1.2 1.4 1.2.8 0 1.4-.6 1.4-1.4s-.6-1.4-1.4-1.4c-.5 0-1 .3-1.2.7l-2.2-.7c.1-.3.2-.7.2-1 0-2.5-2.9-4.5-6.5-4.5S1 9.3 1 11.8c0 .4.1.7.2 1.1l-1.5.9c-.3.2-.4.6-.2.9.2.3.6.4.9.2l1.6-1c.8.6 1.9 1 3 1.2l.7 3.3c0 .5.5.9 1 .9h7.8c.5 0 1-.4 1-.9l.7-3.3c1.2-.2 2.2-.7 3-1.3l1.5 1c.3.2.7.1.9-.2.2-.3.1-.7-.2-.9l-1.4-.8zm-8.7 2.3c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4zm7.4 0c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4zM8.7 16.8h6.6l-.5 2.2H9.2l-.5-2.2z" />
        </svg>
      );
  }

  return (
    <svg {...common}>
      <path d="M10 13a5 5 0 0 1 7.1 0l1.4 1.4a5 5 0 0 1 0 7.1l-1.4 1.4a5 5 0 0 1-7.1 0l-1.4-1.4a5 5 0 0 1 0-7.1l1.4-1.4z" />
      <path d="M8.5 15.5 15.5 8.5M14 10l2 2" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

function ShareGrid({ title, Editable, resolved, fieldKey = 'shareTitle' }) {
  const handleShareClick = (label, event) => {
    event.preventDefault();
    if (label !== 'Copy Link' || typeof window === 'undefined') return;
    const url = window.location.href.split('#')[0];
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <div className="site-blog-detail__share">
      <Editable as="h3" className="site-blog-detail__share-title" fieldKey={fieldKey} value={resolved.shareTitle} />
      <div className="site-blog-detail__share-grid">
        {SHARE_ITEMS.map((item) => (
          <a
            key={item.label}
            className="site-blog-detail__share-chip"
            href="#"
            aria-label={`Share on ${item.label}`}
            onClick={(e) => handleShareClick(item.label, e)}
          >
            <span className="site-blog-detail__share-icon">
              <ShareIcon name={item.icon} />
            </span>
            <span className="site-blog-detail__share-label">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function useRelatedPosts(currentSlug, limit = 6, catalogPosts = null) {
  return useMemo(() => {
    const source =
      Array.isArray(catalogPosts) && catalogPosts.length ? catalogPosts : getAllSiteBlogPosts();
    return source.filter((post) => post.slug !== currentSlug).slice(0, limit);
  }, [currentSlug, limit, catalogPosts]);
}

function TableOfContents({ resolved, contentBlocks, Editable, builderMode = false }) {
  // Expand TOC by default so deep headings (Send / Avoid…) are clickable without an extra click.
  const [expanded, setExpanded] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  /** Once user clicks a TOC row, keep that row active until they click another. */
  const clickPinnedRef = useRef(false);
  const items = contentBlocks || [];
  const hiddenCount = Math.max(0, items.length - TOC_PREVIEW_COUNT);
  const visibleItems = expanded ? items : items.slice(0, TOC_PREVIEW_COUNT);

  useEffect(() => {
    if (!items.length || typeof window === 'undefined') return undefined;

    const syncActive = () => {
      // Click wins — never let scroll-spy steal the highlight back to section 0.
      if (clickPinnedRef.current) return;
      const next = resolveActiveBlogSectionIndex(items.length);
      if (next >= 0) setActiveIndex(next);
    };

    syncActive();
    window.addEventListener('scroll', syncActive, { passive: true });
    window.addEventListener('resize', syncActive);
    return () => {
      window.removeEventListener('scroll', syncActive);
      window.removeEventListener('resize', syncActive);
    };
  }, [items.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    const match = hash.match(/^blog-section-(\d+)$/);
    if (!match) return;
    const index = Number(match[1]);
    clickPinnedRef.current = true;
    setActiveIndex(index);
    setExpanded(true);
    const timer = window.setTimeout(() => requestBlogDetailSection(index), 80);
    return () => window.clearTimeout(timer);
  }, [items.length]);

  if (!items.length) return null;

  const stopBuilderBubble = builderMode ? (e) => e.stopPropagation() : undefined;

  const handleTocClick = (index, event) => {
    event.preventDefault();
    event.stopPropagation();
    clickPinnedRef.current = true;
    setActiveIndex(index);
    setExpanded(true);
    // Expand "Read more" automatically when needed, then jump to that exact heading.
    requestBlogDetailSection(index, event);
  };

  return (
    <div className="site-blog-detail__toc-box">
      <Editable as="h3" className="site-blog-detail__toc-title" fieldKey="tocTitle" value={resolved.tocTitle} />

      <ol className="site-blog-detail__toc-list">
        {visibleItems.map((block, index) => (
          <li
            key={`toc-${index}-${block.heading}`}
            className={activeIndex === index ? 'is-active' : ''}
          >
            <a
              href={`#${blogDetailSectionId(index)}`}
              className="site-blog-detail__toc-link"
              onClick={(e) => handleTocClick(index, e)}
              onPointerDown={stopBuilderBubble}
            >
              <span className="site-blog-detail__toc-num">{index + 1}.</span>
              <span className="site-blog-detail__toc-label">{block.heading}</span>
            </a>
          </li>
        ))}
      </ol>

      <div className="site-blog-detail__toc-actions">
        {hiddenCount > 0 ? (
          <button
            type="button"
            className="site-blog-detail__toc-more"
            onClick={() => setExpanded((open) => !open)}
            onPointerDown={stopBuilderBubble}
          >
            {expanded ? 'Show less' : `Show more (${hiddenCount})`}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ArticleLead({ resolved, Editable, builderMode = false }) {
  const [expanded, setExpanded] = useState(false);
  const text = String(resolved.description || '').trim();
  const isLong = text.length > LEAD_PREVIEW_CHARS;
  const stopBuilderBubble = builderMode ? (e) => e.stopPropagation() : undefined;

  return (
    <div
      className={[
        'site-blog-detail__lead-wrap',
        expanded || !isLong ? 'is-expanded' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Editable as="p" className="site-blog-detail__lead" fieldKey="description" value={resolved.description} multiline />
      {isLong ? (
        <button
          type="button"
          className="site-blog-detail__read-more"
          onClick={() => setExpanded((open) => !open)}
          onPointerDown={stopBuilderBubble}
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      ) : null}
    </div>
  );
}

function LeftRail({ resolved, currentSlug }) {
  const related = useRelatedPosts(currentSlug, 3, resolved.catalogPosts);
  const suggestions = useRelatedPosts(currentSlug, 8, resolved.catalogPosts).slice(3);

  return (
    <aside className="site-blog-detail__left-rail">
      <div className="site-blog-detail__rail-card">
        <h3>{resolved.leftRelatedTitle}</h3>
        <ul className="site-blog-detail__mini-list">
          {related.map((post) => (
            <li key={post.slug}>
              <Link className="site-blog-detail__mini-item" href={siteBlogPostHref(post.slug)}>
                <span className="site-blog-detail__mini-thumb">
                  {post.image ? <img src={post.image} alt="" /> : null}
                </span>
                <span className="site-blog-detail__mini-copy">
                  <strong>{post.title}</strong>
                  <span>{siteBlogPostPublishedDate(post)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="site-blog-detail__rail-card">
        <h3>{resolved.leftYouMightLikeTitle}</h3>
        <ul className="site-blog-detail__text-links">
          {suggestions.map((post) => (
            <li key={post.slug}>
              <Link href={siteBlogPostHref(post.slug)}>{post.title}</Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function RightRail({ resolved, Editable }) {
  return (
    <aside className="site-blog-detail__right-rail">
      <div className="site-blog-detail__rail-card site-blog-detail__form-card">
        <Editable as="h3" fieldKey="leadFormTitle" value={resolved.leadFormTitle} />
        <form className="site-blog-detail__form" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Your name" aria-label="Your name" />
          <input type="email" placeholder="Your email" aria-label="Your email" />
          <input type="tel" placeholder="Your phone" aria-label="Your phone" />
          <button type="submit">{resolved.leadFormSubmitLabel}</button>
        </form>
      </div>

      <div className="site-blog-detail__rail-card site-blog-detail__form-card">
        <Editable as="h3" fieldKey="newsletterTitle" value={resolved.newsletterTitle} />
        <Editable as="p" fieldKey="newsletterSubtitle" value={resolved.newsletterSubtitle} multiline />
        <form className="site-blog-detail__form site-blog-detail__form--compact" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder={resolved.newsletterPlaceholder} aria-label="Email" />
          <button type="submit">{resolved.newsletterButtonLabel}</button>
        </form>
      </div>
    </aside>
  );
}

function MoreRelatedBlogs({ resolved, currentSlug }) {
  const related = useRelatedPosts(currentSlug, 4, resolved.catalogPosts);
  if (!related.length) return null;

  return (
    <section className="site-blog-detail__more-related">
      <div className="site-blog-detail__container">
        <h2>{resolved.relatedTitle}</h2>
        <div className="site-blog-detail__more-grid">
          {related.map((post) => (
            <article className="site-blog-detail__more-card" key={post.slug}>
              <div className="site-blog-detail__more-image">
                {post.image ? <img src={post.image} alt={post.title} /> : null}
              </div>
              <span className="site-blog-detail__more-tag">{post.category}</span>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
              <div className="site-blog-detail__more-foot">
                <span>{siteBlogPostPublishedDate(post)}</span>
                <Link href={siteBlogPostHref(post.slug)}>Read More ↓</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticleBody({ resolved, Editable, builderMode = false }) {
  const [expanded, setExpanded] = useState(false);
  const [pendingScrollIndex, setPendingScrollIndex] = useState(null);
  const blocks = Array.isArray(resolved.content) ? resolved.content : [];
  const needsToggle = !builderMode && blocks.length > ARTICLE_PREVIEW_HEADINGS;
  const visibleBlocks =
    needsToggle && !expanded ? blocks.slice(0, ARTICLE_PREVIEW_HEADINGS) : blocks;
  const stopBuilderBubble = builderMode ? (e) => e.stopPropagation() : undefined;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onGoto = (event) => {
      const index = Number(event?.detail?.index);
      if (!Number.isFinite(index) || index < 0) return;

      // TOC clicked a section past the fold — open full article first, then scroll.
      if (needsToggle && index >= ARTICLE_PREVIEW_HEADINGS && !expanded) {
        setExpanded(true);
        setPendingScrollIndex(index);
        return;
      }

      scrollToBlogDetailSectionWhenReady(index, { behavior: 'smooth' });
    };

    window.addEventListener(BLOG_DETAIL_GOTO_SECTION_EVENT, onGoto);
    return () => window.removeEventListener(BLOG_DETAIL_GOTO_SECTION_EVENT, onGoto);
  }, [needsToggle, expanded]);

  useEffect(() => {
    if (pendingScrollIndex == null || !expanded) return undefined;
    const index = pendingScrollIndex;
    setPendingScrollIndex(null);
    // After expand, land instantly on the exact heading (then micro-correct).
    scrollToBlogDetailSectionWhenReady(index, { behavior: 'auto' });
    return undefined;
  }, [expanded, pendingScrollIndex]);

  return (
    <>
      <ArticleLead resolved={resolved} Editable={Editable} builderMode={builderMode} />

      {visibleBlocks.map((block, index) => (
        <div
          className="site-blog-detail__block"
          key={`${index}-${block.heading}`}
          id={blogDetailSectionId(index)}
        >
          <Editable as="h2" fieldKey={`content.${index}.heading`} value={block.heading} />
          <Editable as="p" fieldKey={`content.${index}.text`} value={block.text} multiline />
        </div>
      ))}

      {needsToggle ? (
        <div className="site-blog-detail__article-more">
          <button
            type="button"
            className="site-blog-detail__article-more-btn"
            onClick={() => setExpanded((open) => !open)}
            onPointerDown={stopBuilderBubble}
            aria-expanded={expanded}
          >
            {expanded ? 'Read less' : 'Read more'}
          </button>
        </div>
      ) : null}
    </>
  );
}

function HeroMain({ resolved, Editable, contentBlocks, builderMode = false }) {
  return (
    <div className="site-blog-detail__main-col">
      <Editable as="h1" fieldKey="title" value={resolved.title} />
      <p className="site-blog-detail__byline">
        By <Editable as="span" fieldKey="authorLabel" value={resolved.authorLabel} /> •{' '}
        <Editable as="span" fieldKey="publishedDate" value={resolved.publishedDate} />
      </p>

      <div className="site-blog-detail__feature-image">
        {resolved.image ? <img src={resolved.image} alt={resolved.title} /> : null}
      </div>

      <TableOfContents
        resolved={resolved}
        contentBlocks={contentBlocks}
        Editable={Editable}
        builderMode={builderMode}
      />
    </div>
  );
}

/**
 * HouseThat-style blog detail — 3-column layout with left related rail, center article, right forms.
 *
 * @param {{ sectionOnly?: 'hero'|'article'|'sidebar'|'cta'|null }} props
 */
export default function BlogDetailPage({
  style,
  builderMode = false,
  builderEditable = false,
  onPatchContent = null,
  sectionOnly = null,
  ...props
}) {
  const resolved = resolveBlogDetailPageProps(props);
  const canvasEdit = builderMode && builderEditable && typeof onPatchContent === 'function';
  const stopCanvasBubble = builderMode ? (e) => e.stopPropagation() : undefined;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncHeaderOffset = () => {
      document.querySelectorAll('.site-blog-detail').forEach((root) => {
        syncBlogDetailHeaderOffsetVars(root);
      });
    };

    syncHeaderOffset();
    window.addEventListener('resize', syncHeaderOffset);
    const timer = window.setTimeout(syncHeaderOffset, 250);
    return () => {
      window.removeEventListener('resize', syncHeaderOffset);
      window.clearTimeout(timer);
    };
  }, [resolved.title, sectionOnly]);

  const patch = (key, value) => {
    if (onPatchContent) onPatchContent(key, value);
  };

  const Editable = ({ fieldKey, as = 'span', className, value, multiline = false }) => {
    if (canvasEdit) {
      return (
        <FeatureTabCanvasField
          as={as}
          className={`${className || ''} site-blog-detail__editable${
            multiline ? ' site-blog-detail__block-text--multiline' : ''
          }`.trim()}
          value={value}
          multiline={multiline}
          onCommit={(next) => patch(fieldKey, next)}
          onPointerDown={stopCanvasBubble}
        />
      );
    }
    if (as === 'h1') return <h1 className={className}>{value}</h1>;
    if (as === 'h2') return <h2 className={className}>{value}</h2>;
    if (as === 'h3') return <h3 className={className}>{value}</h3>;
    if (as === 'p' && multiline) {
      return <BlogPlainText text={value} className={className} />;
    }
    if (as === 'p') return <p className={className}>{value}</p>;
    return <span className={className}>{value}</span>;
  };

  const showHero = !sectionOnly || sectionOnly === 'hero';
  const showArticle = !sectionOnly || sectionOnly === 'article';
  const showSidebar = !sectionOnly || sectionOnly === 'sidebar';
  const showCta = !sectionOnly || sectionOnly === 'cta';
  const RootTag = sectionOnly ? 'div' : 'main';

  const breadcrumbs = (
    <nav className="site-blog-detail__breadcrumbs" aria-label="Breadcrumb">
      <ol className="site-blog-detail__breadcrumbs-trail">
        <li>
          <Link href={resolved.homeHref}>{resolved.homeLabel}</Link>
        </li>
        <li>
          <Link href={resolved.blogListHref}>{resolved.blogLabel}</Link>
        </li>
        <li className="site-blog-detail__breadcrumbs-current" aria-current="page">
          <span className="site-blog-detail__breadcrumbs-current-text">{resolved.title}</span>
        </li>
      </ol>
    </nav>
  );

  const heroSection = showHero ? (
    <section className="site-blog-detail__hero">
      <div className="site-blog-detail__container">
        {breadcrumbs}
        <HeroMain
          resolved={resolved}
          Editable={Editable}
          contentBlocks={resolved.content}
          builderMode={builderMode}
        />
      </div>
    </section>
  ) : null;

  const articleSection = showArticle ? (
    <section
      className={[
        'site-blog-detail__content',
        sectionOnly === 'article' ? 'site-blog-detail__content--article-only' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="site-blog-detail__container">
        <article className="site-blog-detail__article">
          <ArticleBody resolved={resolved} Editable={Editable} builderMode={builderMode} />
          <ShareGrid resolved={resolved} Editable={Editable} />
        </article>
      </div>
    </section>
  ) : null;

  const sidebarSection = showSidebar ? (
    <section
      className={[
        'site-blog-detail__content',
        sectionOnly === 'sidebar' ? 'site-blog-detail__content--sidebar-only' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="site-blog-detail__container">
        <RightRail resolved={resolved} Editable={Editable} />
      </div>
    </section>
  ) : null;

  const ctaSection = showCta ? (
    <section className="site-blog-detail__content site-blog-detail__content--cta-only">
      <MoreRelatedBlogs resolved={resolved} currentSlug={resolved.slug} />
    </section>
  ) : null;

  if (sectionOnly) {
    return (
      <RootTag
        className={['site-blog-detail', 'site-blog-detail--section', `site-blog-detail--${sectionOnly}`]
          .filter(Boolean)
          .join(' ')}
        style={style}
        data-blog-detail-section={sectionOnly}
      >
        {heroSection}
        {articleSection}
        {sidebarSection}
        {ctaSection}
      </RootTag>
    );
  }

  return (
    <RootTag className="site-blog-detail" style={style} data-blog-detail-page>
      <div className="site-blog-detail__container">
        {breadcrumbs}
        <div className="site-blog-detail__tri-layout">
          <LeftRail resolved={resolved} currentSlug={resolved.slug} />

          <div className="site-blog-detail__center">
            <HeroMain
          resolved={resolved}
          Editable={Editable}
          contentBlocks={resolved.content}
          builderMode={builderMode}
        />
            <article className="site-blog-detail__article">
              <ArticleBody resolved={resolved} Editable={Editable} builderMode={builderMode} />
              <ShareGrid resolved={resolved} Editable={Editable} />
            </article>
          </div>

          <RightRail resolved={resolved} Editable={Editable} />
        </div>
      </div>

      <MoreRelatedBlogs resolved={resolved} currentSlug={resolved.slug} />
    </RootTag>
  );
}
