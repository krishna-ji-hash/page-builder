import { prisma } from '@/lib/prisma';
import { listAdminProjects, type SerializedProject } from '@/services/admin/adminProjectsService';

export type ConnectedDomain = {
  id: number;
  domain: string;
  verified: boolean;
  isPrimary: boolean;
};

export type ProjectWithDomains = SerializedProject & {
  connectedDomains: ConnectedDomain[];
};

export async function listAdminProjectsWithDomains(): Promise<ProjectWithDomains[]> {
  const projects = await listAdminProjects();

  const domainRows = await prisma.$queryRaw<
    { id: bigint; project_id: bigint; domain: string; verified: number; is_primary: number }[]
  >`
    SELECT id, project_id, domain, verified, is_primary
    FROM project_domains
    ORDER BY is_primary DESC, domain ASC
  `;

  const byProject = new Map<number, ConnectedDomain[]>();
  for (const row of domainRows) {
    const pid = Number(row.project_id);
    const list = byProject.get(pid) ?? [];
    list.push({
      id: Number(row.id),
      domain: String(row.domain),
      verified: Number(row.verified) === 1,
      isPrimary: Number(row.is_primary) === 1,
    });
    byProject.set(pid, list);
  }

  return projects.map((project) => ({
    ...project,
    connectedDomains: byProject.get(project.id) ?? [],
  }));
}

async function makeVerificationToken(): Promise<string> {
  const { randomBytes } = await import('node:crypto');
  return randomBytes(16).toString('hex');
}

/** Keep `project_domains` in sync when admin sets `projects.domain` from the project list. */
export async function syncPrimaryDomainRecord(projectId: bigint, domain: string | null) {
  if (!domain) {
    await prisma.$executeRaw`
      DELETE FROM project_domains
      WHERE project_id = ${projectId} AND is_primary = 1
    `;
    return;
  }

  const token = await makeVerificationToken();
  const existing = await prisma.$queryRaw<{ id: bigint }[]>`
    SELECT id FROM project_domains WHERE domain = ${domain} LIMIT 1
  `;

  if (existing[0]?.id) {
    await prisma.$executeRaw`
      UPDATE project_domains
      SET project_id = ${projectId},
          is_primary = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${existing[0].id}
    `;
    await prisma.$executeRaw`
      UPDATE project_domains SET is_primary = 0 WHERE project_id = ${projectId} AND id <> ${existing[0].id}
    `;
    return;
  }

  await prisma.$executeRaw`
    UPDATE project_domains SET is_primary = 0 WHERE project_id = ${projectId}
  `;
  await prisma.$executeRaw`
    INSERT INTO project_domains (project_id, domain, verified, ssl_status, verification_token, is_primary)
    VALUES (${projectId}, ${domain}, 0, 'pending', ${token}, 1)
  `;
}
