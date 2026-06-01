import { fail, ok, parseJsonBody } from '@/lib/api';
import {
  addProjectDomain,
  listProjectDomains,
} from '@/services/platform/domainService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const projectId = Number((await params).projectId);
  try {
    const domains = await listProjectDomains(projectId);
    return ok({ domains });
  } catch (error) {
    return fail('Failed to list domains', 500, error.message);
  }
}

export async function POST(request, { params }) {
  const projectId = Number((await params).projectId);
  const body = await parseJsonBody(request);
  if (!body?.domain) return fail('domain is required', 400);
  try {
    const domain = await addProjectDomain(projectId, body.domain);
    return ok({ domain }, 201);
  } catch (error) {
    if (error.message.includes('already')) return fail(error.message, 409);
    return fail('Failed to add domain', 500, error.message);
  }
}
