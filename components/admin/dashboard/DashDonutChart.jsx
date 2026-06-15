const SEGMENTS = [
  { key: 'published', label: 'Published', tone: 'published' },
  { key: 'drafts', label: 'Drafts', tone: 'drafts' },
];

export default function DashDonutChart({ published = 0, drafts = 0 }) {
  const total = published + drafts;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const arcs =
    total > 0
      ? SEGMENTS.map((seg) => {
          const value = seg.key === 'published' ? published : drafts;
          const pct = value / total;
          const length = pct * circumference;
          const arc = { ...seg, value, pct, length, offset };
          offset += length;
          return arc;
        }).filter((a) => a.value > 0)
      : [];

  return (
    <div className="dash-donut">
      <div className="dash-donut__chart" role="img" aria-label={`Publishing mix: ${published} published, ${drafts} drafts`}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="dash-donut__track" cx="50" cy="50" r={radius} />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="14"
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset + circumference / 4}
              className={`dash-donut__segment dash-donut__segment--${arc.tone}`}
            />
          ))}
        </svg>
        <div className="dash-donut__center">
          <span className="dash-donut__total">{total}</span>
          <span className="dash-donut__total-label">pages</span>
        </div>
      </div>
      <ul className="dash-donut__legend">
        {SEGMENTS.map((seg) => {
          const value = seg.key === 'published' ? published : drafts;
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <li key={seg.key} className="dash-donut__legend-item">
              <span className={`dash-donut__dot dash-donut__dot--${seg.tone}`} aria-hidden="true" />
              <span className="dash-donut__legend-label">{seg.label}</span>
              <span className="dash-donut__legend-value">
                {value} <em>({pct}%)</em>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
