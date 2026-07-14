import { resolveAdminActiveProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminBlogTaxonomy from '@/components/admin/blog/AdminBlogTaxonomy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog Categories · Project' };

export default async function Page() {
  const ctx = await resolveAdminActiveProjectRoute('blog');
  return <AdminBlogTaxonomy projectId={ctx.projectId} kind="categories" />;
}
