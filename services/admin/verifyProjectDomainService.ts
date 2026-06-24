import { ProjectDomainStatus } from '@prisma/client';
import { AdminProjectValidationError, parseProjectId } from '@/lib/admin/adminProjectInput';
import { verifyProjectDomainHost } from '@/lib/admin/projectDomainVerification';
import { prisma } from '@/lib/prisma';
import { serializeProject, type SerializedProject } from '@/services/admin/adminProjectsService';

export type VerifyProjectDomainResult = {
  project: SerializedProject;
  verification: {
    status: ProjectDomainStatus;
    verified: boolean;
    message: string;
    method: string | null;
    checkedAt: string;
  };
};

export async function verifyAdminProjectDomain(
  projectIdRaw: string,
  requestHost: string
): Promise<VerifyProjectDomainResult> {
  const projectId = parseProjectId(projectIdRaw);
  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) {
    throw new AdminProjectValidationError('Project not found');
  }

  const result = await verifyProjectDomainHost(existing.domain, requestHost);
  const checkedAt = new Date();
  const domainStatus = result.status as ProjectDomainStatus;

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      domainStatus,
      lastVerifiedAt: checkedAt,
    },
  });

  return {
    project: serializeProject(project),
    verification: {
      status: domainStatus,
      verified: result.verified,
      message: result.message,
      method: result.method,
      checkedAt: checkedAt.toISOString(),
    },
  };
}
