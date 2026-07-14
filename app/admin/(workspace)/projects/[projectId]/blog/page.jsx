import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminBlogPostsList from '@/components/admin/blog/AdminBlogPostsList';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog Posts', description: 'Manage blog posts' };

export default async function ProjectBlogPage({ params }) {
  const ctx = await resolveAdminProjectRoute(params, 'blog');
  return <AdminBlogPostsList projectId={ctx.projectId} projectSlug={ctx.projectSlug} />;
}
