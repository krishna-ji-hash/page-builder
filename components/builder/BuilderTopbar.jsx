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

function draftSaveStatusLabel(status, { isSyncingDraft } = {}) {
  if (isSyncingDraft || status === 'saving') return 'Saving...';
  if (status === 'failed') return 'Save failed';
  if (status === 'unsaved') return 'Unsaved';
  return 'Saved';
}

function draftSaveStatusClass(status, { isSyncingDraft } = {}) {
  if (isSyncingDraft || status === 'saving') return 'is-saving';
  if (status === 'failed') return 'is-failed';
  if (status === 'unsaved') return 'is-dirty';
  return 'is-clean';
}

function draftSaveStatusTitle(status, { isSyncingDraft } = {}) {
  if (isSyncingDraft || status === 'saving') return 'Saving the draft';
  if (status === 'failed') return 'Draft save failed';
  if (status === 'unsaved') return 'Draft has unsaved changes';
  return 'Draft is saved';
}

function publishStatusLabel({ isPublishing, hasUnpublishedEdits, publishedVersionId }) {
  if (isPublishing) return 'Publishing';
  if (hasUnpublishedEdits) return 'Unpublished';
  if (publishedVersionId) return 'Live';
  return 'Not live';
}

function publishStatusClass({ isPublishing, hasUnpublishedEdits, publishedVersionId }) {
  if (isPublishing) return 'is-saving';
  if (hasUnpublishedEdits) return 'is-dirty';
  if (publishedVersionId) return 'is-clean';
  return 'is-muted';
}

