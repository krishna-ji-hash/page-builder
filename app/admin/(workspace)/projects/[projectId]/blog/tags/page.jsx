import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminBlogTaxonomy from '@/components/admin/blog/AdminBlogTaxonomy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog Tags' };

export default async function Page({ params }) {
  const ctx = await resolveAdminProjectRoute(params, 'blog', 'tags');
  return <AdminBlogTaxonomy projectId={ctx.projectId} kind="tags" />;
}
