import { fail, ok } from '@/lib/api';
import { resolveProjectSlugFromHost } from '@/services/platform/domainService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const host = request.nextUrl.searchParams.get('host') || request.headers.get('host');
  if (!host) return fail('host is required', 400);
  try {
    const projectSlug = await resolveProjectSlugFromHost(host);
    if (!projectSlug) return ok({ projectSlug: null });
    return ok({ projectSlug });
  } catch (error) {
    return fail('Failed to resolve host', 500, error.message);
  }
}
