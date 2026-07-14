import { resolveAdminActiveProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminBlogPostsList from '@/components/admin/blog/AdminBlogPostsList';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog Posts · Project' };

export default async function Page() {
  const ctx = await resolveAdminActiveProjectRoute('blog');
  return <AdminBlogPostsList projectId={ctx.projectId} projectSlug={ctx.projectSlug} />;
}
