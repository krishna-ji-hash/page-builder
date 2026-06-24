import type { Metadata } from 'next';
import type { Project } from '@prisma/client';

type PageSeoSource = {
  title: string;
  slug: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImage?: string | null;
  robotsIndex?: boolean | null;
  robotsFollow?: boolean | null;
  canonicalUrl?: string | null;
};

type ProjectSeoSource = Pick<Project, 'name' | 'slug' | 'domain' | 'homeSlug'>;

function parseKeywords(value: string | null | undefined): string[] | undefined {
  const raw = String(value || '').trim();
  if (!raw) return undefined;
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

/**
 * Next.js metadata from Prisma page SEO columns (host-based public routes).
 */
export function buildHostPageMetadata(project: ProjectSeoSource, page: PageSeoSource): Metadata {
  const title = String(page.seoTitle || page.title || project.name || 'Page').trim();
  const description = String(page.seoDescription || '').trim() || undefined;
  const keywords = parseKeywords(page.seoKeywords);
  const ogImage = String(page.ogImage || '').trim() || undefined;
  const canonicalUrl = String(page.canonicalUrl || '').trim() || undefined;

  const metadata: Metadata = {
    title,
    description,
    keywords,
    robots: {
      index: page.robotsIndex !== false,
      follow: page.robotsFollow !== false,
    },
  };

  if (ogImage || title || description) {
    metadata.openGraph = {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    };
  }

  if (canonicalUrl) {
    metadata.alternates = { canonical: canonicalUrl };
  }

  return metadata;
}
