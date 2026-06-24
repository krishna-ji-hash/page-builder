'use client';

function labelForStatus(status) {
  const value = String(status || 'PENDING').toUpperCase();
  if (value === 'VERIFIED') return 'Verified';
  if (value === 'FAILED') return 'Failed';
  return 'Pending';
}

/**
 * @param {{ status?: string; className?: string; title?: string }} props
 */
export default function DomainStatusBadge({ status, className = '', title }) {
  const value = String(status || 'PENDING').toUpperCase();
  const mod = value.toLowerCase();

  return (
    <span
      className={`d-domain-status d-domain-status--${mod}${className ? ` ${className}` : ''}`}
      title={title || `Domain status: ${value}`}
    >
      {labelForStatus(value)}
    </span>
  );
}

export function formatLastVerifiedAt(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}
