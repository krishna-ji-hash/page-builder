'use client';

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
  isBusy = false,
}) {
  if (!open) return null;
  const widgetList = Array.isArray(allowedWidgets) && allowedWidgets.length ? allowedWidgets : FALLBACK_WIDGETS;

  return (
    <div className="bld-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="bld-modal bld-modal--widget"
        role="dialog"
        aria-modal="true"
        aria-label="Select widget"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bld-modal__head">
          <h3>Add Element</h3>
          <button type="button" className="bld-modal__close" onClick={onClose} disabled={isBusy}>
            x
          </button>
        </header>
        <div className="bld-widget-grid">
          {widgetList.map((widget) => (
            <button
              key={widget}
              type="button"
              className="bld-widget-grid__item"
              onClick={() => onSelect(widget)}
              disabled={isBusy}
            >
              {titleCase(widget)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
