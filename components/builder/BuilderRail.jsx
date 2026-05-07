'use client';

function Icon({ char }) {
  return <span className="bld-rail__glyph">{char}</span>;
}

export default function BuilderRail({ activeTool = 'add', onToolChange }) {
  const tools = [
    { id: 'add', label: 'Add', char: '+' },
    { id: 'layers', label: 'Navigator', char: '=' },
    { id: 'styles', label: 'Styles', char: 'S' },
    { id: 'interactions', label: 'Interactions', char: 'I' },
    { id: 'settings', label: 'Settings', char: 'G' },
    { id: 'cms', label: 'CMS', char: 'C' }
  ];

  return (
    <nav className="bld-rail" aria-label="Builder tools">
      {tools.map(({ id, label, char }) => (
        <button
          key={id}
          type="button"
          className={`bld-rail__btn ${activeTool === id ? 'is-active' : ''}`}
          title={label}
          aria-label={label}
          onClick={() => onToolChange?.(id)}
        >
          <Icon char={char} />
        </button>
      ))}
    </nav>
  );
}