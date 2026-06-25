import { notFound, redirect } from 'next/navigation';
import BuilderShellClient from './BuilderShellClient';
import {
  adminBuilderPagePath,
  adminFlatBuilderPagePath,
} from '@/lib/builder/adminBuilderRoutes';
import { adminActivePathOpts } from '@/lib/admin/adminRoutes';
import { isPublicSlug, resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getPageIdByProjectAndPageSlug, getPageRoutingInfo } from '@/services/builder/builderService';
import { getActiveProject } from '@/services/platform/siteSettingService';

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

  const active = await getActiveProject();
  const activeOpts = adminActivePathOpts(active);

  if (segments.length === 1) {
    const seg = segments[0];
    const pageId = Number(seg);
    if (Number.isInteger(pageId) && pageId > 0) {
      const route = await getPageRoutingInfo(pageId);
      if (!route?.projectSlug || !route?.pageSlug) {
        notFound();
      }
      redirect(adminBuilderPagePath(route.projectSlug, route.pageSlug, activeOpts));
    }

    if (isPublicSlug(seg)) {
      if (!active?.slug) {
        notFound();
      }
      const flatPageId = await getPageIdByProjectAndPageSlug(active.slug, seg);
      if (!flatPageId) {
        notFound();
      }
      return <BuilderShellClient pageId={flatPageId} />;
    }

    notFound();
  }

  if (segments.length !== 2) {
    notFound();
  }

  const [projectSlug, pageSlug] = segments;
  if (!isPublicSlug(projectSlug) || !isPublicSlug(pageSlug)) {
    notFound();
  }

  if (active?.slug && projectSlug === active.slug) {
    redirect(adminFlatBuilderPagePath(pageSlug));
  }

  const resolvedPageId = await getPageIdByProjectAndPageSlug(projectSlug, pageSlug);
  if (!resolvedPageId) {
    notFound();
  }

  return <BuilderShellClient pageId={resolvedPageId} />;
}
