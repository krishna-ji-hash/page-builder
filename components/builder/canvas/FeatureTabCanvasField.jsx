'use client';

import { useEffect, useRef } from 'react';

/**
 * Canvas inline field for Feature Tabs — click to edit, blur to save.
 */
export default function FeatureTabCanvasField({
  as: Tag = 'span',
  className = '',
  value = '',
  multiline = false,
  disabled = false,
  onCommit,
  onPointerDown,
  stopPropagation = true,
  autoFocus = false,
  id,
}) {
  const ref = useRef(null);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!ref.current || focusedRef.current) return;
    ref.current.innerText = value || '';
  }, [value]);

  useEffect(() => {
    if (!autoFocus || !ref.current) return;
    ref.current.focus();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [autoFocus]);

  const stopBubble = (event) => {
    if (stopPropagation) event.stopPropagation();
    onPointerDown?.(event);
  };

  const pointerHandler = onPointerDown || stopPropagation ? stopBubble : undefined;

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      contentEditable={!disabled}
      suppressContentEditableWarning
      data-bld-feature-tab-field=""
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={(event) => {
        focusedRef.current = false;
        const next = String(event.currentTarget.innerText || '').trim();
        const prev = String(value || '').trim();
        if (next !== prev) onCommit?.(next);
      }}
      onPointerDown={pointerHandler}
      onClick={stopPropagation ? stopBubble : undefined}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Escape') {
          event.preventDefault();
          if (ref.current) ref.current.innerText = value || '';
          event.currentTarget.blur();
        } else if (event.key === 'Enter' && !multiline && !event.shiftKey) {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    />
  );
}
