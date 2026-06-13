'use client';

import AdminActivityLogPanel from '@/components/admin/AdminActivityLogPanel';
import '@/styles/admin/platform.css';
import '@/styles/admin/activity.css';

export default function AdminSystemSettings() {
  return (
    <div className="platform-shell">
      <header className="admin-page__header">
        <div className="admin-page__header-main">
          <p className="admin-page__badge">Settings · Operations</p>
          <h1>System</h1>
          <p>Platform activity logs, audit trail, and operational visibility.</p>
        </div>
      </header>

      <div className="platform-grid" style={{ marginBottom: 24 }}>
        <div className="platform-card platform-card--pages">
          <div className="platform-card__label">Audit trail</div>
          <div className="platform-card__score" style={{ fontSize: '1.5rem' }}>
            Live
          </div>
          <div className="platform-card__hint">Every publish, login, and domain change</div>
        </div>
        <div className="platform-card platform-card--published">
          <div className="platform-card__label">Retention</div>
          <div className="platform-card__score" style={{ fontSize: '1.5rem' }}>
            DB
          </div>
          <div className="platform-card__hint">Stored in admin_activity_logs</div>
        </div>
        <div className="platform-card platform-card--drafts">
          <div className="platform-card__label">Scope</div>
          <div className="platform-card__score" style={{ fontSize: '1.5rem' }}>
            All
          </div>
          <div className="platform-card__hint">Platform-wide and per-project views</div>
        </div>
      </div>

      <AdminActivityLogPanel title="Platform activity" limit={50} />
    </div>
  );
}
