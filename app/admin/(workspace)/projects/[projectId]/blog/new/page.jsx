import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminBlogPostEditor from '@/components/admin/blog/AdminBlogPostEditor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Blog Post' };

export default async function Page({ params }) {
  const ctx = await resolveAdminProjectRoute(params, 'blog', 'new');
  return <AdminBlogPostEditor projectId={ctx.projectId} projectSlug={ctx.projectSlug} />;
}
