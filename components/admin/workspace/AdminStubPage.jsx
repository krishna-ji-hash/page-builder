'use client';

import '@/styles/admin/platform.css';
import '@/styles/admin/activity.css';

export default function AdminStubPage({ title, description, phase, features = [] }) {
  const defaultFeatures =
    features.length > 0
      ? features
      : [
          { icon: 'U', title: 'User management', text: 'Invite editors, assign roles, and revoke access.' },
          { icon: 'R', title: 'Permissions', text: 'Fine-grained control over projects and modules.' },
        ];

  return (
    <div className="platform-shell">
      <header className="admin-page__header">
        <div className="admin-page__header-main">
          <p className="admin-page__badge">Settings · Coming soon</p>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
      </header>

      <div className="admin-coming-grid">
        {defaultFeatures.map((feature) => (
          <article key={feature.title} className="admin-coming-card">
            <span className="admin-coming-card__icon" aria-hidden="true">
              {feature.icon}
            </span>
            <h2 className="admin-coming-card__title">{feature.title}</h2>
            <p className="admin-coming-card__text">{feature.text}</p>
          </article>
        ))}
      </div>

      <div className="admin-coming-banner">
        <span className="admin-coming-banner__badge">Roadmap</span>
        <p className="admin-coming-banner__text">
          {phase
            ? `${title} module ships in ${phase}. Core builder, publishing, and domains are fully operational today.`
            : `${title} module is on the roadmap. Use Platform → Projects to manage sites in the meantime.`}
        </p>
      </div>
    </div>
  );
}
