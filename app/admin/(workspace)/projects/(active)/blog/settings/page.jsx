import { resolveAdminActiveProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminBlogSettings from '@/components/admin/blog/AdminBlogSettings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog Settings · Project' };

export default async function Page() {
  const ctx = await resolveAdminActiveProjectRoute('blog');
  return <AdminBlogSettings projectId={ctx.projectId} />;
}
