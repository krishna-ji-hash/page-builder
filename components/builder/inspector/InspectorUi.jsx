'use client';

import { createContext, useContext, useMemo, useState } from 'react';

const InspectorSearchContext = createContext('');

export function useInspectorSearch() {
  return useContext(InspectorSearchContext);
}

function matchesSearch(label, query) {
  if (!query) return true;
  return String(label || '')
    .toLowerCase()
    .includes(query);
}

export function InspectorPanel({ title, children, searchPlaceholder, onSearch, searchValue = '' }) {
  const [localSearch, setLocalSearch] = useState('');
  const q = onSearch ? searchValue : localSearch;
  const setQ = onSearch || setLocalSearch;

  return (
    <div className="bld-panel bld-inspector-pro">
      {title ? <div className="bld-panel__head">{title}</div> : null}
      <div className="bld-inspector-pro__search">
        <input
          type="search"
          className="bld-input bld-inspector-pro__search-input"
          placeholder={searchPlaceholder || 'Search controls…'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search inspector controls"
        />
      </div>
      <InspectorSearchContext.Provider value={String(q || '').trim().toLowerCase()}>
        {children}
      </InspectorSearchContext.Provider>
    </div>
  );
}

export function InspectorSection({ title, defaultOpen = true, children, keywords = '' }) {
  const query = useInspectorSearch();
  const [open, setOpen] = useState(defaultOpen);
  const visible = useMemo(
    () => matchesSearch(`${title} ${keywords}`, query),
    [title, keywords, query]
  );
  if (!visible) return null;

  return (
    <div className="bld-style-section bld-inspector-pro__section">
      <button type="button" className="bld-style-section__head" onClick={() => setOpen((p) => !p)}>
        <span className="bld-style-section__title">{title}</span>
        <span className="bld-style-section__toggle" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open ? <div className="bld-style-section__body">{children}</div> : null}
    </div>
  );
}

export function InspectorField({
  label,
  hint,
  resetKey,
  onReset,
  disabled,
  overrideDot,
  children,
  keywords = '',
}) {
  const query = useInspectorSearch();
  if (!matchesSearch(`${label} ${keywords}`, query)) return null;

  return (
    <div className={`bld-field bld-inspector-pro__field ${disabled ? 'is-disabled' : ''}`}>
      <div className="bld-field-label-row">
        <span className="bld-label">
          {label}
          {overrideDot ? <span className="bld-inspector-pro__override-dot" title="Breakpoint override" aria-hidden /> : null}
        </span>
        {typeof onReset === 'function' && resetKey ? (
          <button
            type="button"
            className="bld-btn-reset bld-inspector-pro__reset"
            disabled={disabled}
            title="Reset property"
            onClick={() => onReset(resetKey)}
          >
            ↺
          </button>
        ) : null}
      </div>
      {children}
      {hint ? <p className="bld-field-note">{hint}</p> : null}
    </div>
  );
}

export function InspectorChipGrid({ items }) {
  return (
    <div className="bld-field-grid bld-inspector-pro__chips">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="bld-chip"
          disabled={item.disabled}
          title={item.title}
          onClick={item.onClick}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
