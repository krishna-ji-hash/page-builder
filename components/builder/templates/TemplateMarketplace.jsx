/* eslint-disable react/no-danger */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { SECTION_TEMPLATES } from '@/lib/sectionTemplates';
import { renderTree } from '@/lib/liveRenderer';

const FAV_STORAGE_KEY = 'bld-template-marketplace:favorites:v1';

function safeParseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function loadFavorites() {
  if (typeof window === 'undefined') return new Set();
  const raw = window.localStorage.getItem(FAV_STORAGE_KEY);
  const arr = safeParseJson(raw, []);
  if (!Array.isArray(arr)) return new Set();
  return new Set(arr.map((x) => String(x)));
}

function persistFavorites(set) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore quota / private mode
  }
}

function categoryLabel(categoryId) {
  const id = String(categoryId || '').toLowerCase();
  if (id === 'headers') return 'Headers';
  if (id === 'heroes') return 'Heroes';
  if (id === 'features') return 'Features';
  if (id === 'cta') return 'CTA';
  if (id === 'footers') return 'Footers';
  if (id === 'starters') return 'Starters';
  return 'All';
}

function defaultMetaByTemplateId(id) {
  const tid = String(id || '').toLowerCase();
  const map = {
    starter: {
      title: 'Starter Page',
      description: 'Hero + features + CTA starter layout.',
      category: 'starters',
      icon: 'TPL',
    },
    header: {
      title: 'Header',
      description: 'Ready header row with logo/menu/actions.',
      category: 'headers',
      icon: 'HDR',
    },
    headerspread: {
      title: 'Header',
      description: 'Full width (screen) — logo left, menu center, buttons right.',
      category: 'headers',
      icon: '↔',
    },
    headerboxed: {
      title: 'Header',
      description: 'Contained — logo, menu, and buttons in the content column.',
      category: 'headers',
      icon: '▣',
    },
    hero: {
      title: 'Hero',
      description: 'Headline, supporting text, and primary action.',
      category: 'heroes',
      icon: 'H',
    },
    herolanding: {
      title: 'Hero Landing',
      description: 'Light hero with preview card and feature bullets.',
      category: 'heroes',
      icon: 'HL',
    },
    platformhero: {
      title: 'Platform Hero',
      description: 'Dark pitch card, hero image, and two feature tiles.',
      category: 'heroes',
      icon: '1P',
    },
    whychoosecourier: {
      title: 'Why Choose Courier',
      description: 'Title, subtitle, and 2×2 icon feature grid (Dispatch Solutions-style).',
      category: 'features',
      icon: 'WC',
    },
    courierfeaturebands: {
      title: 'Feature Bands',
      description: 'Three alternating image + copy rows (AI, volumetric, KAM).',
      category: 'features',
      icon: '3B',
    },
    howitworks: {
      title: 'How It Works',
      description: 'Three step cards with illustrations and a centered shipping CTA.',
      category: 'features',
      icon: '3S',
    },
    featuretabs: {
      title: 'Feature Tabs',
      description: 'Tabbed panels — delivery success, AI courier, enterprise, support.',
      category: 'features',
      icon: 'TAB',
    },
    resourcesblogs: {
      title: 'Resources Blogs',
      description: 'Title + “View All” and three blue blog cards (image, category, date, headline).',
      category: 'features',
      icon: 'BLG',
    },
    faq: {
      title: 'FAQ',
      description: 'Accordion Q&A with expandable answers (Dispatch Solutions-style).',
      category: 'features',
      icon: 'FAQ',
    },
    getintouch: {
      title: 'Get in Touch',
      description: 'Dark contact band — office details, dividers, and white lead form card.',
      category: 'cta',
      icon: '✉',
    },
    features: {
      title: 'Features',
      description: 'A clean feature grid with headings and copy.',
      category: 'features',
      icon: '≡',
    },
    cta: {
      title: 'CTA',
      description: 'Centered call-to-action section.',
      category: 'cta',
      icon: '↳',
    },
    footer: {
      title: 'Footer',
      description: 'Multi-column footer with links and copy.',
      category: 'footers',
      icon: 'FTR',
    },
    navbar: {
      title: 'Navbar',
      description: 'Top bar with brand, links, and primary action.',
      category: 'headers',
      icon: 'NAV',
    },
  };
  return (
    map[tid] || {
      title: tid ? tid[0].toUpperCase() + tid.slice(1) : 'Template',
      description: 'Insert this template into the page.',
      category: 'features',
      icon: 'TPL',
    }
  );
}

