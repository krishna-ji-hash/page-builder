'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import '@/styles/admin/platform.css';
import '@/styles/admin/domains.css';

function sslStatusLabel(status) {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'active') return 'Active';
  if (s === 'pending') return 'Pending';
  if (s === 'error') return 'Error';
  return status || 'Pending';
}

function DnsRecordRow({ record }) {
  if (!record) return null;
  return (
    <div className="domain-dns__record">
      <div className="domain-dns__record-label">{record.label || record.type}</div>
      <div className="domain-dns__record-grid">
        <div>
          <span className="domain-dns__field-label">Host</span>
          <code>{record.host}</code>
        </div>
        <div>
          <span className="domain-dns__field-label">Type</span>
          <code>{record.type}</code>
        </div>
        <div className="domain-dns__value">
          <span className="domain-dns__field-label">Value</span>
          <code>{record.value}</code>
        </div>
      </div>
    </div>
  );
}

function formatCheckedAt(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function DomainCard({
  domain,
  busy,
  onVerify,
  onSetPrimary,
  onRemove,
}) {
  const [expanded, setExpanded] = useState(!domain.verified);
  const dns = domain.dnsInstructions || {};

  return (
    <article className={`domain-card${domain.isPrimary ? ' domain-card--primary' : ''}`}>
      <div className="domain-card__header">
        <div>
          <h3 className="domain-card__name">{domain.domain}</h3>
          <div className="domain-card__badges">
            {domain.isPrimary ? <span className="domain-badge domain-badge--primary">Primary</span> : null}
            <span className={`domain-badge domain-badge--${domain.verified ? 'verified' : 'pending'}`}>
              {domain.verified ? 'Verified' : 'Unverified'}
            </span>
            <span className={`domain-badge domain-badge--ssl domain-badge--ssl-${domain.sslStatus || 'pending'}`}>
              SSL: {sslStatusLabel(domain.sslStatus)}
            </span>
          </div>
          {domain.lastCheckedAt ? (
            <p className="domain-card__meta">Last checked: {formatCheckedAt(domain.lastCheckedAt)}</p>
          ) : null}
          {domain.verificationError ? (
            <p className="domain-card__error" role="alert">{domain.verificationError}</p>
          ) : null}
        </div>
        <div className="platform-actions">
          {!domain.verified ? (
            <button
              type="button"
              className="platform-btn platform-btn--primary"
              disabled={busy}
              onClick={() => onVerify(domain.id)}
            >
              Verify domain
            </button>
          ) : null}
          {domain.verified && !domain.isPrimary ? (
            <button
              type="button"
              className="platform-btn"
              disabled={busy}
              onClick={() => onSetPrimary(domain.id)}
            >
              Set primary
            </button>
          ) : null}
          <button
            type="button"
            className="platform-btn"
            disabled={busy}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide DNS' : 'DNS instructions'}
          </button>
          <button
            type="button"
            className="platform-btn domain-card__remove"
            disabled={busy}
            onClick={() => onRemove(domain)}
          >
            Remove
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="domain-dns">
          <p className="domain-dns__note">{dns.note}</p>
          <p className="domain-dns__token">
            Verification token:{' '}
            <code>{domain.verificationToken}</code>
          </p>
          <DnsRecordRow record={dns.apexARecord} />
          <DnsRecordRow record={dns.wwwCnameRecord} />
          <DnsRecordRow record={dns.txtRecord} />
        </div>
      ) : null}
    </article>
  );
}

