'use client';

import { useCallback, useEffect, useRef } from 'react';
import { sanitizeInlineLeafHtml } from '@/lib/inlineTextHtml';
import {
  execRichCommandInRoot,
  restoreRichTextSelection,
  saveRichTextSelection,
  selectionNonCollapsedInRoot,
} from '@/lib/richTextExecCommands';

function ToolbarBtn({ title, onMouseDown, children, pressed }) {
  return (
    <button
      type="button"
      className={`bld-inline-rich__btn${pressed ? ' is-pressed' : ''}`}
      title={title}
      aria-pressed={pressed || undefined}
      onMouseDown={onMouseDown}
    >
      {children}
    </button>
  );
}

function runCommand(editorRef, command, value) {
  const root = editorRef.current;
  if (!root) return null;
  saveRichTextSelection(root);
  restoreRichTextSelection(root);
  return execRichCommandInRoot(root, command, value);
}

/**
 * Lightweight contenteditable rich field for text / paragraph (Content tab).
 */
export default function InlineRichTextField({ html, onChange, placeholder = 'Type and format words…' }) {
  const editorRef = useRef(null);
  const lastHtmlRef = useRef(html || '');

  const emitHtml = useCallback(() => {
    const root = editorRef.current;
    if (!root) return;
    const safe = sanitizeInlineLeafHtml(root.innerHTML);
    if (safe === lastHtmlRef.current) return;
    lastHtmlRef.current = safe;
    onChange('richTextHtml', safe);
  }, [onChange]);

  useEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    const next = sanitizeInlineLeafHtml(html || '');
    if (next === lastHtmlRef.current && root.innerHTML === next) return;
    lastHtmlRef.current = next;
    root.innerHTML = next || '';
  }, [html]);

  const withCommand = (command, value) => (e) => {
    e.preventDefault();
    const root = editorRef.current;
    if (!root) return;
    saveRichTextSelection(root);
    runCommand(editorRef, command, value);
    emitHtml();
  };

  const onLink = (e) => {
    e.preventDefault();
    const root = editorRef.current;
    if (!root) return;
    saveRichTextSelection(root);
    restoreRichTextSelection(root);
    if (!selectionNonCollapsedInRoot(root)) return;
    const url =
      typeof window !== 'undefined'
        ? window.prompt('Link URL', 'https://')
        : null;
    if (url == null || !String(url).trim()) return;
    runCommand(editorRef, 'createLink', String(url).trim());
    emitHtml();
  };

  const onClear = (e) => {
    e.preventDefault();
    const root = editorRef.current;
    if (!root) return;
    saveRichTextSelection(root);
    restoreRichTextSelection(root);
    if (selectionNonCollapsedInRoot(root)) {
      runCommand(editorRef, 'removeFormat', null);
      runCommand(editorRef, 'unlink', null);
    } else {
      const plain = root.textContent || '';
      root.textContent = plain;
    }
    emitHtml();
  };

  return (
    <div className="bld-inline-rich">
      <div className="bld-inline-rich__toolbar" role="toolbar" aria-label="Inline formatting">
        <ToolbarBtn title="Bold" onMouseDown={withCommand('bold')}>
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn title="Italic" onMouseDown={withCommand('italic')}>
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn title="Underline" onMouseDown={withCommand('underline')}>
          <u>U</u>
        </ToolbarBtn>
        <label className="bld-inline-rich__color" title="Text color">
          <span className="bld-sr-only">Text color</span>
          <input
            type="color"
            defaultValue="#0f172a"
            onMouseDown={(e) => {
              const root = editorRef.current;
              if (root) saveRichTextSelection(root);
            }}
            onChange={(e) => {
              runCommand(editorRef, 'foreColor', e.target.value);
              emitHtml();
            }}
          />
        </label>
        <label className="bld-inline-rich__color" title="Highlight color">
          <span className="bld-sr-only">Highlight</span>
          <input
            type="color"
            defaultValue="#fef08a"
            onMouseDown={(e) => {
              const root = editorRef.current;
              if (root) saveRichTextSelection(root);
            }}
            onChange={(e) => {
              runCommand(editorRef, 'hiliteColor', e.target.value);
              emitHtml();
            }}
          />
        </label>
        <ToolbarBtn title="Link" onMouseDown={onLink}>
          🔗
        </ToolbarBtn>
        <ToolbarBtn title="Clear formatting" onMouseDown={onClear}>
          ✕
        </ToolbarBtn>
      </div>
      <div
        ref={editorRef}
        className="bld-inline-rich__editor bld-rich-content"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emitHtml}
        onBlur={emitHtml}
        onMouseUp={() => {
          const root = editorRef.current;
          if (root) saveRichTextSelection(root);
        }}
        onKeyUp={() => {
          const root = editorRef.current;
          if (root) saveRichTextSelection(root);
        }}
      />
    </div>
  );
}