function getMarketplaceTemplates() {
  const builtIns = [
    { id: 'starter', type: 'starter' },
    { id: 'header', type: 'section' },
    { id: 'headerSpread', type: 'section' },
    { id: 'headerBoxed', type: 'section' },
    { id: 'hero', type: 'section' },
    { id: 'heroLanding', type: 'section' },
    { id: 'platformHero', type: 'section' },
    { id: 'whyChooseCourier', type: 'section' },
    { id: 'courierFeatureBands', type: 'section' },
    { id: 'howItWorks', type: 'section' },
    { id: 'featureTabs', type: 'section' },
    { id: 'resourcesBlogs', type: 'section' },
    { id: 'trustLogos', type: 'section' },
    { id: 'features', type: 'section' },
    { id: 'benefits', type: 'section' },
    { id: 'testimonials', type: 'section' },
    { id: 'faq', type: 'section' },
    { id: 'getInTouch', type: 'section' },
    { id: 'cta', type: 'section' },
    { id: 'footer', type: 'section' },
    { id: 'navbar', type: 'section' },
  ];

  return builtIns
    .filter((t) => t.type !== 'section' || Array.isArray(SECTION_TEMPLATES[t.id]))
    .map((t) => {
      const meta = defaultMetaByTemplateId(t.id);
      const roots = t.type === 'section' ? SECTION_TEMPLATES[t.id] : null;
      return {
        id: t.id,
        type: t.type,
        title: meta.title,
        description: meta.description,
        category: meta.category,
        icon: meta.icon,
        roots,
      };
    });
}

function TemplatePreview({ roots }) {
  const preview = useMemo(() => {
    if (!Array.isArray(roots) || !roots.length) return null;
    return renderTree(roots, { builderDataAttr: false, device: 'desktop' });
  }, [roots]);

  return (
    <div className="bld-market-card__preview" aria-hidden>
      <div className="bld-market-card__previewInner">{preview}</div>
    </div>
  );
}

export default function TemplateMarketplace({
  onInsertStarterTemplate,
  onInsertHeaderTemplate,
  onInsertSectionTemplate,
  disabled = false,
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set());

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const templates = useMemo(() => getMarketplaceTemplates(), []);

  const filtered = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    return templates.filter((t) => {
      if (onlyFavorites && !favorites.has(String(t.id))) return false;
      if (category !== 'all' && String(t.category) !== String(category)) return false;
      if (!q) return true;
      const hay = `${t.title} ${t.description} ${t.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [templates, query, category, onlyFavorites, favorites]);

  const toggleFavorite = (id) => {
    const key = String(id);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      persistFavorites(next);
      return next;
    });
  };

  const handleInsert = async (t) => {
    if (!t) return;
    if (t.type === 'starter') {
      await onInsertStarterTemplate?.({});
      return;
    }
    if (t.id === 'header' || t.id === 'headerSpread' || t.id === 'headerBoxed') {
      await onInsertSectionTemplate?.(t.id === 'header' ? 'headerBoxed' : t.id);
      return;
    }
    await onInsertSectionTemplate?.(t.id);
  };

  return (
    <div className="bld-market">
      <div className="bld-market__filters">
        <label className="bld-market__field">
          <span className="bld-market__label">Search</span>
          <input
            className="bld-market__input"
            placeholder="Search templates…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled}
          />
        </label>
        <label className="bld-market__field">
          <span className="bld-market__label">Category</span>
          <select
            className="bld-market__select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={disabled}
          >
            <option value="all">All</option>
            <option value="starters">{categoryLabel('starters')}</option>
            <option value="headers">{categoryLabel('headers')}</option>
            <option value="heroes">{categoryLabel('heroes')}</option>
            <option value="features">{categoryLabel('features')}</option>
            <option value="cta">{categoryLabel('cta')}</option>
            <option value="footers">{categoryLabel('footers')}</option>
          </select>
        </label>
        <label className="bld-market__toggle">
          <input
            type="checkbox"
            checked={onlyFavorites}
            onChange={(e) => setOnlyFavorites(e.target.checked)}
            disabled={disabled}
          />
          <span>Favorites</span>
        </label>
      </div>

      <div className="bld-market__grid" role="list" aria-label="Template marketplace">
        {filtered.map((t) => {
          const isFav = favorites.has(String(t.id));
          return (
            <div key={t.id} className="bld-market-card" role="listitem">
              <div className="bld-market-card__top">
                <div className="bld-market-card__icon" aria-hidden>
                  {t.icon}
                </div>
                <button
                  type="button"
                  className={`bld-market-card__fav ${isFav ? 'is-on' : ''}`}
                  onClick={() => toggleFavorite(t.id)}
                  aria-pressed={isFav}
                  title={isFav ? 'Unfavorite' : 'Favorite'}
                  disabled={disabled}
                >
                  ★
                </button>
              </div>

              {t.roots ? <TemplatePreview roots={t.roots} /> : <div className="bld-market-card__preview is-empty" />}

              <div className="bld-market-card__body">
                <div className="bld-market-card__title" title={t.title}>
                  {t.title}
                </div>
                <div className="bld-market-card__desc">{t.description}</div>
              </div>

              <div className="bld-market-card__actions">
                <button
                  type="button"
                  className="bld-market-card__btn bld-market-card__btn--primary"
                  onClick={() => handleInsert(t)}
                  disabled={disabled}
                >
                  Insert
                </button>
                <button type="button" className="bld-market-card__btn" disabled title="Preview modal comes in Phase 7">
                  Preview
                </button>
              </div>
            </div>
          );
        })}
        {!filtered.length ? <div className="bld-market__empty">No templates match your filters.</div> : null}
      </div>
    </div>
  );
}

