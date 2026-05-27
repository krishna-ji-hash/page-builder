import PublicSitePageView, { buildPublicSiteMetadata } from '@/lib/publicSitePage';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { projectSlug, pageSlug } = await resolveMaybeAsyncParams(params);
  return buildPublicSiteMetadata(projectSlug, pageSlug);
}

export default async function PublicSitePage({ params, searchParams }) {
  const { projectSlug, pageSlug } = await resolveMaybeAsyncParams(params);
  return PublicSitePageView({ projectSlug, pageSlug, searchParams });
}
