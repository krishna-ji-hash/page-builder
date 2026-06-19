import { NextResponse } from 'next/server';
import { fail } from '@/lib/api';
import { guardAdminApi } from '@/lib/auth/guardAdminApi';
import { resolveMaybeAsyncParams } from '@/lib/routeParams';
import { buildSeoReportCsv, buildSeoReportHtml, buildSeoReportJson } from '@/lib/seo/seoReportExport';
import { runEnterpriseSeoSuite } from '@/services/seo/enterpriseSeoService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const projectId = Number(resolved.projectId);
  const auth = await guardAdminApi(request, { projectId, action: 'read' });
  if (auth.error) return auth.error;
  if (!Number.isInteger(projectId) || projectId <= 0) return fail('Invalid projectId', 400);

  const format = request.nextUrl.searchParams.get('format') || 'csv';
  if (!['csv', 'json', 'html', 'pdf'].includes(format)) {
    return fail('Invalid format. Use csv, json, html, or pdf', 400);
  }

  try {
    const report = await runEnterpriseSeoSuite(projectId);
    const slug = report.projectSlug || `project-${projectId}`;
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      const body = buildSeoReportJson(report);
      return new NextResponse(body, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="seo-audit-${slug}-${stamp}.json"`,
        },
      });
    }

    if (format === 'html' || format === 'pdf') {
      const body = buildSeoReportHtml(report, {
        projectName: report.projectName,
        generatedAt: new Date().toISOString(),
      });
      return new NextResponse(body, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition':
            format === 'pdf'
              ? `inline; filename="seo-audit-${slug}-${stamp}.html"`
              : `attachment; filename="seo-audit-${slug}-${stamp}.html"`,
        },
      });
    }

    const body = buildSeoReportCsv(report);
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="seo-audit-${slug}-${stamp}.csv"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fail('Failed to export SEO report', 500, message);
  }
}
