import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminBlogAuthors from '@/components/admin/blog/AdminBlogAuthors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog Authors' };

export default async function Page({ params }) {
  const ctx = await resolveAdminProjectRoute(params, 'blog', 'authors');
  return <AdminBlogAuthors projectId={ctx.projectId} />;
}
