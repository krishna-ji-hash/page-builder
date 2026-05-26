'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import FeatureTabCanvasField from '@/components/builder/canvas/FeatureTabCanvasField';
import { resolveFaqAccordionProps } from '@/lib/faqAccordionDefaults';

/**
 * Dispatch Solutions-style FAQ accordion. Builder: edit Q&A on canvas; sidebar is layout/advanced only.
 */
export default function FaqAccordion({
  items: itemsProp,
  openItemId: openItemIdProp,
  onOpenItemChange,
  builderMode = false,
  builderEditable = false,
  onPatchItem,
  onAddItem,
  style,
  className,
}) {
  const { items, openItemId: initialOpen } = useMemo(
    () =>
      resolveFaqAccordionProps({
        items: itemsProp,
        openItemId: openItemIdProp,
      }),
    [itemsProp, openItemIdProp]
  );
  const controlled = typeof onOpenItemChange === 'function';
  const [openId, setOpenId] = useState(() => initialOpen || '');
  const lastPropOpenRef = useRef(initialOpen || '');
  const rootId = useId();
  const itemIdsSignature = useMemo(() => items.map((it) => it.id).join('|'), [items]);

  useEffect(() => {
    const next = String(openItemIdProp ?? '').trim();
    const valid = items.some((it) => it.id === next) ? next : '';
    lastPropOpenRef.current = valid;
    setOpenId(valid);
  }, [itemIdsSignature]);

  useEffect(() => {
    if (!controlled) return;
    const next = String(openItemIdProp ?? '').trim();
    if (!next || !items.some((it) => it.id === next)) return;
    setOpenId((cur) => {
      if (cur === next) {
        lastPropOpenRef.current = next;
        return cur;
      }
      if (lastPropOpenRef.current === cur) return cur;
      lastPropOpenRef.current = next;
      return next;
    });
  }, [openItemIdProp, controlled, itemIdsSignature]);

  const toggle = useCallback(
    (id, event) => {
      if (event) {
        event.preventDefault();
        if (builderMode) event.stopPropagation();
      }
      const next = openId === id ? '' : id;
      setOpenId(next);
      lastPropOpenRef.current = next;
      onOpenItemChange?.(next);
    },
    [openId, builderMode, onOpenItemChange]
  );

  const stopCanvasBubble = builderMode
    ? (event) => {
        event.stopPropagation();
      }
    : undefined;

  const patchItem = useCallback(
    (itemId, patch) => {
      if (!itemId || !onPatchItem) return;
      onPatchItem(itemId, patch);
    },
    [onPatchItem]
  );

  if (!items.length) return null;

  const canvasEdit = builderMode && builderEditable;

  return (
    <div
      className={['live-faq-accordion', builderMode ? 'live-faq-accordion--builder' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {canvasEdit ? (
        <p className="live-faq-accordion__builder-hint" aria-hidden>
          Click question to edit · arrow to open/close · use <strong>+ Add question</strong> below for more items
        </p>
      ) : null}

      {items.map((item) => {
        const isOpen = item.id === openId;
        const panelId = `${rootId}-panel-${item.id}`;
        const triggerId = `${rootId}-trigger-${item.id}`;

        return (
          <div key={item.id} className={`live-faq-accordion__item${isOpen ? ' is-open' : ''}`}>
            {canvasEdit ? (
              <div
                className="live-faq-accordion__trigger live-faq-accordion__trigger--builder"
                onPointerDown={stopCanvasBubble}
              >
                <FeatureTabCanvasField
                  as="div"
                  id={triggerId}
                  className="live-faq-accordion__question live-faq-accordion__editable"
                  value={item.question}
                  onCommit={(next) => patchItem(item.id, { question: next })}
                  onPointerDown={stopCanvasBubble}
                />
                <button
                  type="button"
                  className="live-faq-accordion__chevron-btn"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label={isOpen ? 'Collapse answer' : 'Expand answer'}
                  onClick={(e) => toggle(item.id, e)}
                >
                  <span className="live-faq-accordion__chevron" aria-hidden />
                </button>
              </div>
            ) : (
              <button
                type="button"
                id={triggerId}
                className="live-faq-accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={(e) => toggle(item.id, e)}
              >
                <span className="live-faq-accordion__question">{item.question}</span>
                <span className="live-faq-accordion__chevron" aria-hidden />
              </button>
            )}

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className="live-faq-accordion__panel"
              hidden={!isOpen}
              onPointerDown={canvasEdit ? stopCanvasBubble : undefined}
            >
              {item.answer || canvasEdit ? (
                canvasEdit ? (
                  <FeatureTabCanvasField
                    as="p"
                    className="live-faq-accordion__answer live-faq-accordion__editable"
                    value={item.answer}
                    multiline
                    onCommit={(next) => patchItem(item.id, { answer: next })}
                    onPointerDown={stopCanvasBubble}
                  />
                ) : (
                  <p className="live-faq-accordion__answer">{item.answer}</p>
                )
              ) : null}
            </div>
          </div>
        );
      })}

      {canvasEdit && typeof onAddItem === 'function' ? (
        <div className="live-faq-accordion__add-wrap" onPointerDown={stopCanvasBubble}>
          <button
            type="button"
            className="live-faq-accordion__add-btn"
            onClick={(event) => {
              event.stopPropagation();
              onAddItem();
            }}
          >
            + Add question
          </button>
        </div>
      ) : null}
    </div>
  );
}
