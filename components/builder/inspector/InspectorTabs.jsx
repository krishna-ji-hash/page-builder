'use client';

const DEFAULT_TABS = [
  { id: 'content', label: 'Content', icon: '✎' },
  { id: 'layout', label: 'Layout', icon: '▦' },
  { id: 'style', label: 'Style', icon: '◐' },
  { id: 'interactions', label: 'Interactions', icon: '↯' },
  { id: 'advanced', label: 'Advanced', icon: '⚙' },
  { id: 'seo', label: 'SEO/CMS', icon: '◎' },
  { id: 'theme', label: 'Theme', icon: '◆' },
];

export default function InspectorTabs({ activeTab, onChange, tabs = DEFAULT_TABS }) {
  return (
    <div className="bld-inspector-tabs bld-inspector-tabs--pro" role="tablist" aria-label="Inspector tabs">
      {(Array.isArray(tabs) ? tabs : DEFAULT_TABS).map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`bld-inspector-tabs__tab ${activeTab === tab.id ? 'is-active' : ''}`}
          onClick={() => onChange(tab.id)}
          title={tab.label}
        >
          <span className="bld-inspector-tabs__icon" aria-hidden>
            {tab.icon}
          </span>
          <span className="bld-inspector-tabs__label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
