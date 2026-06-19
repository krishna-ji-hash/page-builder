'use client';

export const TITLE_TARGET = { min: 15, max: 70 };
export const DESC_TARGET = { min: 50, max: 160 };

export function safeTrim(v) {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v == null ? '' : String(v).trim();
}

export function charCountClass(len, { min, max }) {
  if (!len) return 'bld-seo-modal__count--empty';
  if (len < min || len > max) return len < min ? 'bld-seo-modal__count--short' : 'bld-seo-modal__count--long';
  return 'bld-seo-modal__count--ok';
}

export function scoreRingClass(score) {
  const n = Number(score) || 0;
  if (n >= 80) return 'bld-seo-modal__score-ring--good';
  if (n >= 50) return 'bld-seo-modal__score-ring--warn';
  return 'bld-seo-modal__score-ring--bad';
}

export function SeoField({ label, hint, counter, children, full }) {
  return (
    <div className={`bld-seo-field${full ? ' bld-seo-field--full' : ''}`}>
      <div className="bld-seo-field__head">
        <label className="bld-label">{label}</label>
        {counter ? <span className={`bld-seo-modal__count ${counter.className}`}>{counter.text}</span> : null}
      </div>
      {children}
      {hint ? <p className="bld-field-note">{hint}</p> : null}
    </div>
  );
}

export function SerpPreviewCard({ title, description, url }) {
  return (
    <div className="bld-seo-modal__serp">
      <div className="bld-seo-modal__serp-title">{safeTrim(title) || '(no title)'}</div>
      <div className="bld-seo-modal__serp-url">{url || '(no URL)'}</div>
      <div className="bld-seo-modal__serp-desc">{safeTrim(description) || '(no description)'}</div>
    </div>
  );
}

export function SocialPreviewCard({ label, title, description, image }) {
  return (
    <div className="bld-seo-modal__social-card">
      <div className="bld-seo-modal__social-label">{label}</div>
      <div className="bld-seo-modal__social-img" style={image ? { backgroundImage: `url(${image})` } : undefined}>
        {!image ? 'No image' : null}
      </div>
      <div className="bld-seo-modal__social-body">
        <strong>{safeTrim(title) || '(no title)'}</strong>
        <p>{safeTrim(description) || '(no description)'}</p>
      </div>
    </div>
  );
}

export function ChecklistGroup({ title, items, tone = 'warn' }) {
  if (!items?.length) return null;
  return (
    <div className="bld-seo-modal__section">
      <h3 className="bld-seo-modal__section-title">{title}</h3>
      <div className="bld-seo-modal__checks">
        {items.map((item) => (
          <div key={item.id} className={`bld-seo-modal__check-row bld-seo-modal__check-row--${tone}`}>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
