'use client';

function Icon({ children }) {
  return <span className="bld-flexbox-editor__icon" aria-hidden>{children}</span>;
}

function GridIcon({ main = 'row', cross = 'center', wrap = false }) {
  const isCol = main === 'column';
  const wrapClass = wrap ? 'is-wrap' : '';
  const mainClass = isCol ? 'is-col' : 'is-row';
  const crossClass =
    cross === 'start'
      ? 'is-cross-start'
      : cross === 'end'
        ? 'is-cross-end'
        : cross === 'stretch'
          ? 'is-cross-stretch'
          : 'is-cross-center';
  return <span className={`bld-flexbox-glyph ${mainClass} ${crossClass} ${wrapClass}`.trim()} aria-hidden />;
}

function prettyFlexValue(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  return s
    .replace('flex-start', 'start')
    .replace('flex-end', 'end')
    .replace('space-between', 'between')
    .replace('space-around', 'around')
    .replace('space-evenly', 'evenly');
}

function ChoiceGroup({ label, value, options, onChange, disabled }) {
  return (
    <div className="bld-flexbox-editor__group">
      <div className="bld-flexbox-editor__label">
        <span>{label}</span>
        <span className="bld-flexbox-editor__value">{prettyFlexValue(value)}</span>
      </div>
      <div className="bld-flexbox-editor__choices" role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`bld-flexbox-editor__btn ${value === opt.value ? 'is-active' : ''}`.trim()}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            aria-pressed={value === opt.value}
            title={opt.title || opt.label}
          >
            <Icon>{opt.icon}</Icon>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FlexLayoutControlsPanel({
  flexDirection = 'row',
  flexWrap = 'nowrap',
  justifyContent = 'flex-start',
  alignItems = 'stretch',
  alignContent = 'stretch',
  disabled = false,
  onChange,
}) {
  const dir = String(flexDirection || 'row');
  const wrap = String(flexWrap || 'nowrap');

  const directionOptions = [
    { value: 'row', label: 'Row', title: 'Row', icon: <GridIcon main="row" cross="center" /> },
    { value: 'column', label: 'Column', title: 'Column', icon: <GridIcon main="column" cross="center" /> },
    {
      value: 'row-reverse',
      label: 'Row reverse',
      title: 'Row reverse',
      icon: <span className="bld-flexbox-glyph is-row is-dir-reverse" aria-hidden />,
    },
    {
      value: 'column-reverse',
      label: 'Column reverse',
      title: 'Column reverse',
      icon: <span className="bld-flexbox-glyph is-col is-dir-reverse" aria-hidden />,
    },
  ];

  const wrapOptions = [
    { value: 'nowrap', label: 'No wrap', title: 'No wrap', icon: <span className="bld-flexbox-glyph is-nowrap" aria-hidden /> },
    { value: 'wrap', label: 'Wrap', title: 'Wrap', icon: <span className="bld-flexbox-glyph is-wrap-only" aria-hidden /> },
    { value: 'wrap-reverse', label: 'Wrap reverse', title: 'Wrap reverse', icon: <span className="bld-flexbox-glyph is-wrap-reverse" aria-hidden /> },
  ];

  const justifyOptions = [
    { value: 'flex-start', label: 'Start', title: 'Justify: start', icon: <span className="bld-flexbox-glyph is-justify-start" aria-hidden /> },
    { value: 'center', label: 'Center', title: 'Justify: center', icon: <span className="bld-flexbox-glyph is-justify-center" aria-hidden /> },
    { value: 'flex-end', label: 'End', title: 'Justify: end', icon: <span className="bld-flexbox-glyph is-justify-end" aria-hidden /> },
    { value: 'space-between', label: 'Between', title: 'Justify: space-between', icon: <span className="bld-flexbox-glyph is-justify-between" aria-hidden /> },
    { value: 'space-around', label: 'Around', title: 'Justify: space-around', icon: <span className="bld-flexbox-glyph is-justify-around" aria-hidden /> },
    { value: 'space-evenly', label: 'Evenly', title: 'Justify: space-evenly', icon: <span className="bld-flexbox-glyph is-justify-evenly" aria-hidden /> },
  ];

  const itemsOptions = [
    { value: 'stretch', label: 'Stretch', title: 'Align items: stretch', icon: <span className="bld-flexbox-glyph is-items-stretch" aria-hidden /> },
    { value: 'flex-start', label: 'Start', title: 'Align items: start', icon: <span className="bld-flexbox-glyph is-items-start" aria-hidden /> },
    { value: 'center', label: 'Center', title: 'Align items: center', icon: <span className="bld-flexbox-glyph is-items-center" aria-hidden /> },
    { value: 'flex-end', label: 'End', title: 'Align items: end', icon: <span className="bld-flexbox-glyph is-items-end" aria-hidden /> },
    { value: 'baseline', label: 'Baseline', title: 'Align items: baseline', icon: <span className="bld-flexbox-glyph is-items-baseline" aria-hidden /> },
  ];

  const contentOptions = [
    { value: 'flex-start', label: 'Start', title: 'Align content: start', icon: <span className="bld-flexbox-glyph is-content-start" aria-hidden /> },
    { value: 'center', label: 'Center', title: 'Align content: center', icon: <span className="bld-flexbox-glyph is-content-center" aria-hidden /> },
    { value: 'flex-end', label: 'End', title: 'Align content: end', icon: <span className="bld-flexbox-glyph is-content-end" aria-hidden /> },
    { value: 'space-between', label: 'Between', title: 'Align content: space-between', icon: <span className="bld-flexbox-glyph is-content-between" aria-hidden /> },
    { value: 'space-around', label: 'Around', title: 'Align content: space-around', icon: <span className="bld-flexbox-glyph is-content-around" aria-hidden /> },
    { value: 'stretch', label: 'Stretch', title: 'Align content: stretch', icon: <span className="bld-flexbox-glyph is-content-stretch" aria-hidden /> },
  ];

  const emit = (patch) => {
    if (typeof onChange !== 'function') return;
    onChange({ ...patch });
  };

  return (
    <div className="bld-flexbox-editor" aria-label="Flex layout controls">
      <ChoiceGroup
        label="Direction"
        value={dir}
        options={directionOptions}
        disabled={disabled}
        onChange={(v) => emit({ flexDirection: v })}
      />
      <ChoiceGroup
        label="Wrap"
        value={wrap}
        options={wrapOptions}
        disabled={disabled}
        onChange={(v) => emit({ flexWrap: v })}
      />
      <ChoiceGroup
        label="Justify"
        value={String(justifyContent || 'flex-start')}
        options={justifyOptions}
        disabled={disabled}
        onChange={(v) => emit({ justifyContent: v })}
      />
      <ChoiceGroup
        label="Align items"
        value={String(alignItems || 'stretch')}
        options={itemsOptions}
        disabled={disabled}
        onChange={(v) => emit({ alignItems: v })}
      />
      <ChoiceGroup
        label="Align content"
        value={String(alignContent || 'stretch')}
        options={contentOptions}
        disabled={disabled}
        onChange={(v) => emit({ alignContent: v })}
      />
    </div>
  );
}

