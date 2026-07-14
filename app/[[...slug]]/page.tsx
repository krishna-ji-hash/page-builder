import { notFound } from "next/navigation";
import PublicProjectPage from "../[projectSlug]/[pageSlug]/page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RESERVED_ROOT_SEGMENTS = new Set([
  "admin",
  "api",
  "blog",
  "blog-post",
  "d",
  "preview",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_PROJECT_SLUG = "d";
const DEFAULT_PAGE_SLUG = "home";

function normalizeSlugParts(slug: string[] | undefined): string[] {
  return (slug ?? []).map((part) => String(part).trim()).filter(Boolean);
}

export default async function FlatPublicPage(props: PageProps) {
  const { slug } = await props.params;
  const slugParts = normalizeSlugParts(slug);

  if (slugParts.length === 0) {
    return PublicProjectPage({
      ...props,
      searchParams: props.searchParams ?? Promise.resolve({}),
      params: Promise.resolve({
        projectSlug: DEFAULT_PROJECT_SLUG,
        pageSlug: DEFAULT_PAGE_SLUG,
      }),
    });
  }

  if (slugParts.length !== 1) {
    notFound();
  }

  const pageSlug = slugParts[0];

  if (!pageSlug || RESERVED_ROOT_SEGMENTS.has(pageSlug.toLowerCase())) {
    notFound();
  }

  return PublicProjectPage({
    ...props,
    searchParams: props.searchParams ?? Promise.resolve({}),
    params: Promise.resolve({
      projectSlug: DEFAULT_PROJECT_SLUG,
      pageSlug,
    }),
  });
}
