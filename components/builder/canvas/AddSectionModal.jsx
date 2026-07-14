'use client';

import { useEffect, useState } from 'react';
import { BLANK_SECTION_LAYOUTS } from '@/lib/blankSectionLayouts';

const PRESETS = [
  {
    id: 'hero',
    title: 'Hero section',
    description: 'Headline, supporting text, and primary button in one column.',
  },
  {
    id: 'platformHero',
    title: 'Platform Hero',
    description: 'Bento layout: dark pitch card, image, and two feature tiles.',
  },
  {
    id: 'splitHeroCarousel',
    title: 'Split Hero Carousel',
    description: 'Left copy + right mockup synced in one slider with dots and arrows.',
  },
  {
    id: 'whyChooseCourier',
    title: 'Why Choose Courier',
    description: 'Headline, subtitle, and 2×2 feature grid with icon boxes.',
  },
  {
    id: 'courierFeatureBands',
    title: 'Feature Bands (×3)',
    description: 'Three alternating image + text rows — AI courier, volumetric, KAM.',
  },
  {
    id: 'howItWorks',
    title: 'How It Works',
    description: '3 step cards with illustrations and a centered “Start Shipping” CTA.',
  },
  {
    id: 'featureTabs',
    title: 'Feature Tabs',
    description: 'Tabbed differentiators — delivery, AI courier, enterprise, support.',
  },
  {
    id: 'resourcesBlogs',
    title: 'Resources Blogs',
    description: 'Title + “View All” and three blue blog cards with image, category, date, and headline.',
  },
  {
    id: 'b2bShippingServices',
    title: 'B2B Shipping Services',
    description: '3×3 icon card grid with nine B2B freight services.',
  },
  {
    id: 'courierPartners',
    title: 'Courier Partners',
    description: 'OUR NETWORK badge, headline, and 5×2 courier logo card grid.',
  },
  {
    id: 'integrationBenefits',
    title: 'Integration Benefits',
    description: '04 — Why businesses choose integration (3×2 icon cards).',
  },
  {
    id: 'integrationSteps',
    title: 'How Integration Works',
    description: '05 — Four numbered integration step cards.',
  },
  {
    id: 'integrationFeatures',
    title: 'Integration Features',
    description: '06 — Twelve automation features in a compact grid.',
  },
  {
    id: 'aiCourierRecommendation',
    title: 'AI Courier Recommendation',
    description: '07 — Four themed recommendation cards with bullet lists.',
  },
  {
    id: 'businessTypes',
    title: 'Supported Business Types',
    description: '08 — Eight business use-case cards with icon circles.',
  },
  {
    id: 'faqFullPage',
    title: 'FAQ Full Page',
    description: 'Hero search, category tabs, 2-column accordion, and support CTA — all in one section.',
  },
  {
    id: 'blogFullPage',
    title: 'Blog Full Page',
    description: 'Hero, category tabs, featured article, article grid, guides, newsletter and CTA.',
  },
  {
    id: 'blogDetailPage',
    title: 'Blog Detail Page (All)',
    description: 'Adds hero, article body, sidebar and bottom CTA — full /blog/[slug] layout.',
  },
  {
    id: 'blogDetailHero',
    title: 'Blog Detail Hero',
    description: 'Article hero with back link, badge, title, summary and feature image.',
  },
  {
    id: 'blogDetailArticle',
    title: 'Blog Detail Article',
    description: 'Article content blocks and key takeaways card.',
  },
  {
    id: 'blogDetailSidebar',
    title: 'Blog Detail Sidebar',
    description: 'Demo CTA and related topics sidebar cards.',
  },
  {
    id: 'blogDetailBottomCta',
    title: 'Blog Detail CTA',
    description: 'Bottom sales/contact call-to-action strip.',
  },
  {
    id: 'blogHubHero',
    title: 'Blog Hub Hero',
    description: 'Knowledge hub hero with search, popular topics and stats.',
  },
  {
    id: 'blogCategoryTabs',
    title: 'Blog Category Tabs',
    description: 'Horizontal category filter tabs for blog content.',
  },
  {
    id: 'blogFeaturedArticle',
    title: 'Blog Featured Article',
    description: 'Large featured article card with image overlay.',
  },
  {
    id: 'blogArticlesGrid',
    title: 'Blog Articles Grid',
    description: 'Latest articles grid with read-more article detail.',
  },
  {
    id: 'blogGuidesSection',
    title: 'Blog Guides',
    description: 'Popular shipping guides row with icons.',
  },
  {
    id: 'blogNewsletterSection',
    title: 'Blog Newsletter',
    description: 'Email signup strip for logistics tips.',
  },
  {
    id: 'blogFinalCta',
    title: 'Blog Final CTA',
    description: 'Bottom call-to-action for demo and contact.',
  },
  {
    id: 'features',
    title: 'Features row',
    description: 'Two columns with headings and short copy.',
  },
  {
    id: 'navbar',
    title: 'Navbar',
    description: 'Top bar with brand and navigation links.',
  },
  {
    id: 'cta',
    title: 'CTA section',
    description: 'Centered headline, supporting line, and primary button.',
  },
  {
    id: 'starter',
    title: 'Starter Page',
    description: 'Hero + features + CTA starter layout.',
  },
  {
    id: 'headerSpread',
    title: 'Header',
    description: 'Full width (screen) — logo left, menu center, buttons right.',
  },
  {
    id: 'headerBoxed',
    title: 'Header',
    description: 'Contained — logo, menu, and buttons in the content column.',
  },
  {
    id: 'footer',
    title: 'Footer',
    description: 'Multi-column footer with copy and links.',
  },
];

