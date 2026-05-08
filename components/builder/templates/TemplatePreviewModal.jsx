'use client';

import { useEffect, useMemo, useState } from 'react';
import { renderTree } from '@/lib/liveRenderer';

function stop(e) {
  e.preventDefault();
  e.stopPropagation();
}

export default function TemplatePreviewModal({ open, title, roots, onClose }) {
  const [device, setDevice] = useState('desktop');

  useEffect(() => {
    if (!open) return;
    setDevice('desktop');
  }, [open]);

  const preview = useMemo(() => {
    if (!open) return null;
    if (!Array.isArray(roots) || !roots.length) return null;
    return renderTree(roots, { builderDataAttr: false, device });
  }, [open, roots, device]);

  if (!open) return null;

  return (
    <div className="bld-tpl-modal__backdrop" role="presentation" onClick={onClose}>
      <div className="bld-tpl-modal" role="dialog" aria-modal="true" aria-label={title || 'Template preview'} onClick={stop}>
        <div className="bld-tpl-modal__head">
          <div className="bld-tpl-modal__title">{title || 'Template preview'}</div>
          <button type="button" className="bld-tpl-modal__close" onClick={onClose} aria-label="Close preview">
            ×
          </button>
        </div>
        <div className="bld-tpl-modal__toolbar" role="tablist" aria-label="Preview device">
          {['desktop', 'tablet', 'mobile'].map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={device === d}
              className={`bld-tpl-modal__tab ${device === d ? 'is-active' : ''}`}
              onClick={() => setDevice(d)}
            >
              {d}
            </button>
          ))}
          <div className="bld-tpl-modal__spacer" />
          <div className="bld-tpl-modal__hint">Preview is isolated (non-editable)</div>
        </div>
        <div className={`bld-tpl-modal__stage bld-tpl-modal__stage--${device}`} aria-hidden>
          <div className="bld-tpl-modal__stageInner">{preview}</div>
        </div>
      </div>
    </div>
  );
}

