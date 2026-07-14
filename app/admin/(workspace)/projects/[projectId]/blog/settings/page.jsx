import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminBlogSettings from '@/components/admin/blog/AdminBlogSettings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog Settings' };

export default async function Page({ params }) {
  const ctx = await resolveAdminProjectRoute(params, 'blog', 'settings');
  return <AdminBlogSettings projectId={ctx.projectId} />;
}
