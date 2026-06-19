'use client';

import { PAGE_SEO_QUICK_FIXES } from '@/lib/seo/pageSeoModalAudit';
import { ChecklistGroup } from './shared';

export default function AuditTab({ audit, onQuickFix, onSelectNode, tree }) {
  return (
    <div className="bld-seo-modal__section">
      <ChecklistGroup title="Critical" items={audit?.critical} tone="crit" />
      <ChecklistGroup title="Warnings" items={audit?.warnings} tone="warn" />
      <ChecklistGroup title="Passed" items={audit?.passed} tone="pass" />

      <div>
        <h3 className="bld-seo-modal__section-title">Quick fixes</h3>
        <div className="bld-seo-modal__quick-fixes">
          {PAGE_SEO_QUICK_FIXES.map((fix) => (
            <button key={fix.id} type="button" className="bld-btn bld-btn--ghost" onClick={() => onQuickFix(fix.id)}>
              {fix.label}
            </button>
          ))}
        </div>
      </div>

      {audit?.missingAlt > 0 ? (
        <div>
          <h3 className="bld-seo-modal__section-title">Images missing alt</h3>
          <p className="bld-field-note">Select an image in the builder to edit alt text.</p>
        </div>
      ) : null}
    </div>
  );
}
