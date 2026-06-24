'use client';

import DomainStatusBadge from '@/components/admin/d/DomainStatusBadge';
import { describeDomainRouting, describeLocalhostRouting } from '@/lib/admin/projectRoutingDisplay';

/**
 * @param {{ routing: ReturnType<typeof describeLocalhostRouting>; variant: 'localhost' | 'domain' }} props
 */
export function ProjectRoutingCell({ routing, variant, compact = false }) {
  const kindClass = routing.kind ? `d-routing--${routing.kind}` : '';
  const domainRows = variant === 'domain' && Array.isArray(routing.domains) ? routing.domains : [];

  if (compact) {
    if (variant === 'localhost') {
      if (routing.url) {
        return (
          <a className="d-routing__url" href={routing.url} target="_blank" rel="noopener noreferrer">
            {routing.url}
          </a>
        );
      }
      return <span className="d-routing__muted">—</span>;
    }

    if (!domainRows.length && !routing.url) {
      return <span className="d-routing__muted">—</span>;
    }

    if (domainRows.length > 1) {
      return (
        <ul className="d-routing__domain-list d-routing__domain-list--compact">
          {domainRows.map((row) => (
            <li key={row.domain} className="d-routing__domain-item">
              <a className="d-routing__url" href={row.url} target="_blank" rel="noopener noreferrer">
                {row.domain}
              </a>
              <DomainStatusBadge status={row.domainStatus} />
            </li>
          ))}
        </ul>
      );
    }

    return (
      <span className="d-routing__compact">
        {routing.url ? (
          <a className="d-routing__url" href={routing.url} target="_blank" rel="noopener noreferrer">
            {routing.domain || routing.url}
          </a>
        ) : (
          <span>{routing.domain || routing.title}</span>
        )}
        {routing.domain ? <DomainStatusBadge status={routing.domainStatus} /> : null}
      </span>
    );
  }

  const domainRowsFull = variant === 'domain' && Array.isArray(routing.domains) ? routing.domains : [];

  if (domainRowsFull.length > 1) {
    return (
      <div className={`d-routing d-routing--${variant} ${kindClass}`.trim()}>
        <p className="d-routing__title">{routing.title}</p>
        <ul className="d-routing__domain-list">
          {domainRowsFull.map((row) => (
            <li key={row.domain} className="d-routing__domain-item">
              <a className="d-routing__url" href={row.url} target="_blank" rel="noopener noreferrer">
                {row.domain}
              </a>
              <DomainStatusBadge status={row.domainStatus} />
            </li>
          ))}
        </ul>
        {routing.detail ? <p className="d-routing__detail">{routing.detail}</p> : null}
      </div>
    );
  }

  return (
    <div className={`d-routing d-routing--${variant} ${kindClass}`.trim()}>
      <p className="d-routing__title">{routing.title}</p>
      {routing.url ? (
        <a className="d-routing__url" href={routing.url} target="_blank" rel="noopener noreferrer">
          {routing.url}
        </a>
      ) : null}
      {routing.detail ? <p className="d-routing__detail">{routing.detail}</p> : null}
      {variant === 'domain' && routing.domain ? (
        <DomainStatusBadge status={routing.domainStatus} />
      ) : null}
    </div>
  );
}

/**
 * Best URL for Open live / copy — domain first, then localhost if default.
 */
export function resolvePrimaryPreviewUrl(project, { isDefault, origin }) {
  const domain = describeDomainRouting(project, { origin });
  if (domain.url) return domain.url;
  const localhost = describeLocalhostRouting(project, { isDefault, origin });
  return localhost.url;
}
