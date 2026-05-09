import { notFound } from 'next/navigation';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import ProjectSeoShell from '@/components/builder/seo/ProjectSeoShell';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project SEO',
  description: 'Project-level SEO defaults',
};

export default async function ProjectSeoPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  return <ProjectSeoShell projectId={projectId} />;
}

