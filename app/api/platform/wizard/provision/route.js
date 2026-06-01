import { fail, ok, parseJsonBody } from '@/lib/api';
import { provisionProjectFromWizard } from '@/services/platform/projectProvisioningService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') return fail('Invalid JSON body', 400);
  try {
    const result = await provisionProjectFromWizard(body);
    return ok(result, 201);
  } catch (error) {
    if (error.message?.includes('already exists')) return fail(error.message, 409);
    if (error.message?.startsWith('Invalid')) return fail(error.message, 400);
    return fail('Failed to provision project', 500, error.message);
  }
}
