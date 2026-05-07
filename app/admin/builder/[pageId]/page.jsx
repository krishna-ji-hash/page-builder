import { notFound } from 'next/navigation';
import BuilderShell from '@/components/builder/BuilderShell';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Builder',
  description: 'Edit page layout',
};

export default async function AdminBuilderEditorPage({ params }) {
  const { pageId: pageIdParam } = await resolveMaybeAsyncParams(params);
  const pageId = Number(pageIdParam);
  if (!Number.isInteger(pageId) || pageId <= 0) {
    notFound();
  }
  return <BuilderShell pageId={pageId} />;
}
