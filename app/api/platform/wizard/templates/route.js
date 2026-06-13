import { fail, ok } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { listWizardTemplates } from '@/services/platform/projectProvisioningService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await guardAdminApi(request, { action: 'read' });
  if (auth.error) return auth.error;
  const industry = request.nextUrl.searchParams.get('industry') || 'custom';
  try {
    return ok(listWizardTemplates(industry));
  } catch (error) {
    return fail('Failed to list templates', 500, error.message);
  }
}
