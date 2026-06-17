import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminProjectBlog from '@/components/admin/workspace/AdminProjectBlog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Blog',
  description: 'Manage blog posts and SEO',
};

export default async function ProjectBlogPage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'blog');
  return <AdminProjectBlog projectId={projectId} />;
}
