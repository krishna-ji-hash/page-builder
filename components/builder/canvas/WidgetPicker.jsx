'use client';

import { useEffect, useMemo, useState } from 'react';

const FALLBACK_WIDGETS = ['heading', 'text', 'rich_text', 'image', 'button'];

function titleCase(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function WidgetPicker({
  open,
  onClose,
  onSelect,
  allowedWidgets = FALLBACK_WIDGETS,
  widgetEntries = null,
  isBusy = false,
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && !isBusy) onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, isBusy, onClose]);

  const entries = useMemo(() => {
    if (Array.isArray(widgetEntries) && widgetEntries.length) return widgetEntries;
    const types = Array.isArray(allowedWidgets) && allowedWidgets.length ? allowedWidgets : FALLBACK_WIDGETS;
    return types.map((type) => ({ type, label: titleCase(type) }));
  }, [widgetEntries, allowedWidgets]);

  const filtered = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      ({ type, label }) => label.toLowerCase().includes(q) || String(type).toLowerCase().includes(q)
    );
  }, [entries, query]);

  if (!open) return null;

  return (
    <div className="bld-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="bld-modal bld-modal--widget"
        role="dialog"
        aria-modal="true"
        aria-label="Add element"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bld-modal__head bld-widget-picker__head">
          <div className="bld-widget-picker__head-text">
            <h3>Add Element</h3>
            <p className="bld-widget-picker__subtitle">{entries.length} elements available</p>
          </div>
          <button
            type="button"
            className="bld-modal__close"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="bld-widget-picker__search-wrap">
          <input
            type="search"
            className="bld-input bld-widget-picker__search"
            placeholder="Search elements…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isBusy}
            aria-label="Search elements"
          />
        </div>

        <div className="bld-modal__body bld-widget-picker__body">
          {filtered.length ? (
            <div className="bld-widget-grid" role="listbox" aria-label="Element types">
              {filtered.map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  className="bld-widget-grid__item"
                  role="option"
                  onClick={() => onSelect(type)}
                  disabled={isBusy}
                >
                  <span className="bld-widget-grid__label">{label}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="bld-widget-picker__empty">No elements match &ldquo;{query}&rdquo;</p>
          )}
        </div>

        <footer className="bld-widget-picker__foot">
          <span>
            {filtered.length} of {entries.length} shown
          </span>
          <span className="bld-widget-picker__hint">Scroll for more</span>
        </footer>
      </div>
    </div>
  );
}
