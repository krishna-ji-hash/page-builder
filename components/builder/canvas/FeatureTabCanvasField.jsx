'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  featureTabFieldHasInlineHtml,
  sanitizeFeatureTabFieldHtml,
} from '@/lib/featureTabInlineHtml';
import { isFocusInFloatingToolbar, shouldDeferInlineEditBlurCommit } from '@/lib/inlineEditBlurGuard';
import { saveRichTextSelection } from '@/lib/richTextExecCommands';
import { syncInlineFontSizeHostFromHtml } from '@/lib/inlineFontSize';

export const BLD_FORMATTING_LOCK_ATTR = 'data-bld-formatting-lock';

function writeFieldContent(el, value, htmlMode) {
  if (!el) return;
  if (htmlMode) {
    el.innerHTML = featureTabFieldHasInlineHtml(value)
      ? sanitizeFeatureTabFieldHtml(value)
      : String(value || '');
    syncInlineFontSizeHostFromHtml(el, el.innerHTML);
  } else {
    el.innerText = String(value || '');
    syncInlineFontSizeHostFromHtml(el, '');
  }
}

/**
 * Canvas inline field for Feature Tabs — click to edit, blur to save.
 */
export default function FeatureTabCanvasField({
  as: Tag = 'span',
  className = '',
  value = '',
  multiline = false,
  htmlMode = false,
  neutralizeBodyColorsPersist = false,
  disabled = false,
  onCommit,
  onPointerDown,
  blurCommitGuard,
  /** Skip prop→DOM sync while toolbar session is open (blur uses blurCommitGuard only). */
  valueSyncGuard = null,
  stopPropagation = true,
  autoFocus = false,
  id,
}) {
  const ref = useRef(null);
  const focusedRef = useRef(false);

  useLayoutEffect(() => {
    writeFieldContent(ref.current, value, htmlMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per mount
  }, []);

  useEffect(() => {
    if (!ref.current || focusedRef.current) return;
    if (ref.current.getAttribute(BLD_FORMATTING_LOCK_ATTR) === '1') return;
    const syncBlocked =
      (typeof valueSyncGuard === 'function' && Boolean(valueSyncGuard())) ||
      isFocusInFloatingToolbar();
    if (syncBlocked) return;
    writeFieldContent(ref.current, value, htmlMode);
  }, [value, htmlMode, valueSyncGuard]);

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

  const pointerHandler = (event) => {
    if (ref.current) saveRichTextSelection(ref.current);
    stopBubble(event);
  };

  const handlePaste = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const el = ref.current;
    if (!el) return;
    const text = event.clipboardData?.getData('text/plain') || '';
    if (!text) return;
    document.execCommand('insertText', false, text);
    saveRichTextSelection(el);
  };

  const commitFromElement = (el) => {
    if (!el || el.getAttribute(BLD_FORMATTING_LOCK_ATTR) === '1') return;
    const raw = htmlMode ? el.innerHTML : el.innerText;
    const sanitizeOpts = { neutralizeHardcodedBodyTextColors: neutralizeBodyColorsPersist };
    const next = htmlMode ? sanitizeFeatureTabFieldHtml(String(raw || ''), sanitizeOpts) : String(raw || '').trim();
    const prev = htmlMode
      ? sanitizeFeatureTabFieldHtml(String(value || ''), sanitizeOpts)
      : String(value || '').trim();
    if (next !== prev) onCommit?.(next);
  };

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
        if (ref.current) saveRichTextSelection(ref.current);
      }}
      onBlur={(event) => {
        focusedRef.current = false;
        window.setTimeout(() => {
          const sessionOpen =
            typeof blurCommitGuard === 'function' ? Boolean(blurCommitGuard()) : false;
          if (shouldDeferInlineEditBlurCommit(event, sessionOpen)) return;
          commitFromElement(event.currentTarget);
        }, 0);
      }}
      onPointerDown={onPointerDown || stopPropagation ? pointerHandler : undefined}
      onClick={stopPropagation ? stopBubble : undefined}
      onKeyUp={() => {
        if (ref.current) saveRichTextSelection(ref.current);
      }}
      onMouseUp={() => {
        if (ref.current) saveRichTextSelection(ref.current);
      }}
      onPaste={handlePaste}
      onInput={() => {
        if (ref.current) saveRichTextSelection(ref.current);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Escape') {
          event.preventDefault();
          if (ref.current) writeFieldContent(ref.current, value, htmlMode);
          event.currentTarget.blur();
        } else if (event.key === 'Enter' && !multiline && !event.shiftKey) {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    />
  );
}
