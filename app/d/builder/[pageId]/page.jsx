import { notFound } from 'next/navigation';
import BuilderShellClient from '@/app/admin/builder/[...slug]/BuilderShellClient';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Builder',
  description: 'Edit page layout',
};

export default async function DBuilderPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const pageId = Number(resolved.pageId);
  if (!Number.isInteger(pageId) || pageId <= 0) {
    notFound();
  }

  return <BuilderShellClient pageId={pageId} apiMode="admin" />;
}