export default function AdminProjectDomains({ projectId }) {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pid = Number(projectId);
  const apiBase = `/api/projects/${pid}/domains`;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiBase, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to load domains');
      setDomains(Array.isArray(data.domains) ? data.domains : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    if (!Number.isInteger(pid) || pid <= 0) return;
    load();
  }, [pid, load]);

  async function runAction(fn) {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addDomain(event) {
    event.preventDefault();
    const domain = newDomain.trim();
    if (!domain) return;
    await runAction(async () => {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to add domain');
      setNewDomain('');
      await loadAndReturn();
      setSuccess(`Added ${data.domain?.domain || domain}`);
    });
  }

  async function loadAndReturn() {
    const res = await fetch(apiBase, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Failed to reload');
    const list = Array.isArray(data.domains) ? data.domains : [];
    setDomains(list);
    return list;
  }

  async function verifyDomain(domainId) {
    await runAction(async () => {
      const res = await fetch(`${apiBase}/${domainId}?action=verify`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (Array.isArray(data?.details?.domains)) {
          setDomains(data.details.domains);
        } else {
          await loadAndReturn();
        }
        throw new Error(data?.error || data?.details?.verificationError || 'Verification failed');
      }
      setDomains(Array.isArray(data.domains) ? data.domains : []);
      if (data.verification?.method === 'manual' && data.verification?.warning) {
        setSuccess(`Verified (manual fallback): ${data.verification.warning}`);
      } else if (data.verification?.method === 'dns') {
        setSuccess('Domain verified via DNS TXT record');
      } else {
        setSuccess('Domain verified');
      }
    });
  }

  async function setPrimary(domainId) {
    await runAction(async () => {
      const res = await fetch(`${apiBase}/${domainId}?action=primary`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to set primary');
      setDomains(Array.isArray(data.domains) ? data.domains : []);
      setSuccess('Primary domain updated');
    });
  }

  async function removeDomain(domain) {
    const ok = window.confirm(
      `Remove ${domain.domain} from this project? The domain will stop resolving to this site.`
    );
    if (!ok) return;
    await runAction(async () => {
      const res = await fetch(`${apiBase}/${domain.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to remove domain');
      setDomains(Array.isArray(data.domains) ? data.domains : []);
      setSuccess(`Removed ${domain.domain}`);
    });
  }

  const serverIp = domains[0]?.dnsInstructions?.serverIp || 'YOUR_SERVER_IP';

  return (
    <div className="platform-shell">
      <AdminPageHeader
        badge="Workspace · Domains"
        title="Custom domains"
        description="Connect a domain, configure DNS manually, verify ownership, and set the primary live URL."
      />

      <section className="platform-panel" style={{ marginBottom: 16 }}>
        <div className="platform-panel__head">
          <div>
            <h2 className="platform-panel__title">Add domain</h2>
            <p className="platform-panel__sub">Enter the root domain you want to connect</p>
          </div>
        </div>
        <div className="platform-panel__body platform-panel__body--padded">
          <form className="domain-add__form" onSubmit={addDomain}>
            <label className="domain-add__field">
              <span>Domain</span>
              <input
                type="text"
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                disabled={busy}
              />
            </label>
            <button type="submit" className="platform-btn platform-btn--primary" disabled={busy || !newDomain.trim()}>
              Add domain
            </button>
          </form>
        </div>
      </section>

      <section className="platform-panel domain-help" style={{ marginBottom: 16 }}>
        <div className="platform-panel__head">
          <h2 className="platform-panel__title">Manual DNS setup</h2>
        </div>
        <div className="platform-panel__body platform-panel__body--padded">
          <p className="platform-panel__sub" style={{ marginTop: 0 }}>
            Configure these records at your DNS provider:
          </p>
          <ul>
            <li>
              <strong>A record</strong> — <code>@</code> → <code>{serverIp}</code>
            </li>
            <li>
              <strong>CNAME</strong> — <code>www</code> → your root domain (e.g. <code>example.com</code>)
            </li>
            <li>
              <strong>TXT</strong> — verification record shown per domain below
            </li>
          </ul>
        </div>
      </section>

      {loading ? (
        <div className="platform-skeleton platform-skeleton--card" style={{ height: 120 }} aria-hidden="true" />
      ) : null}

      {error ? <p className="domain-alert domain-alert--error" role="alert">{error}</p> : null}
      {success ? <p className="domain-alert domain-alert--success">{success}</p> : null}

      {!loading && domains.length === 0 ? (
        <div className="platform-empty">
          <p className="platform-empty__title">No custom domains</p>
          <p className="platform-empty__text">Add a domain above to get started.</p>
        </div>
      ) : null}

      <div className="domain-list">
        {domains.map((domain) => (
          <DomainCard
            key={domain.id}
            domain={domain}
            busy={busy}
            onVerify={verifyDomain}
            onSetPrimary={setPrimary}
            onRemove={removeDomain}
          />
        ))}
      </div>
    </div>
  );
}
