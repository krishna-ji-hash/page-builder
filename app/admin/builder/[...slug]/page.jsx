import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
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

async function resolveFlatBuilderPageId(active, pageSlug) {
  const slug = String(pageSlug || '').trim();
  if (!slug) return null;

  if (active?.slug) {
    const id = await getPageIdByProjectAndPageSlug(active.slug, slug);
    if (id) return id;
  }

  const envSlug = String(process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG || '').trim();
  if (envSlug && envSlug !== active?.slug) {
    const id = await getPageIdByProjectAndPageSlug(envSlug, slug);
    if (id) return id;
  }

  return null;
}

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
      const flatPageId = await resolveFlatBuilderPageId(active, seg);
      if (!flatPageId) {
        notFound();
      }
      return (
        <Suspense fallback={<div style={{ padding: 24, color: '#64748b' }}>Loading builder…</div>}>
          <BuilderShellClient pageId={flatPageId} />
        </Suspense>
      );
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

  return (
    <Suspense fallback={<div style={{ padding: 24, color: '#64748b' }}>Loading builder…</div>}>
      <BuilderShellClient pageId={resolvedPageId} />
    </Suspense>
  );
}
