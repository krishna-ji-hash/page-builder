import { notFound } from 'next/navigation';
import PublicSitePageView, { buildPublicSiteMetadata } from '@/lib/publicSitePage';
import {
  getPublicProjectSlug,
  shouldServeFlatPublicPage,
} from '@/lib/publicSiteUrls';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Flat public URLs: `/home`, `/about-us` (segment is the page slug; param name matches `[projectSlug]` tree).
 */
export async function generateMetadata({ params }) {
  const { projectSlug: pageSlug } = await resolveMaybeAsyncParams(params);
  if (!shouldServeFlatPublicPage(pageSlug)) return {};
  return buildPublicSiteMetadata(getPublicProjectSlug(), pageSlug);
}

export default async function FlatPublicPage({ params, searchParams }) {
  const { projectSlug: pageSlug } = await resolveMaybeAsyncParams(params);
  if (!shouldServeFlatPublicPage(pageSlug)) {
    notFound();
  }
  return PublicSitePageView({
    projectSlug: getPublicProjectSlug(),
    pageSlug,
    searchParams,
  });
}
