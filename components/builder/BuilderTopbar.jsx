'use client';

import ThemeToggle from './ThemeToggle';

const deviceOptions = ['Desktop', 'Tablet', 'Mobile'];

function buildStatusLabel({
  isPublishing,
  isSyncingDraft,
  hasUnpublishedEdits,
  draftVersionNumber,
  publishedVersionId,
}) {
  if (isPublishing) return 'Publishing…';
  if (isSyncingDraft) return 'Reloading draft from server…';
  if (hasUnpublishedEdits) {
    return publishedVersionId
      ? 'Unpublished edits — draft is saved; publish to update the live site.'
      : 'Unpublished edits — nothing live yet; publish when ready.';
  }
  const draft = draftVersionNumber != null ? `Draft v${draftVersionNumber}` : 'Draft';
  return `${draft} — in sync with server.`;
}

export default function BuilderTopbar({
  projectName,
  pageName,
  clipboardNodeTypeLabel = null,
  saveAckVisible = false,
  device,
  onDeviceChange,
  onSave,
  onPublish,
  onPreview,
  onLivePreview,
  previewUrl,
  liveUrl,
  canOpenLivePreview,
  draftVersionNumber,
  publishedVersionId,
  isPublishing,
  isSyncingDraft,
  hasUnpublishedEdits,
  isFreeMode = false,
  onToggleFreeMode,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onOpenHistory,
  onResetToBlank,
  isLayoutDebug = false,
  onToggleLayoutDebug,
  showGrid = false,
  onToggleGrid,
}) {
  const statusText = buildStatusLabel({
    isPublishing,
    isSyncingDraft,
    hasUnpublishedEdits,
    draftVersionNumber,
    publishedVersionId,
  });
  const modeLabel = isFreeMode ? 'Layout: Free' : 'Layout: Strict';
  const debugLabel = isLayoutDebug ? 'Debug: On' : 'Debug: Off';
  const gridLabel = showGrid ? 'Grid: On' : 'Grid: Off';
  const dirtyLabel = hasUnpublishedEdits ? 'Unsaved changes' : 'Saved';

  return (
    <header className="bld-topbar">
      <div className="bld-topbar__left">
        <div className="bld-topbar__title-row">
          <div className="bld-topbar__brand">Project: {projectName || 'default'}</div>
          <div className="bld-topbar__page-name">Page: {pageName}</div>
          {clipboardNodeTypeLabel ? (
            <span className="bld-topbar__clipboard" title="Copied layer (paste with Ctrl+V)">
              Clipboard: <strong>{clipboardNodeTypeLabel}</strong>
            </span>
          ) : null}
        </div>
        <div className="bld-topbar__status" title={previewUrl || liveUrl || undefined}>
          <span className={`bld-topbar__state-pill ${hasUnpublishedEdits ? 'is-dirty' : 'is-clean'}`}>{dirtyLabel}</span>
          {saveAckVisible ? (
            <span className="bld-topbar__save-ack" role="status" aria-live="polite">
              Draft saved
            </span>
          ) : null}
          <span>{statusText}</span>
          {previewUrl ? (
            <span className="bld-topbar__live-path">
              {' '}
              · Draft Preview: <span className="bld-topbar__mono">{previewUrl}</span>
            </span>
          ) : null}
          {liveUrl ? (
            <span className="bld-topbar__live-path">
              {' '}
              · Live URL: <span className="bld-topbar__mono">{liveUrl}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="bld-topbar__center">
        <div className="bld-device-switch" role="tablist" aria-label="Preview device">
          {deviceOptions.map((item) => (
            <button
              key={item}
              type="button"
              className={`bld-device-switch__btn ${device === item.toLowerCase() ? 'is-active' : ''}`}
              onClick={() => onDeviceChange(item.toLowerCase())}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="bld-topbar__right">
        <div className="bld-topbar__actions">
          <ThemeToggle />
          <button type="button" className="bld-btn bld-btn--ghost" onClick={onUndo} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" className="bld-btn bld-btn--ghost" onClick={onRedo} disabled={!canRedo}>
            Redo
          </button>
          <button type="button" className="bld-btn bld-btn--ghost" onClick={onOpenHistory} title="Restore a previous snapshot">
            Timeline
          </button>
          <button type="button" className="bld-btn bld-btn--ghost" onClick={onResetToBlank}>
            Reset
          </button>
          <button
            type="button"
            className={`bld-btn ${isFreeMode ? 'bld-btn--secondary' : 'bld-btn--ghost'}`}
            onClick={onToggleFreeMode}
            title={
              isFreeMode
                ? 'Switch to Strict: restores flex layout so header space-between and gaps work (fixes overlapping menu/buttons).'
                : 'Free mode: drag blocks by pixels (absolute). Use for fine tweaks — headers usually stay Strict.'
            }
          >
            {modeLabel}
          </button>
          <button
            type="button"
            className={`bld-btn ${isLayoutDebug ? 'bld-btn--secondary' : 'bld-btn--ghost'}`}
            onClick={onToggleLayoutDebug}
            title="Toggle layout debug outlines"
          >
            {debugLabel}
          </button>
          <button
            type="button"
            className={`bld-btn ${showGrid ? 'bld-btn--secondary' : 'bld-btn--ghost'}`}
            onClick={onToggleGrid}
            title="Show a 12-column visual grid overlay (guides only)"
          >
            {gridLabel}
          </button>
          <span className="bld-topbar__actions-sep" aria-hidden="true" />
          <button
            type="button"
            className="bld-btn bld-btn--secondary"
            onClick={onPreview}
            disabled={!previewUrl}
            title={!previewUrl ? 'Draft preview URL unavailable' : 'Open draft preview'}
          >
            Draft Preview
          </button>
          <button
            type="button"
            className="bld-btn bld-btn--secondary"
            onClick={onLivePreview}
            disabled={!canOpenLivePreview}
            title={!canOpenLivePreview ? 'Publish at least once to open public live URL' : undefined}
          >
            Live
          </button>
          <button
            type="button"
            className="bld-btn bld-btn--outline"
            onClick={onSave}
            disabled={isSyncingDraft || isPublishing}
          >
            {isSyncingDraft ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="bld-btn bld-btn--primary"
            onClick={onPublish}
            disabled={isPublishing || isSyncingDraft}
          >
            {isPublishing ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </header>
  );
}
