'use client';

export default function BlogEditorChecklist({ items = [], seoScore = 0 }) {
  const completed = items.filter((i) => i.ok && i.id !== 'ready').length;
  const total = items.filter((i) => i.id !== 'ready').length;
  const scoreColor = seoScore >= 80 ? '#16a34a' : seoScore >= 50 ? '#d97706' : '#dc2626';

  return (
    <aside className="proj-blog__checklist-panel">
      <h3>Publishing checklist</h3>
      <div className="proj-blog__seo-score">
        <span>SEO score</span>
        <div className="proj-blog__seo-bar">
          <div style={{ width: `${seoScore}%`, background: scoreColor }} />
        </div>
        <strong style={{ color: scoreColor }}>{seoScore}</strong>
      </div>
      <p className="proj-blog__hint">
        {completed}/{total} checks complete
      </p>
      <ul className="proj-blog__checklist">
        {items.map((item) => (
          <li key={item.id} className={item.ok ? 'is-ok' : 'is-warn'}>
            <span className="proj-blog__check-icon" aria-hidden="true">
              {item.ok ? '✓' : '!'}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
