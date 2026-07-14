import { fail, ok } from '@/lib/api';
import { ACTIVITY_ACTIONS } from '@/lib/admin/activityActions';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { recordAdminActivity } from '@/services/admin/activityLogService';
import { ensureBlogPostTemplatePage } from '@/services/site/ensureBlogPostTemplatePage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Create or return the blog-post template page (styles /blog/[slug]). */
export async function POST(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const auth = await guardAdminApi(request, {
    projectId: Number(resolved.projectId),
    action: 'write',
  });
  if (auth.error) return auth.error;

  const projectId = Number(resolved.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return fail('Invalid projectId', 400);
  }

  try {
    const { page, created } = await ensureBlogPostTemplatePage(projectId);
    if (created) {
      void recordAdminActivity({
        userId: auth.user.id,
        projectId,
        pageId: page?.id,
        action: ACTIVITY_ACTIONS.PAGE_CREATED,
        metadata: { slug: page?.slug, title: page?.title, template: 'blog-post' },
      });
    }
    return ok({ page, created }, created ? 201 : 200);
  } catch (error) {
    if (error.message === 'Project not found') return fail(error.message, 404);
    if (error.message.startsWith('Invalid')) return fail(error.message, 400);
    if (error.message.includes('already exists')) return fail(error.message, 409);
    return fail('Failed to ensure blog article template', 500, error.message);
  }
}
