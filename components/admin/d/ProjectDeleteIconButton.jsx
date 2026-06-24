'use client';

const TRASH_ICON = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M4.5 6.5h11M8 4.5h4a1 1 0 011 1v1H7v-1a1 1 0 011-1zM7.5 9v5.5M10 9v5.5M12.5 9v5.5M6 6.5l.5 9a1.5 1.5 0 001.5 1.5h4a1.5 1.5 0 001.5-1.5l.5-9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Icon-only delete control for archived projects.
 */
export default function ProjectDeleteIconButton({ label = 'Delete project', disabled, onClick }) {
  return (
    <button
      type="button"
      className="d-projects__icon-btn d-projects__icon-btn--danger"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {TRASH_ICON}
    </button>
  );
}
