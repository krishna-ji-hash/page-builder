import { fail, ok } from '@/lib/api';
import { listPagesForBuilder } from '@/services/builder/builderService';

export async function GET() {
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
