import crypto from 'node:crypto';
import { buildDnsInstructions } from '@/lib/platform/domainDns';
import {
  allowManualDomainVerify,
  checkTxtVerification,
  DomainVerificationError,
} from '@/lib/platform/domainVerification';
import { validateDomainInput, normalizeDomain } from '@/lib/platform/domainValidation';
import { getDbPool, withTransaction } from '@/lib/db';

const PLATFORM_HOSTS = new Set(['dispatch.in', 'acenest.in', 'myshop.in']);

function makeVerificationToken() {
  return crypto.randomBytes(16).toString('hex');
}

export function getPlatformSupportedHosts() {
  return Array.from(PLATFORM_HOSTS);
}

export function isPlatformManagedHost(host) {
  const h = normalizeDomain(host);
  return PLATFORM_HOSTS.has(h);
}

function mapDomainRow(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    domain: row.domain,
    verified: Boolean(row.verified),
    sslStatus: row.ssl_status,
    verificationToken: row.verification_token,
    isPrimary: Boolean(row.is_primary),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastCheckedAt: row.last_checked_at || null,
    verificationError: row.verification_error || null,
    dnsInstructions: buildDnsInstructions(row.domain, row.verification_token),
  };
}

export async function listProjectDomains(projectId) {
  const pid = Number(projectId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  const [rows] = await getDbPool().query(
    `SELECT id, project_id, domain, verified, ssl_status, verification_token, is_primary,
            created_at, updated_at, last_checked_at, verification_error
     FROM project_domains
     WHERE project_id = ?
     ORDER BY is_primary DESC, created_at ASC`,
    [pid]
  );
  return rows.map(mapDomainRow);
}

export async function addProjectDomain(projectId, domainInput) {
  const pid = Number(projectId);
  const validated = validateDomainInput(domainInput);
  if (!validated.ok) throw new Error(validated.error);
  const domain = validated.domain;
  const token = makeVerificationToken();

  return withTransaction(async (connection) => {
    const [projectRows] = await connection.query(`SELECT id FROM projects WHERE id = ? LIMIT 1`, [
      pid,
    ]);
    if (!projectRows.length) throw new Error('Project not found');

    const [dup] = await connection.query(
      `SELECT id FROM project_domains WHERE domain = ? LIMIT 1`,
      [domain]
    );
    if (dup.length) throw new Error('Domain already connected to a project');

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS c FROM project_domains WHERE project_id = ?`,
      [pid]
    );
    const isPrimary = Number(countRows[0]?.c || 0) === 0 ? 1 : 0;

    const [insert] = await connection.query(
      `INSERT INTO project_domains (project_id, domain, verified, ssl_status, verification_token, is_primary)
       VALUES (?, ?, 0, 'pending', ?, ?)`,
      [pid, domain, token, isPrimary]
    );

    const [rows] = await connection.query(`SELECT * FROM project_domains WHERE id = ?`, [
      insert.insertId,
    ]);
    const row = rows[0];
    return mapDomainRow(row);
  });
}

export async function verifyProjectDomain(projectId, domainId) {
  const pid = Number(projectId);
  const did = Number(domainId);
  const pool = getDbPool();

  const [domainRows] = await pool.query(
    `SELECT id, domain, verification_token, verified
     FROM project_domains WHERE id = ? AND project_id = ? LIMIT 1`,
    [did, pid]
  );
  const row = domainRows[0];
  if (!row) throw new Error('Domain not found');
  if (row.verified) return listProjectDomains(pid);

  const dnsResult = await checkTxtVerification(row.domain, row.verification_token);

  if (dnsResult.ok) {
    await pool.query(
      `UPDATE project_domains
       SET verified = 1, ssl_status = 'active', last_checked_at = CURRENT_TIMESTAMP,
           verification_error = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      [did, pid]
    );
    const domains = await listProjectDomains(pid);
    return { domains, verification: { method: 'dns', dnsChecked: true } };
  }

  if (allowManualDomainVerify()) {
    await pool.query(
      `UPDATE project_domains
       SET verified = 1, ssl_status = 'active', last_checked_at = CURRENT_TIMESTAMP,
           verification_error = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND project_id = ?`,
      [did, pid]
    );
    const domains = await listProjectDomains(pid);
    return {
      domains,
      verification: {
        method: 'manual',
        dnsChecked: true,
        warning: dnsResult.error || 'DNS TXT not found — verified via dev/manual fallback',
      },
    };
  }

  const verificationError = (dnsResult.error || 'DNS verification failed').slice(0, 512);
  await pool.query(
    `UPDATE project_domains
     SET last_checked_at = CURRENT_TIMESTAMP, verification_error = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND project_id = ?`,
    [verificationError, did, pid]
  );

  throw new DomainVerificationError(verificationError, {
    verificationError,
    lastCheckedAt: dnsResult.checkedAt,
  });
}

export async function setPrimaryProjectDomain(projectId, domainId) {
  const pid = Number(projectId);
  const did = Number(domainId);
  return withTransaction(async (connection) => {
    await connection.query(`UPDATE project_domains SET is_primary = 0 WHERE project_id = ?`, [
      pid,
    ]);
    await connection.query(
      `UPDATE project_domains SET is_primary = 1 WHERE id = ? AND project_id = ?`,
      [did, pid]
    );
    const [rows] = await connection.query(
      `SELECT domain FROM project_domains WHERE id = ? AND project_id = ? LIMIT 1`,
      [did, pid]
    );
    if (rows[0]?.domain) {
      const [proj] = await connection.query(
        `SELECT config_json FROM projects WHERE id = ? LIMIT 1`,
        [pid]
      );
      let config = {};
      try {
        config =
          typeof proj[0].config_json === 'object'
            ? proj[0].config_json
            : JSON.parse(proj[0].config_json || '{}');
      } catch {
        config = {};
      }
      config.seo = { ...(config.seo || {}), canonicalDomain: `https://${rows[0].domain}` };
      await connection.query(`UPDATE projects SET config_json = ? WHERE id = ?`, [
        JSON.stringify(config),
        pid,
      ]);
    }
    return listProjectDomains(pid);
  });
}

export async function removeProjectDomain(projectId, domainId) {
  const pid = Number(projectId);
  const did = Number(domainId);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid projectId');
  if (!Number.isInteger(did) || did <= 0) throw new Error('Invalid domainId');

  return withTransaction(async (connection) => {
    const [rows] = await connection.query(
      `SELECT id, is_primary FROM project_domains WHERE id = ? AND project_id = ? LIMIT 1`,
      [did, pid]
    );
    if (!rows.length) throw new Error('Domain not found');

    const wasPrimary = Boolean(rows[0].is_primary);
    await connection.query(`DELETE FROM project_domains WHERE id = ? AND project_id = ?`, [did, pid]);

    if (wasPrimary) {
      const [next] = await connection.query(
        `SELECT id FROM project_domains WHERE project_id = ? ORDER BY created_at ASC LIMIT 1`,
        [pid]
      );
      if (next.length) {
        await connection.query(`UPDATE project_domains SET is_primary = 1 WHERE id = ?`, [next[0].id]);
        const [domainRow] = await connection.query(
          `SELECT domain FROM project_domains WHERE id = ? LIMIT 1`,
          [next[0].id]
        );
        if (domainRow[0]?.domain) {
          const [proj] = await connection.query(
            `SELECT config_json FROM projects WHERE id = ? LIMIT 1`,
            [pid]
          );
          let config = {};
          try {
            config =
              typeof proj[0].config_json === 'object'
                ? proj[0].config_json
                : JSON.parse(proj[0].config_json || '{}');
          } catch {
            config = {};
          }
          config.seo = { ...(config.seo || {}), canonicalDomain: `https://${domainRow[0].domain}` };
          await connection.query(`UPDATE projects SET config_json = ? WHERE id = ?`, [
            JSON.stringify(config),
            pid,
          ]);
        }
      } else {
        const [proj] = await connection.query(
          `SELECT config_json FROM projects WHERE id = ? LIMIT 1`,
          [pid]
        );
        let config = {};
        try {
          config =
            typeof proj[0].config_json === 'object'
              ? proj[0].config_json
              : JSON.parse(proj[0].config_json || '{}');
        } catch {
          config = {};
        }
        if (config.seo?.canonicalDomain) {
          delete config.seo.canonicalDomain;
          await connection.query(`UPDATE projects SET config_json = ? WHERE id = ?`, [
            JSON.stringify(config),
            pid,
          ]);
        }
      }
    }

    return listProjectDomains(pid);
  });
}

/**
 * Resolve project slug from Host header (custom domain or platform host).
 */
export async function resolveProjectSlugFromHost(hostHeader) {
  const host = normalizeDomain(hostHeader);
  if (!host) return null;

  try {
    const [rows] = await getDbPool().query(
      `SELECT pr.slug
       FROM project_domains pd
       INNER JOIN projects pr ON pr.id = pd.project_id
       WHERE pd.domain = ? AND pd.verified = 1
       LIMIT 1`,
      [host]
    );
    if (rows.length) return rows[0].slug;

    if (PLATFORM_HOSTS.has(host)) {
      const map = {
        'dispatch.in': 'dispatch',
        'acenest.in': 'acenest',
        'myshop.in': 'myshop',
      };
      const slug = map[host];
      if (slug) {
        const [exists] = await getDbPool().query(`SELECT id FROM projects WHERE slug = ? LIMIT 1`, [
          slug,
        ]);
        if (exists.length) return slug;
      }
    }
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') return null;
    throw error;
  }
  return null;
}
