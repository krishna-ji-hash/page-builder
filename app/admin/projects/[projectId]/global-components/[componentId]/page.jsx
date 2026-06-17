import { notFound } from 'next/navigation';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import GlobalComponentEditorShell from '@/components/builder/GlobalComponentEditorShell';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Global Component Editor',
  description: 'Edit a linked global component',
};

export default async function GlobalComponentEditorPage({ params, searchParams }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'overview');
  const resolved = await resolveMaybeAsyncParams(params);
  const componentId = Number(resolved.componentId);
  if (!Number.isInteger(componentId) || componentId <= 0) notFound();
  const returnTo =
    typeof searchParams?.returnTo === 'string' && searchParams.returnTo.trim()
      ? searchParams.returnTo
      : '/admin/builder';
  return <GlobalComponentEditorShell projectId={projectId} componentId={componentId} returnTo={returnTo} />;
}
