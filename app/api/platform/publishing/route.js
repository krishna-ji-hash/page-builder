import { fail, ok } from '@/lib/api';
import { getPublishingDashboard } from '@/services/platform/publishingDashboardService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dashboard = await getPublishingDashboard();
    return ok(dashboard);
  } catch (error) {
    if (error?.code === 'ECONNREFUSED') {
      return ok({
        summary: { projects: 0, pages: 0, published: 0, drafts: 0 },
        projects: [],
        pages: [],
        warning: 'Database offline',
      });
    }
    return fail('Failed to load publishing dashboard', 500, error.message);
  }
}
