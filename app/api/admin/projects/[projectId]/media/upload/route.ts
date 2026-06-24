import { NextResponse } from 'next/server';
import { mapAdminApiError } from '@/lib/admin/mapAdminApiError';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { uploadAdminProjectMedia } from '@/services/admin/adminMediaService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const auth = await guardAdminApi(request, { projectId, action: 'write' });
  if (auth.error) return auth.error;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  try {
    const result = await uploadAdminProjectMedia(projectId, form);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return mapAdminApiError(error);
  }
}
