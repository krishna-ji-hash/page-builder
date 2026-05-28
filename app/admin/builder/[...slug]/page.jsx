import { notFound, redirect } from 'next/navigation';
import BuilderShellClient from './BuilderShellClient';
import { adminBuilderPagePath } from '@/lib/builder/adminBuilderRoutes';
import { isPublicSlug, resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getPageIdByProjectAndPageSlug, getPageRoutingInfo } from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Builder',
  description: 'Edit page layout',
};

export default async function AdminBuilderEditorPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const segments = Array.isArray(resolved.slug)
    ? resolved.slug
    : resolved.slug
      ? [resolved.slug]
      : [];

  if (segments.length === 1) {
    const pageId = Number(segments[0]);
    if (!Number.isInteger(pageId) || pageId <= 0) {
      notFound();
    }
    const route = await getPageRoutingInfo(pageId);
    if (!route?.projectSlug || !route?.pageSlug) {
      notFound();
    }
    redirect(adminBuilderPagePath(route.projectSlug, route.pageSlug));
  }

  if (segments.length !== 2) {
    notFound();
  }

  const [projectSlug, pageSlug] = segments;
  if (!isPublicSlug(projectSlug) || !isPublicSlug(pageSlug)) {
    notFound();
  }

  const pageId = await getPageIdByProjectAndPageSlug(projectSlug, pageSlug);
  if (!pageId) {
    notFound();
  }

  return <BuilderShellClient pageId={pageId} />;
}
