'use client';

export default function InspectorTabs({ activeTab, onChange }) {
  return (
    <div className="bld-inspector-tabs" role="tablist" aria-label="Inspector tabs">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'content'}
        className={`bld-inspector-tabs__tab ${activeTab === 'content' ? 'is-active' : ''}`}
        onClick={() => onChange('content')}
      >
        <span className="bld-inspector-tabs__icon" aria-hidden>✎</span>
        <span>Content</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'style'}
        className={`bld-inspector-tabs__tab ${activeTab === 'style' ? 'is-active' : ''}`}
        onClick={() => onChange('style')}
      >
        <span className="bld-inspector-tabs__icon" aria-hidden>◐</span>
        <span>Style</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'theme'}
        className={`bld-inspector-tabs__tab ${activeTab === 'theme' ? 'is-active' : ''}`}
        onClick={() => onChange('theme')}
      >
        <span className="bld-inspector-tabs__icon" aria-hidden>◆</span>
        <span>Theme</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'advanced'}
        className={`bld-inspector-tabs__tab ${activeTab === 'advanced' ? 'is-active' : ''}`}
        onClick={() => onChange('advanced')}
      >
        <span className="bld-inspector-tabs__icon" aria-hidden>⚙</span>
        <span>Advanced</span>
      </button>
    </div>
  );
}
