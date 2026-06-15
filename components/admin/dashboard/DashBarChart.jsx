function barTone(score) {
  if (score == null) return 'muted';
  if (score >= 80) return 'good';
  if (score >= 50) return 'warn';
  return 'bad';
}

export default function DashBarChart({ items = [] }) {
  if (!items.length) return null;

  return (
    <ul className="dash-bars" aria-label="Health breakdown">
      {items.map((item) => {
        const score = item.score ?? 0;
        const tone = barTone(item.score);
        return (
          <li key={item.id} className="dash-bars__row">
            <div className="dash-bars__meta">
              <span className="dash-bars__label">{item.label}</span>
              <span className={`dash-bars__score dash-bars__score--${tone}`}>{item.score ?? '—'}</span>
            </div>
            <div className="dash-bars__track" aria-hidden="true">
              <span
                className={`dash-bars__fill dash-bars__fill--${tone}`}
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
