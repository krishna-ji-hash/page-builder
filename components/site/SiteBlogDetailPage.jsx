import BlogDetailPage from '@/components/runtime/BlogDetailPage';
import { siteBlogPostToDetailProps } from '@/lib/blogDetailPageDefaults';

/**
 * @param {{ post: import('@/lib/siteBlogPosts').SiteBlogPost, blogListHref?: string }} props
 */
export default function SiteBlogDetailPage({ post, blogListHref = '/blog' }) {
  return <BlogDetailPage {...siteBlogPostToDetailProps(post, blogListHref)} />;
}
