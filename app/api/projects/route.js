import { fail, ok, parseJsonBody } from '@/lib/api';
import {
  createProjectWithDefaultPage,
  listProjectsWithPageCount,
} from '@/services/builder/builderService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = await listProjectsWithPageCount();
    return ok({ projects });
  } catch (error) {
    if (error?.code === 'ECONNREFUSED') {
      return ok({
        projects: [],
        warning: 'Database is offline. Start MySQL on 127.0.0.1:3306 to load projects.',
      });
    }
    return fail('Failed to list projects', 500, error.message);
  }
}

export async function POST(request) {
  const body = await parseJsonBody(request);
  if (!body || typeof body !== 'object') {
    return fail('Invalid JSON body', 400);
  }

  try {
    const result = await createProjectWithDefaultPage({
      name: body.name,
      slug: body.slug,
      type: body.type,
    });
    return ok(result, 201);
  } catch (error) {
    if (error?.code === 'ECONNREFUSED') {
      return fail(
        'Database is offline. Start MySQL on 127.0.0.1:3306 and try again.',
        503,
        error.message
      );
    }
    if (error.message.startsWith('Invalid')) return fail(error.message, 400);
    if (error.message.includes('already exists')) return fail(error.message, 409);
    return fail('Failed to create project', 500, error.message);
  }
}

