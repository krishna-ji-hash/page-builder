import { resolveAdminActiveProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminBlogPostEditor from '@/components/admin/blog/AdminBlogPostEditor';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Blog Post · Project' };

export default async function Page({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const ctx = await resolveAdminActiveProjectRoute('blog');
  return (
    <AdminBlogPostEditor
      projectId={ctx.projectId}
      projectSlug={ctx.projectSlug}
      postId={resolved.postId}
    />
  );
}
