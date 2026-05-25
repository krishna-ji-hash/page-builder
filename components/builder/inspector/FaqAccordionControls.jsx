'use client';

/** FAQ accordion — add/remove items; edit Q&A on canvas. */
export default function FaqAccordionControls({ selectedNode, form, onChange, jsonErrors = {} }) {
  const items = Array.isArray(selectedNode?.props?.items) ? selectedNode.props.items : [];

  return (
    <div className="bld-faq-accordion-inspector">
      <p className="bld-field-note" style={{ marginTop: 0, marginBottom: 12 }}>
        <strong>Edit on canvas:</strong> click question or answer to type. Arrow opens/closes. Default section has{' '}
        {items.length} questions — add more below.
      </p>

      <div className="bld-field">
        <label className="bld-label bld-faq-accordion-inspector__heading">FAQ items ({items.length})</label>
        <button
          type="button"
          className="bld-faq-accordion-inspector__add"
          onClick={() => onChange('faqAccordionAddItem', true)}
        >
          + Add FAQ question
        </button>
        <p className="bld-field-note" style={{ marginTop: 8 }}>
          Or use the <strong>+ Add question</strong> button at the bottom of the FAQ block on the canvas.
        </p>
      </div>

      {items.length > 0 ? (
        <ul className="bld-faq-accordion-inspector__list">
          {items.map((item, idx) => (
            <li key={String(item?.id || idx)} className="bld-faq-accordion-inspector__row">
              <span className="bld-faq-accordion-inspector__label">{String(item?.question || `Item ${idx + 1}`)}</span>
              {items.length > 1 ? (
                <button
                  type="button"
                  className="bld-chip bld-chip--danger"
                  onClick={() => onChange('faqAccordionRemoveItem', idx)}
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <details className="bld-details">
        <summary className="bld-details__summary">Advanced: Items JSON</summary>
        <div className="bld-field">
          <textarea
            className="bld-input"
            rows={8}
            value={form.faqAccordionJson || '[]'}
            onChange={(e) => onChange('faqAccordionJson', e.target.value)}
          />
          {jsonErrors.faqAccordionJson ? <p className="bld-field-error">{jsonErrors.faqAccordionJson}</p> : null}
        </div>
      </details>
    </div>
  );
}
