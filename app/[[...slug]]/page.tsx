import type { Metadata } from 'next';
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

const DEFAULT_PROJECT_SLUG = 'd';
const DEFAULT_PAGE_SLUG = 'home';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeSlugParts(slug: string[] | undefined): string[] {
  return (slug ?? []).map((part) => String(part).trim()).filter(Boolean);
}

function getFlatSlugParts(slug: string[] | undefined): string[] | null {
  const slugParts = normalizeSlugParts(slug);

  if (slugParts.length > 0 && RESERVED_ROOT_SEGMENTS.has(slugParts[0].toLowerCase())) {
    return null;
  }

  // Root URL "/" should directly render "/d/home" content without redirect.
  if (slugParts.length === 0) {
    return [DEFAULT_PAGE_SLUG];
  }

  // Only single-level public pages are supported as flat URLs:
  // /home, /domestic-shipping, /bulk-shipping, /cross-border-shipping
  if (slugParts.length === 1) {
    return slugParts;
  }

  return null;
}

async function resolvePublishedForRoute(slug: string[] | undefined) {
  const flatSlugParts = getFlatSlugParts(slug);
  if (!flatSlugParts) return null;

  // Render host is not mapped as a custom domain — resolve project "d" by slug.
  return getPublishedPageForRequest({
    host: DEFAULT_PROJECT_SLUG,
    slugParts: flatSlugParts,
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolvePublishedForRoute(slug);
  if (!resolved) return {};

  const { project, page } = resolved;
  return buildHostPageMetadata(project, page);
}

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
