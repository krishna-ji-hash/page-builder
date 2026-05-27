import { notFound, redirect } from 'next/navigation';
import DraftPreviewView from '@/components/live/DraftPreviewView';
import { previewPagePath } from '@/lib/builder/adminBuilderRoutes';
import { buildDraftPreviewMetadata } from '@/lib/draftPreviewMetadata';
import { isPublicSlug, resolveMaybeAsyncParams } from '@/lib/routeParams';
import { getPageIdByProjectAndPageSlug, getPageRoutingInfo } from '@/services/builder/builderService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function previewSegments(resolved) {
  const segments = Array.isArray(resolved.slug) ? resolved.slug : resolved.slug ? [resolved.slug] : [];
  return segments;
}

export async function generateMetadata({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const segments = previewSegments(resolved);
  if (segments.length !== 2) return {};
  const [projectSlug, pageSlug] = segments;
  return buildDraftPreviewMetadata(projectSlug, pageSlug);
}

export default async function DraftPreviewPage({ params }) {
  const resolved = await resolveMaybeAsyncParams(params);
  const segments = Array.isArray(resolved.slug)
    ? resolved.slug
    : resolved.slug
      ? [resolved.slug]
      : [];

  if (segments.length === 1) {
    const pageId = Number(segments[0]);
    if (!Number.isInteger(pageId) || pageId <= 0) {
      notFound();
    }
    const route = await getPageRoutingInfo(pageId);
    if (!route?.projectSlug || !route?.pageSlug) {
      notFound();
    }
    redirect(previewPagePath(route.projectSlug, route.pageSlug));
  }

  if (segments.length !== 2) {
    notFound();
  }

  const [projectSlug, pageSlug] = segments;
  if (!isPublicSlug(projectSlug) || !isPublicSlug(pageSlug)) {
    notFound();
  }

  const pageId = await getPageIdByProjectAndPageSlug(projectSlug, pageSlug);
  if (!pageId) {
    notFound();
  }

  return <DraftPreviewView pageId={pageId} />;
}
