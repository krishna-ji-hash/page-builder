import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminBlogPostEditor from '@/components/admin/blog/AdminBlogPostEditor';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Blog Post' };

export default async function Page({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const ctx = await resolveAdminProjectRoute(params, 'blog', `${resolved.postId}/edit`);
  return (
    <AdminBlogPostEditor
      projectId={ctx.projectId}
      projectSlug={ctx.projectSlug}
      postId={resolved.postId}
    />
  );
}