export default function AddSectionModal({
  open,
  onClose,
  onSelect,
  onSelectPreset,
  initialTab = 'presets',
  isBusy = false,
}) {
  const [tab, setTab] = useState(initialTab === 'layouts' ? 'layouts' : 'presets');

  useEffect(() => {
    if (!open) return;
    setTab(initialTab === 'layouts' ? 'layouts' : 'presets');
  }, [initialTab, open]);

  if (!open) return null;

  return (
    <div className="bld-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="bld-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Select structure"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bld-modal__head">
          <h3>Add Section</h3>
          <button type="button" className="bld-modal__close" onClick={onClose} disabled={isBusy}>
            x
          </button>
        </header>
        <div className="bld-modal__tabs" role="tablist" aria-label="Section insert mode">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'presets'}
            className={`bld-modal__tab ${tab === 'presets' ? 'is-active' : ''}`}
            onClick={() => setTab('presets')}
          >
            Templates / Presets
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'layouts'}
            className={`bld-modal__tab ${tab === 'layouts' ? 'is-active' : ''}`}
            onClick={() => setTab('layouts')}
          >
            Blank Layouts
          </button>
        </div>
        {tab === 'presets' ? (
          <div className="bld-structure-grid">
            {PRESETS.map((preset) => (
              <div key={preset.id} className="bld-structure-grid__cell">
                <button
                  type="button"
                  className="bld-structure-grid__item"
                  onClick={() => onSelectPreset?.(preset.id)}
                  disabled={isBusy}
                >
                  <span className="bld-structure-grid__label bld-structure-grid__label--title">{preset.title}</span>
                  <span className="bld-structure-grid__label">{preset.description}</span>
                </button>
                <div className="bld-structure-grid__hover-preview" aria-hidden>
                  <span className="bld-structure-grid__hover-preview__title">{preset.title}</span>
                  <span className="bld-structure-grid__hover-preview__body">{preset.description}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bld-structure-grid bld-structure-grid--layouts">
            {BLANK_SECTION_LAYOUTS.map((layout) => (
              <div key={layout.id} className="bld-structure-grid__cell">
                <button
                  type="button"
                  className="bld-structure-grid__item"
                  onClick={() => onSelect(layout.id)}
                  disabled={isBusy}
                  title={layout.description ? `${layout.label} — ${layout.description}` : layout.label}
                >
                  <span
                    className={`bld-structure-grid__preview bld-structure-grid__preview--${layout.previewClass}`}
                  >
                    {Array.from({ length: layout.previewSlots }).map((_, idx) => (
                      <span key={idx} />
                    ))}
                  </span>
                  <span className="bld-structure-grid__label">{layout.label}</span>
                  {layout.description ? (
                    <span className="bld-structure-grid__label bld-structure-grid__label--hint">
                      {layout.description}
                    </span>
                  ) : null}
                </button>
                <div className="bld-structure-grid__hover-preview bld-structure-grid__hover-preview--layout" aria-hidden>
                  <span
                    className={`bld-structure-grid__hover-preview__wire bld-structure-grid__hover-preview__wire--${layout.previewClass}`}
                  >
                    {Array.from({ length: layout.previewSlots }).map((_, idx) => (
                      <span key={idx} />
                    ))}
                  </span>
                  <span className="bld-structure-grid__hover-preview__caption">
                    {layout.description || layout.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
