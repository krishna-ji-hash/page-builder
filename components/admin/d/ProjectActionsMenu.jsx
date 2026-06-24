'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import ProjectDeleteIconButton from '@/components/admin/d/ProjectDeleteIconButton';

/**
 * Compact row actions: primary buttons + overflow menu.
 */
export default function ProjectActionsMenu({
  project,
  isActive,
  busy,
  pagesPath,
  domainsPath,
  publicUrl,
  onSetDefault,
  onEdit,
  onArchive,
  onDelete,
}) {
  const isArchived = project.status === 'ARCHIVED';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onDocClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  const copyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setMenuOpen(false);
    } catch {
      window.alert('Could not copy URL');
    }
  };

  return (
    <div className="d-projects__row-actions" ref={menuRef}>
      <Link className="platform-btn platform-btn--primary platform-btn--sm" href={pagesPath}>
        Pages
      </Link>
      {domainsPath ? (
        <Link className="platform-btn platform-btn--sm" href={domainsPath}>
          Domains
        </Link>
      ) : null}
      <button
        type="button"
        className={`platform-btn platform-btn--sm${isActive ? ' platform-btn--primary' : ''}`}
        disabled={busy || isActive || isArchived}
        onClick={() => onSetDefault(project.id)}
      >
        {isActive ? 'localhost default' : 'Set default'}
      </button>
      {isArchived ? (
        <ProjectDeleteIconButton
          label={`Delete ${project.name || project.slug}`}
          disabled={busy}
          onClick={() => onDelete(project)}
        />
      ) : null}
      <div className="d-projects__menu">
        <button
          type="button"
          className="platform-btn platform-btn--sm d-projects__menu-trigger"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          More
        </button>
        {menuOpen ? (
          <div className="d-projects__menu-panel" role="menu">
            {publicUrl ? (
              <a
                className="d-projects__menu-item"
                role="menuitem"
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
              >
                Open live site
              </a>
            ) : null}
            {publicUrl ? (
              <button type="button" className="d-projects__menu-item" role="menuitem" onClick={() => void copyUrl()}>
                Copy public URL
              </button>
            ) : null}
            <button
              type="button"
              className="d-projects__menu-item"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onEdit(project);
              }}
            >
              Edit project
            </button>
            <button
              type="button"
              className="d-projects__menu-item d-projects__menu-item--danger"
              role="menuitem"
              disabled={busy || isArchived}
              onClick={() => {
                setMenuOpen(false);
                onArchive(project);
              }}
            >
              Archive
            </button>
            {isArchived ? (
              <button
                type="button"
                className="d-projects__menu-item d-projects__menu-item--danger"
                role="menuitem"
                disabled={busy}
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(project);
                }}
              >
                Delete permanently
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
