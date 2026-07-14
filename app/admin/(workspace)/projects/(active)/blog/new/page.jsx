import { resolveAdminActiveProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminBlogPostEditor from '@/components/admin/blog/AdminBlogPostEditor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Blog Post · Project' };

export default async function Page() {
  const ctx = await resolveAdminActiveProjectRoute('blog');
  return <AdminBlogPostEditor projectId={ctx.projectId} projectSlug={ctx.projectSlug} />;
}
