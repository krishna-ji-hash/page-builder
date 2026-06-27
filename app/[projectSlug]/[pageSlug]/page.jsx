import { notFound } from 'next/navigation';
import PublicSitePageView, { buildPublicSiteMetadata } from '@/lib/publicSitePage';
import { isReservedProjectSlugSegment } from '@/lib/publicSiteUrls';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { projectSlug, pageSlug } = await resolveMaybeAsyncParams(params);
  if (isReservedProjectSlugSegment(projectSlug)) return {};
  return buildPublicSiteMetadata(projectSlug, pageSlug);
}

export default async function PublicSitePage({ params, searchParams }) {
  const { projectSlug, pageSlug } = await resolveMaybeAsyncParams(params);
  if (isReservedProjectSlugSegment(projectSlug)) notFound();
  return PublicSitePageView({ projectSlug, pageSlug, searchParams });
}
