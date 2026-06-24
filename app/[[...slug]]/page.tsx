import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import PublicHostPageView from '@/lib/site/publicHostPageView';
import { buildHostPageMetadata } from '@/lib/site/pageSeoMetadata';
import { getPublishedPageForRequest } from '@/lib/site/domainResolver';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Paths owned by other App Router segments — never treat as public page slugs. */
const RESERVED_ROOT_SEGMENTS = new Set([
  'admin',
  'api',
  'd',
  'preview',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function readRequestHost(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get('x-forwarded-host');
  const host = headerStore.get('host');
  return String(forwarded || host || '').trim();
}

function normalizeSlugParts(slug: string[] | undefined): string[] {
  return (slug ?? []).map((part) => String(part).trim()).filter(Boolean);
}

async function resolvePublishedForRoute(slug: string[] | undefined) {
  const slugParts = normalizeSlugParts(slug);
  if (slugParts.length > 0 && RESERVED_ROOT_SEGMENTS.has(slugParts[0].toLowerCase())) {
    return null;
  }

  const host = await readRequestHost();
  if (!host) return null;

  return getPublishedPageForRequest({ host, slugParts });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolvePublishedForRoute(slug);
  if (!resolved) return {};

  const { project, page } = resolved;
  return buildHostPageMetadata(project, page);
}

/**
 * WordPress-style public site route.
 * Host → project, path segments → published page slug.
 * Primary renderer: PublicSitePageView. Sections/blocks fallback: PublicPageRenderer.
 */
export default async function PublicHostCatchAllPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolved = await resolvePublishedForRoute(slug);
  if (!resolved) notFound();

  const { project, page } = resolved;

  return (
    <PublicHostPageView
      projectSlug={project.slug}
      pageSlug={page.slug}
      searchParams={searchParams}
      publishedJson={page.publishedJson}
      project={project}
      page={page}
    />
  );
}
