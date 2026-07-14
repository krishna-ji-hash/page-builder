import {
  buildBlogDetailMetadata,
  renderPublicBlogDetailPage,
} from '@/lib/renderPublicBlogDetailPage';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  return buildBlogDetailMetadata({ slug: resolved.slug });
}

export default async function BlogDetailRoute({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  return renderPublicBlogDetailPage({
    slug: resolved.slug,
    blogListHref: '/blog',
  });
}
