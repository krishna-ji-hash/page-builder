'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FULL_PAGE_TEMPLATES } from '@/lib/fullPageTemplates';
import { renderTree } from '@/lib/liveRenderer';
import TemplatePreviewModal from './TemplatePreviewModal';

const FAV_STORAGE_KEY = 'bld-template-marketplace:fullpage-favorites:v1';

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
    // ignore
  }
}

function useInView({ rootMargin = '300px' } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}

function ConfirmInsertModal({ open, templateTitle, onClose, onInsert, onReplace, disabled }) {
  if (!open) return null;
  return (
    <div className="bld-tpl-confirm__backdrop" role="presentation" onClick={onClose}>
      <div className="bld-tpl-confirm" role="dialog" aria-modal="true" aria-label="Confirm full page insert" onClick={(e) => e.stopPropagation()}>
        <div className="bld-tpl-confirm__title">Use “{templateTitle}”?</div>
        <div className="bld-tpl-confirm__body">
          Insert adds all sections to your page. Replace removes current sections first.
        </div>
        <div className="bld-tpl-confirm__actions">
          <button type="button" className="bld-tpl-confirm__btn" onClick={onClose} disabled={disabled}>
            Cancel
          </button>
          <button type="button" className="bld-tpl-confirm__btn" onClick={onInsert} disabled={disabled}>
            Insert full page
          </button>
          <button type="button" className="bld-tpl-confirm__btn bld-tpl-confirm__btn--danger" onClick={onReplace} disabled={disabled}>
            Replace current page
          </button>
        </div>
      </div>
    </div>
  );
}

function LazyCardPreview({ roots, title }) {
  const { ref, inView } = useInView();
  const preview = useMemo(() => {
    if (!inView) return null;
    if (!Array.isArray(roots) || !roots.length) return null;
    return renderTree(roots, { builderDataAttr: false, device: 'desktop' });
  }, [inView, roots]);

  return (
    <div ref={ref} className="bld-fullpage-card__preview" aria-hidden title={title ? `Preview: ${title}` : undefined}>
      <div className={`bld-fullpage-card__previewInner ${inView ? 'is-mounted' : ''}`}>{preview}</div>
    </div>
  );
}

export default function FullPageTemplateMarketplace({ disabled = false, onApplyFullPageTemplate }) {
  const [query, setQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set());

  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(null);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const filtered = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    return FULL_PAGE_TEMPLATES.filter((t) => {
      if (onlyFavorites && !favorites.has(String(t.id))) return false;
      if (!q) return true;
      const hay = `${t.title} ${t.description} ${(t.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, onlyFavorites, favorites]);

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

  const openPreview = (t) => {
    setActiveTemplate(t);
    setPreviewOpen(true);
  };

  const openConfirm = (t) => {
    setActiveTemplate(t);
    setConfirmOpen(true);
  };

  const apply = async (mode) => {
    if (!activeTemplate?.id) return;
    await onApplyFullPageTemplate?.({ templateId: activeTemplate.id, mode });
    setConfirmOpen(false);
  };

  return (
    <div className="bld-fullpage">
      <div className="bld-fullpage__filters">
        <label className="bld-fullpage__field">
          <span className="bld-fullpage__label">Search</span>
          <input
            className="bld-fullpage__input"
            placeholder="Search full pages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled}
          />
        </label>
        <label className="bld-fullpage__toggle">
          <input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} disabled={disabled} />
          <span>Favorites</span>
        </label>
      </div>

      <div className="bld-fullpage__grid" role="list" aria-label="Full page templates">
        {filtered.map((t) => {
          const isFav = favorites.has(String(t.id));
          return (
            <div key={t.id} className="bld-fullpage-card" role="listitem">
              <div className="bld-fullpage-card__head">
                <div className="bld-fullpage-card__title" title={t.title}>
                  {t.title}
                </div>
                <button
                  type="button"
                  className={`bld-fullpage-card__fav ${isFav ? 'is-on' : ''}`}
                  onClick={() => toggleFavorite(t.id)}
                  aria-pressed={isFav}
                  title={isFav ? 'Unfavorite' : 'Favorite'}
                  disabled={disabled}
                >
                  ★
                </button>
              </div>

              <LazyCardPreview roots={t.roots} title={t.title} />

              <div className="bld-fullpage-card__meta">
                <div className="bld-fullpage-card__desc">{t.description}</div>
                <div className="bld-fullpage-card__chips" aria-label="Template tags">
                  {(t.tags || []).slice(0, 4).map((tag) => (
                    <span key={tag} className="bld-fullpage-card__chip">
                      {tag}
                    </span>
                  ))}
                  {t.responsiveReady ? <span className="bld-fullpage-card__chip is-good">responsive</span> : null}
                </div>
              </div>

              <div className="bld-fullpage-card__actions">
                <button type="button" className="bld-fullpage-card__btn bld-fullpage-card__btn--primary" onClick={() => openConfirm(t)} disabled={disabled}>
                  Use template
                </button>
                <button type="button" className="bld-fullpage-card__btn" onClick={() => openPreview(t)} disabled={disabled}>
                  Preview
                </button>
              </div>
            </div>
          );
        })}
        {!filtered.length ? <div className="bld-fullpage__empty">No full-page templates match your search.</div> : null}
      </div>

      <TemplatePreviewModal
        open={previewOpen}
        title={activeTemplate?.title || 'Template preview'}
        roots={activeTemplate?.roots || []}
        onClose={() => setPreviewOpen(false)}
      />
      <ConfirmInsertModal
        open={confirmOpen}
        templateTitle={activeTemplate?.title || 'Template'}
        onClose={() => setConfirmOpen(false)}
        onInsert={() => apply('insert')}
        onReplace={() => apply('replace')}
        disabled={disabled}
      />
    </div>
  );
}

