'use client';

import { useEffect, useRef, useState } from 'react';

export default function NodeControls({
  nodeId,
  onMoveMouseDown,
  onDelete,
  onDuplicate,
  disableMove = false,
  disableDelete = false,
  disableDuplicate = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleOpenMenu = (event) => {
      const targetNodeId = Number(event?.detail?.nodeId);
      if (!Number.isFinite(targetNodeId)) return;
      if (targetNodeId !== Number(nodeId)) return;
      setIsOpen(true);
    };
    window.addEventListener('bld-open-node-menu', handleOpenMenu);
    return () => window.removeEventListener('bld-open-node-menu', handleOpenMenu);
  }, [nodeId]);

  return (
    <div
      ref={rootRef}
      className={`bld-node-controls ${className}`.trim()}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="bld-node-controls__btn"
        title="Drag and move"
        aria-label="Drag and move"
        onMouseDown={onMoveMouseDown}
        disabled={disableMove}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path
            fill="currentColor"
            d="M12 2l3 3h-2v4h4V7l3 3-3 3V11h-4v4h2l-3 3-3-3h2v-4H7v2l-3-3 3-3v2h4V5H9l3-3z"
          />
        </svg>
      </button>
      <button
        type="button"
        className={`bld-node-controls__trigger ${isOpen ? 'is-open' : ''}`.trim()}
        aria-label="More actions"
        title="More actions"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        ⋯
      </button>
      {isOpen ? (
        <div className="bld-node-controls__menu">
      <button
        type="button"
        className="bld-node-controls__btn bld-node-controls__btn--danger"
        title="Delete"
        aria-label="Delete"
        onClick={onDelete}
        disabled={disableDelete}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path
            fill="currentColor"
            d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z"
          />
        </svg>
      </button>
      <button
        type="button"
        className="bld-node-controls__btn"
        title="Duplicate"
        aria-label="Duplicate"
        onClick={onDuplicate}
        disabled={disableDuplicate}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path
            fill="currentColor"
            d="M8 8V4h12v12h-4v4H4V8h4zm2 0h6v6h2V6h-8v2zm-4 2v8h8v-8H6z"
          />
        </svg>
      </button>
        </div>
      ) : null}
    </div>
  );
}
