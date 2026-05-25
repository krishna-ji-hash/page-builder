'use client';

export default function LineToolsPanel({
  onInsertHorizontal,
  onInsertVertical,
  disabled = false,
  busy = false,
  hint = '',
}) {
  const run = (orientation) => {
    if (orientation === 'horizontal') onInsertHorizontal?.('inside');
    else onInsertVertical?.('inside');
  };

  return (
    <div className="bld-line-tools" role="group" aria-label="Line tools">
      <div className="bld-line-tools__head">Lines</div>
      <div className="bld-line-tools__row">
        <button
          type="button"
          className="bld-line-tools__btn"
          disabled={disabled || busy}
          onClick={() => run('horizontal')}
          title="Add horizontal line in selected stack"
        >
          <span className="bld-line-tools__icon" aria-hidden>
            ―
          </span>
          H Line
        </button>
        <button
          type="button"
          className="bld-line-tools__btn"
          disabled={disabled || busy}
          onClick={() => run('vertical')}
          title="Add vertical line in selected stack"
        >
          <span className="bld-line-tools__icon" aria-hidden>
            |
          </span>
          V Line
        </button>
      </div>
      {hint ? <p className="bld-line-tools__hint">{hint}</p> : null}
    </div>
  );
}