export default function BuilderTopbar({
  projectName,
  pageName,
  onOpenSeo,
  onOpenAudit,
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
  draftSaveStatus = 'saved',
  isFreeMode = false,
  onToggleFreeMode,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onOpenHistory,
  historyLabel = 'Timeline',
  onResetToBlank,
  isLayoutDebug = false,
  onToggleLayoutDebug,
  showGrid = false,
  onToggleGrid,
}) {
  const projectLabel = projectName || 'default';
  const pageLabel = pageName || 'Page';
  const statusText = buildStatusLabel({
    isPublishing,
    isSyncingDraft,
    hasUnpublishedEdits,
    draftVersionNumber,
    publishedVersionId,
  });
  const saveStatusText = draftSaveStatusLabel(draftSaveStatus, { isSyncingDraft });
  const saveStatusClass = draftSaveStatusClass(draftSaveStatus, { isSyncingDraft });
  const saveStatusTitle = draftSaveStatusTitle(draftSaveStatus, { isSyncingDraft });
  const publishFlags = { isPublishing, hasUnpublishedEdits, publishedVersionId };
  const publishText = publishStatusLabel(publishFlags);
  const publishClass = publishStatusClass(publishFlags);
  const modeLabel = isFreeMode ? 'Layout: Free' : 'Layout: Strict';
  const debugLabel = isLayoutDebug ? 'Debug: On' : 'Debug: Off';
  const gridLabel = showGrid ? 'Grid: On' : 'Grid: Off';
  const previewTitle = previewUrl ? `Open draft preview (${previewUrl})` : 'Draft preview URL unavailable';
  const liveTitle = canOpenLivePreview
    ? `Open the published site${liveUrl ? ` (${liveUrl})` : ''}`
    : 'Publish at least once to open public live URL';

  return (
    <header className="bld-topbar">
      <div className="bld-topbar__identity">
        <div className="bld-topbar__identity-item">
          <span className="bld-topbar__kicker">Project</span>
          <span className="bld-topbar__identity-value" title={projectLabel}>
            {projectLabel}
          </span>
        </div>
        <span className="bld-topbar__identity-sep" aria-hidden="true">
          /
        </span>
        <div className="bld-topbar__identity-item">
          <span className="bld-topbar__kicker">Page</span>
          <span className="bld-topbar__identity-value" title={pageLabel}>
            {pageLabel}
          </span>
        </div>
        {clipboardNodeTypeLabel ? (
          <span className="bld-topbar__clipboard" title="Copied layer (paste with Ctrl+V)">
            Clipboard: <strong>{clipboardNodeTypeLabel}</strong>
          </span>
        ) : null}
      </div>

      <div className="bld-topbar__device">
        <div className="bld-device-switch" role="group" aria-label="Editing device">
          {deviceOptions.map((item) => {
            const value = item.toLowerCase();
            const isActive = device === value;
            return (
              <button
                key={item}
                type="button"
                className={`bld-device-switch__btn ${isActive ? 'is-active' : ''}`}
                aria-pressed={isActive}
                title={`Edit ${item} layout`}
                onClick={() => onDeviceChange(value)}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bld-topbar__tools">
        <div className="bld-topbar__group" role="group" aria-label="History">
          <button type="button" className="bld-btn bld-btn--ghost" onClick={onUndo} disabled={!canUndo} title="Undo">
            Undo
          </button>
          <button type="button" className="bld-btn bld-btn--ghost" onClick={onRedo} disabled={!canRedo} title="Redo">
            Redo
          </button>
          <button type="button" className="bld-btn bld-btn--ghost" onClick={onOpenHistory} title="Restore a previous snapshot">
            {historyLabel}
          </button>
        </div>
        <div className="bld-topbar__group bld-topbar__group--tools" role="group" aria-label="Editing tools">
          <ThemeToggle />
          <button type="button" className="bld-btn bld-btn--ghost" onClick={onOpenSeo} title="Edit page SEO">
            SEO
          </button>
          <button type="button" className="bld-btn bld-btn--ghost" onClick={onOpenAudit} title="Run audits (responsive, performance, accessibility)">
            Audit
          </button>
          <button type="button" className="bld-btn bld-btn--ghost" onClick={onResetToBlank} title="Reset the page to a blank canvas">
            Reset
          </button>
          <button
            type="button"
            className={`bld-btn ${isFreeMode ? 'bld-btn--secondary' : 'bld-btn--ghost'}`}
            aria-pressed={isFreeMode}
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
            aria-pressed={isLayoutDebug}
            onClick={onToggleLayoutDebug}
            title="Toggle layout debug outlines"
          >
            {debugLabel}
          </button>
          <button
            type="button"
            className={`bld-btn ${showGrid ? 'bld-btn--secondary' : 'bld-btn--ghost'}`}
            aria-pressed={showGrid}
            onClick={onToggleGrid}
            title="Show a 12-column visual grid overlay (guides only)"
          >
            {gridLabel}
          </button>
        </div>
      </div>

      <div className="bld-topbar__commit">
        <div className="bld-topbar__status" role="group" aria-label="Draft and publish status">
          <span
            className={`bld-topbar__state-pill ${saveStatusClass}`}
            role="status"
            aria-live="polite"
            title={saveStatusTitle}
          >
            {saveStatusText}
          </span>
          <span
            className={`bld-topbar__state-pill ${publishClass}`}
            role="status"
            aria-live="polite"
            title={statusText}
          >
            {publishText}
          </span>
          {saveAckVisible ? (
            <span className="bld-topbar__save-ack" role="status" aria-live="polite">
              Draft saved
            </span>
          ) : null}
        </div>
        <div className="bld-topbar__group bld-topbar__group--commit">
          <button
            type="button"
            className="bld-btn bld-btn--secondary"
            onClick={onPreview}
            disabled={!previewUrl}
            title={previewTitle}
          >
            Draft Preview
          </button>
          <button
            type="button"
            className="bld-btn bld-btn--secondary"
            onClick={onLivePreview}
            disabled={!canOpenLivePreview}
            title={liveTitle}
          >
            Live
          </button>
          <button
            type="button"
            className="bld-btn bld-btn--secondary"
            onClick={onSave}
            disabled={isSyncingDraft || isPublishing}
            title="Save the draft"
          >
            {isSyncingDraft ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="bld-btn bld-btn--primary"
            onClick={onPublish}
            disabled={isPublishing || isSyncingDraft}
            title="Publish the draft to the live site"
          >
            {isPublishing ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </header>
  );
}
