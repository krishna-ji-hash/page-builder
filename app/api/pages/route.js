import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { listPagesForBuilder } from '@/services/builder/builderService';

export async function GET(request) {
  const auth = await guardAdminApi(request, { action: 'read' });
  if (auth.error) return auth.error;
  try {
    const rows = await listPagesForBuilder();
    const pages = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      projectSlug: row.project_slug,
    }));
    return ok({ pages });
  } catch (error) {
    return fail('Failed to list pages', 500, error.message);
  }
}
