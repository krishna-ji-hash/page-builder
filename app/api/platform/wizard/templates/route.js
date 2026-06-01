import { fail, ok } from '@/lib/api';
import { listWizardTemplates } from '@/services/platform/projectProvisioningService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const industry = request.nextUrl.searchParams.get('industry') || 'custom';
  try {
    return ok(listWizardTemplates(industry));
  } catch (error) {
    return fail('Failed to list templates', 500, error.message);
  }
}
