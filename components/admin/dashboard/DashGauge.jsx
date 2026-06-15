export default function DashGauge({ value, tone = 'muted', label = 'Score' }) {
  const score = value == null ? null : Math.min(100, Math.max(0, Number(value)));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = score == null ? circumference : circumference - (score / 100) * circumference;

  return (
    <div className="dash-gauge" role="img" aria-label={score != null ? `${label}: ${score} out of 100` : `${label} unavailable`}>
      <svg viewBox="0 0 128 128" aria-hidden="true">
        <circle className="dash-gauge__track" cx="64" cy="64" r={radius} />
        <circle
          className={`dash-gauge__fill dash-gauge__fill--${tone}`}
          cx="64"
          cy="64"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="dash-gauge__center">
        <span className={`dash-gauge__value dash-gauge__value--${tone}`}>{score ?? '—'}</span>
        <span className="dash-gauge__suffix">/ 100</span>
      </div>
    </div>
  );
}
