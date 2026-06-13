import { NextResponse } from 'next/server';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getEnabledAppIds, listProjectApps, setProjectAppEnabled } from '@/services/builder/projectAppsService';
import { loadAppsForProject } from '@/lib/registry/appLoader';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'read' });
    if (auth.error) return auth.error;
    const projectId = Number(resolved.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
    }
    const apps = await listProjectApps(projectId);
    const enabledAppIds = apps.filter((a) => a.enabled).map((a) => a.id);
    return NextResponse.json({ ok: true, apps, enabledAppIds });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to list apps' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const resolved = await resolveMaybeAsyncParams(params);
    const auth = await guardAdminApi(request, { projectId: Number(resolved.projectId), action: 'write' });
    if (auth.error) return auth.error;
    const projectId = Number(resolved.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid projectId' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const appId = String(body?.appId || '');
    const enabled = Boolean(body?.enabled);
    if (!appId) return NextResponse.json({ ok: false, error: 'Missing appId' }, { status: 400 });
    await setProjectAppEnabled(projectId, appId, enabled);

    // Warm load in this server context (best-effort). UI also loads on client.
    const enabledIds = await getEnabledAppIds(projectId);
    await loadAppsForProject({ projectId, enabledAppIds: enabledIds });

    return NextResponse.json({ ok: true, enabledAppIds: enabledIds });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to update app state' }, { status: 500 });
  }
}

