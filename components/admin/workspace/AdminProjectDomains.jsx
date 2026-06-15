'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { validateDomainInput } from '@/lib/platform/domainValidation';
import '@/styles/admin/platform.css';
import '@/styles/admin/domains.css';

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data?.error === 'string' ? data.error : `Request failed: ${res.status}`;
    const err = new Error(msg);
    err.details = data?.details;
    throw err;
  }
  return data;
}

async function copyText(value) {
  const text = String(value || '');
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function sslStatusLabel(status) {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'active') return 'Active';
  if (s === 'pending') return 'Pending';
  if (s === 'error') return 'Error';
  return status || 'Pending';
}

function formatCheckedAt(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function CopyButton({ value, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="proj-domains__copy"
      onClick={async () => {
        const ok = await copyText(value);
        if (ok) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }
      }}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

function DnsRecordRow({ record }) {
  if (!record) return null;
  return (
    <div className="proj-domains__dns-record">
      <div className="proj-domains__dns-record-head">
        <span className="proj-domains__dns-label">{record.label || record.type}</span>
        <CopyButton value={record.value} label="Copy value" />
      </div>
      <div className="proj-domains__dns-grid">
        <div>
          <span className="proj-domains__dns-field">Host</span>
          <code>{record.host}</code>
        </div>
        <div>
          <span className="proj-domains__dns-field">Type</span>
          <code>{record.type}</code>
        </div>
        <div className="proj-domains__dns-value">
          <span className="proj-domains__dns-field">Value</span>
          <code>{record.value}</code>
        </div>
      </div>
    </div>
  );
}

function DomainCard({ domain, busy, onVerify, onSetPrimary, onRemove }) {
  const [expanded, setExpanded] = useState(!domain.verified);
  const dns = domain.dnsInstructions || {};

  return (
    <article className={`proj-domains__card${domain.isPrimary ? ' proj-domains__card--primary' : ''}`}>
      <div className="proj-domains__card-head">
        <div className="proj-domains__card-main">
          <h3 className="proj-domains__card-name">{domain.domain}</h3>
          <div className="proj-domains__badges">
            {domain.isPrimary ? <span className="proj-domains__badge proj-domains__badge--primary">Primary</span> : null}
            <span className={`proj-domains__badge proj-domains__badge--${domain.verified ? 'verified' : 'pending'}`}>
              {domain.verified ? 'Verified' : 'Unverified'}
            </span>
            <span className={`proj-domains__badge proj-domains__badge--ssl-${domain.sslStatus || 'pending'}`}>
              SSL: {sslStatusLabel(domain.sslStatus)}
            </span>
          </div>
          {domain.isPrimary ? (
            <p className="proj-domains__card-note">Live URL and SEO canonical domain use this hostname.</p>
          ) : null}
          {domain.lastCheckedAt ? (
            <p className="proj-domains__card-meta">Last checked: {formatCheckedAt(domain.lastCheckedAt)}</p>
          ) : null}
          {domain.verificationError ? (
            <p className="proj-domains__card-error" role="alert">
              {domain.verificationError}
            </p>
          ) : null}
        </div>
        <div className="proj-domains__card-actions">
          {!domain.verified ? (
            <button type="button" className="proj-domains__btn proj-domains__btn--primary" disabled={busy} onClick={() => onVerify(domain.id)}>
              Verify domain
            </button>
          ) : null}
          {domain.verified && !domain.isPrimary ? (
            <button type="button" className="proj-domains__btn" disabled={busy} onClick={() => onSetPrimary(domain.id)}>
              Set primary
            </button>
          ) : null}
          <button type="button" className="proj-domains__btn" disabled={busy} onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Hide DNS' : 'DNS instructions'}
          </button>
          <button type="button" className="proj-domains__btn proj-domains__btn--danger" disabled={busy} onClick={() => onRemove(domain)}>
            Remove
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="proj-domains__dns">
          <p className="proj-domains__dns-note">{dns.note}</p>
          <div className="proj-domains__token">
            <span>Verification token</span>
            <code>{domain.verificationToken}</code>
            <CopyButton value={domain.verificationToken} />
          </div>
          <DnsRecordRow record={dns.apexARecord} />
          <DnsRecordRow record={dns.wwwCnameRecord} />
          <DnsRecordRow record={dns.txtRecord} />
        </div>
      ) : null}
    </article>
  );
}

