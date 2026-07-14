import PublicSitePageView, { buildPublicSiteMetadata } from '@/lib/publicSitePage';
import { getPublicProjectSlug } from '@/lib/publicSiteUrls';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata() {
  const projectSlug = getPublicProjectSlug();
  return buildPublicSiteMetadata(projectSlug, 'blog');
}

export default async function BlogListingPage({ searchParams }) {
  const projectSlug = getPublicProjectSlug();
  return PublicSitePageView({ projectSlug, pageSlug: 'blog', searchParams });
}
