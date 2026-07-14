import { resolveAdminActiveProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminBlogAuthors from '@/components/admin/blog/AdminBlogAuthors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog Authors · Project' };

export default async function Page() {
  const ctx = await resolveAdminActiveProjectRoute('blog');
  return <AdminBlogAuthors projectId={ctx.projectId} />;
}