export default function AdminProjectDomains({ projectId }) {
  const [project, setProject] = useState(null);
  const [domains, setDomains] = useState([]);
  const [meta, setMeta] = useState({ serverIp: 'YOUR_SERVER_IP', manualVerifyAllowed: true });
  const [newDomain, setNewDomain] = useState('');
  const [fieldError, setFieldError] = useState('');
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
      const [data, projectsData] = await Promise.all([
        fetchJson(apiBase, { cache: 'no-store' }),
        fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })),
      ]);
      setProject((projectsData.projects || []).find((p) => Number(p.id) === pid) || null);
      setDomains(Array.isArray(data.domains) ? data.domains : []);
      if (data.meta) setMeta((m) => ({ ...m, ...data.meta }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiBase, pid]);

  useEffect(() => {
    if (!Number.isInteger(pid) || pid <= 0) return;
    load();
  }, [pid, load]);

  const stats = useMemo(() => {
    const verified = domains.filter((d) => d.verified).length;
    const primary = domains.find((d) => d.isPrimary);
    return { total: domains.length, verified, primary: primary?.domain || '—' };
  }, [domains]);

  const serverIp = meta.serverIp || domains[0]?.dnsInstructions?.serverIp || 'YOUR_SERVER_IP';
  const serverIpUnset = serverIp === 'YOUR_SERVER_IP';

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

  function validateField(value) {
    const result = validateDomainInput(value);
    if (!result.ok) {
      setFieldError(result.error);
      return null;
    }
    setFieldError('');
    return result.domain;
  }

  async function addDomain(event) {
    event.preventDefault();
    const domain = validateField(newDomain);
    if (!domain) return;
    await runAction(async () => {
      const data = await fetchJson(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      setNewDomain('');
      setFieldError('');
      await load();
      setSuccess(`Added ${data.domain?.domain || domain}. Configure DNS below, then verify.`);
    });
  }

  async function verifyDomain(domainId) {
    await runAction(async () => {
      try {
        const data = await fetchJson(`${apiBase}/${domainId}?action=verify`, { method: 'POST' });
        setDomains(Array.isArray(data.domains) ? data.domains : []);
        if (data.verification?.method === 'manual' && data.verification?.warning) {
          setSuccess(`Verified (dev fallback): ${data.verification.warning}`);
        } else if (data.verification?.method === 'dns') {
          setSuccess('Domain verified via DNS TXT record');
        } else {
          setSuccess('Domain verified');
        }
      } catch (e) {
        if (e.details?.domains) setDomains(e.details.domains);
        else await load();
        throw e;
      }
    });
  }

  async function setPrimary(domainId) {
    await runAction(async () => {
      const data = await fetchJson(`${apiBase}/${domainId}?action=primary`, { method: 'POST' });
      setDomains(Array.isArray(data.domains) ? data.domains : []);
      setSuccess('Primary domain updated — SEO canonical domain synced');
    });
  }

  async function removeDomain(domain) {
    if (!window.confirm(`Remove ${domain.domain} from this project? The live URL will stop resolving to this site.`)) {
      return;
    }
    await runAction(async () => {
      const data = await fetchJson(`${apiBase}/${domain.id}`, { method: 'DELETE' });
      setDomains(Array.isArray(data.domains) ? data.domains : []);
      setSuccess(`Removed ${domain.domain}`);
    });
  }

  return (
    <div className="proj-domains">
      <header className="proj-domains__hero">
        <div className="proj-domains__hero-main">
          <p className="proj-domains__badge">Workspace · Domains</p>
          <h1 className="proj-domains__title">Custom domains</h1>
          <p className="proj-domains__sub">
            {project?.name ? (
              <>
                <strong>{project.name}</strong> — connect a domain, configure DNS, verify ownership, and set the
                primary live URL.
              </>
            ) : (
              'Connect a domain, configure DNS manually, verify ownership, and set the primary live URL.'
            )}
          </p>
        </div>
        {!loading ? (
          <div className="proj-domains__stats">
            <div className="proj-domains__stat">
              <span className="proj-domains__stat-val">{stats.total}</span>
              <span className="proj-domains__stat-label">Domains</span>
            </div>
            <div className="proj-domains__stat">
              <span className="proj-domains__stat-val">{stats.verified}</span>
              <span className="proj-domains__stat-label">Verified</span>
            </div>
            <div className="proj-domains__stat proj-domains__stat--wide">
              <span className="proj-domains__stat-val proj-domains__stat-val--text">{stats.primary}</span>
              <span className="proj-domains__stat-label">Primary</span>
            </div>
          </div>
        ) : null}
      </header>

      {meta.manualVerifyAllowed ? (
        <p className="proj-domains__dev-hint">
          Development mode: <strong>Verify domain</strong> works without DNS TXT. In production, add the TXT record
          first or set <code>DOMAIN_VERIFY_MANUAL=true</code> for staging.
        </p>
      ) : null}

      {serverIpUnset ? (
        <p className="proj-domains__warn">
          Set <code>PLATFORM_SERVER_IP</code> in <code>.env</code> so DNS instructions show your real server IP.
        </p>
      ) : null}

      {loading ? <div className="proj-domains__skeleton" aria-hidden="true" /> : null}

      {error ? (
        <p className="proj-domains__alert proj-domains__alert--error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? <p className="proj-domains__alert proj-domains__alert--success">{success}</p> : null}

      {!loading ? (
        <>
          <section className="proj-domains__section">
            <div className="proj-domains__section-head">
              <h2>Add domain</h2>
              <p>Enter the root domain you want to connect (e.g. example.com)</p>
            </div>
            <form className="proj-domains__add-form" onSubmit={addDomain}>
              <label className="proj-domains__field">
                <span>Domain</span>
                <input
                  type="text"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => {
                    setNewDomain(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  onBlur={() => {
                    if (newDomain.trim()) validateField(newDomain);
                  }}
                  disabled={busy}
                  aria-invalid={Boolean(fieldError)}
                />
                {fieldError ? <span className="proj-domains__field-error">{fieldError}</span> : null}
              </label>
              <button type="submit" className="proj-domains__btn proj-domains__btn--primary" disabled={busy || !newDomain.trim()}>
                {busy ? 'Adding…' : 'Add domain'}
              </button>
            </form>
          </section>

          <section className="proj-domains__section proj-domains__section--help">
            <div className="proj-domains__section-head">
              <h2>Manual DNS setup</h2>
              <p>Configure these records at your DNS provider before verifying</p>
            </div>
            <ul className="proj-domains__help-list">
              <li>
                <strong>A record</strong> — host <code>@</code> → <code>{serverIp}</code>
                {serverIp !== 'YOUR_SERVER_IP' ? <CopyButton value={serverIp} label="Copy IP" /> : null}
              </li>
              <li>
                <strong>CNAME</strong> — host <code>www</code> → your root domain (e.g. <code>example.com</code>)
              </li>
              <li>
                <strong>TXT</strong> — ownership verification record shown on each domain card below
              </li>
            </ul>
          </section>

          {domains.length === 0 ? (
            <div className="proj-domains__empty">
              <p className="proj-domains__empty-title">No custom domains</p>
              <p className="proj-domains__empty-text">Add a domain above to get started.</p>
            </div>
          ) : (
            <div className="proj-domains__list">
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
          )}
        </>
      ) : null}
    </div>
  );
}
