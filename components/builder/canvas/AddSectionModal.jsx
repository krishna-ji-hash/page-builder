'use client';

import { useEffect, useState } from 'react';

const STRUCTURES = [1, 2, 3, 4];
const PRESETS = [
  {
    id: 'hero',
    title: 'Hero section',
    description: 'Headline, supporting text, and primary button in one column.',
  },
  {
    id: 'features',
    title: 'Features row',
    description: 'Two columns with headings and short copy.',
  },
  {
    id: 'navbar',
    title: 'Navbar',
    description: 'Top bar with brand and navigation links.',
  },
  {
    id: 'cta',
    title: 'CTA section',
    description: 'Centered headline, supporting line, and primary button.',
  },
  {
    id: 'starter',
    title: 'Starter Page',
    description: 'Hero + features + CTA starter layout.',
  },
  {
    id: 'header',
    title: 'Header',
    description: 'Insert a ready header row with logo/menu structure.',
  },
  {
    id: 'footer',
    title: 'Footer',
    description: 'Multi-column footer with copy and links.',
  },
];

export default function AddSectionModal({
  open,
  onClose,
  onSelect,
  onSelectPreset,
  initialTab = 'presets',
  isBusy = false,
}) {
  const [tab, setTab] = useState(initialTab === 'layouts' ? 'layouts' : 'presets');

  useEffect(() => {
    if (!open) return;
    setTab(initialTab === 'layouts' ? 'layouts' : 'presets');
  }, [initialTab, open]);

  if (!open) return null;

  return (
    <div className="bld-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="bld-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Select structure"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bld-modal__head">
          <h3>Add Section</h3>
          <button type="button" className="bld-modal__close" onClick={onClose} disabled={isBusy}>
            x
          </button>
        </header>
        <div className="bld-modal__tabs" role="tablist" aria-label="Section insert mode">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'presets'}
            className={`bld-modal__tab ${tab === 'presets' ? 'is-active' : ''}`}
            onClick={() => setTab('presets')}
          >
            Templates / Presets
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'layouts'}
            className={`bld-modal__tab ${tab === 'layouts' ? 'is-active' : ''}`}
            onClick={() => setTab('layouts')}
          >
            Blank Layouts
          </button>
        </div>
        {tab === 'presets' ? (
          <div className="bld-structure-grid">
            {PRESETS.map((preset) => (
              <div key={preset.id} className="bld-structure-grid__cell">
                <button
                  type="button"
                  className="bld-structure-grid__item"
                  onClick={() => onSelectPreset?.(preset.id)}
                  disabled={isBusy}
                >
                  <span className="bld-structure-grid__label bld-structure-grid__label--title">{preset.title}</span>
                  <span className="bld-structure-grid__label">{preset.description}</span>
                </button>
                <div className="bld-structure-grid__hover-preview" aria-hidden>
                  <span className="bld-structure-grid__hover-preview__title">{preset.title}</span>
                  <span className="bld-structure-grid__hover-preview__body">{preset.description}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bld-structure-grid">
            {STRUCTURES.map((count) => (
              <div key={count} className="bld-structure-grid__cell">
                <button
                  type="button"
                  className="bld-structure-grid__item"
                  onClick={() => onSelect(count)}
                  disabled={isBusy}
                  title={`${count} column${count > 1 ? 's' : ''}`}
                >
                  <span className={`bld-structure-grid__preview bld-structure-grid__preview--${count}`}>
                    {Array.from({ length: count }).map((_, idx) => (
                      <span key={idx} />
                    ))}
                  </span>
                  <span className="bld-structure-grid__label">
                    {count} column{count > 1 ? 's' : ''}
                  </span>
                </button>
                <div className="bld-structure-grid__hover-preview bld-structure-grid__hover-preview--layout" aria-hidden>
                  <span
                    className={`bld-structure-grid__hover-preview__wire bld-structure-grid__hover-preview__wire--${count}`}
                  >
                    {Array.from({ length: count }).map((_, idx) => (
                      <span key={idx} />
                    ))}
                  </span>
                  <span className="bld-structure-grid__hover-preview__caption">
                    {count} column layout preview
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
