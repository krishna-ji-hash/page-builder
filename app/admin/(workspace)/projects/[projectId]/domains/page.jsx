import { notFound } from 'next/navigation';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import AdminProjectDomains from '@/components/admin/workspace/AdminProjectDomains';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Domains',
  description: 'Custom domain mapping, DNS verification, and SSL status',
};

export default async function ProjectDomainsPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  return <AdminProjectDomains projectId={projectId} />;
}
