/**
 * Build flat server routing map: host → project (localhost + all custom domains).
 * @param {Array<object>} projects
 * @param {number | null | undefined} activeProjectId
 * @param {string} [origin]
 */
export function buildServerDomainMap(projects, activeProjectId, origin = 'http://localhost:3000') {
  const base = String(origin || 'http://localhost:3000').replace(/\/+$/, '');
  const rows = [];
  const seenHosts = new Set();

  const active = projects.find((p) => Number(p.id) === Number(activeProjectId));
  if (active && active.status !== 'ARCHIVED') {
    rows.push({
      host: 'localhost',
      label: base.replace(/^https?:\/\//, '').split(':')[0] || 'localhost',
      projectId: active.id,
      projectName: active.name,
      projectSlug: active.slug,
      url: `${base}/`,
      kind: 'localhost-default',
      verified: true,
    });
    seenHosts.add('localhost');
  }

  for (const project of projects) {
    if (project.status === 'ARCHIVED') continue;

    const domainEntries = collectProjectDomains(project);
    for (const entry of domainEntries) {
      const host = entry.domain;
      if (!host || seenHosts.has(host)) continue;
      seenHosts.add(host);

      const devPort = base.includes(':') ? base.split(':').pop() : '3000';
      const isLocalDev = base.includes('localhost') || base.includes('127.0.0.1');
      const url = isLocalDev ? `http://${host}:${devPort}/` : `https://${host}/`;

      rows.push({
        host,
        label: host,
        projectId: project.id,
        projectName: project.name,
        projectSlug: project.slug,
        url,
        kind: entry.isPrimary ? 'primary-domain' : 'extra-domain',
        verified: entry.verified,
        domainId: entry.domainId,
        isPrimary: entry.isPrimary,
      });
    }
  }

  return rows.sort((a, b) => {
    if (a.kind === 'localhost-default') return -1;
    if (b.kind === 'localhost-default') return 1;
    return String(a.host).localeCompare(String(b.host));
  });
}

/**
 * @param {object} project
 */
export function collectProjectDomains(project) {
  const out = [];
  const seen = new Set();

  const push = (domain, verified, isPrimary, domainId = null) => {
    const normalized = String(domain || '').trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push({
      domain: normalized,
      verified: Boolean(verified),
      isPrimary: Boolean(isPrimary),
      domainId: domainId != null ? Number(domainId) : null,
    });
  };

  if (project?.domain) {
    const connected = Array.isArray(project.connectedDomains) ? project.connectedDomains : [];
    const verified =
      project.domainStatus === 'VERIFIED' ||
      connected.some((d) => d.domain === project.domain && d.verified);
    const match = connected.find((d) => d.domain === project.domain);
    push(project.domain, verified, true, match?.id ?? null);
  }

  if (Array.isArray(project.connectedDomains)) {
    for (const row of project.connectedDomains) {
      push(row.domain, row.verified, row.isPrimary, row.id ?? null);
    }
  }

  return out;
}
