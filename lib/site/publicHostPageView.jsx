import PublicPageRenderer from '@/components/PublicPageRenderer';
import { getPublicProjectMenus } from '@/services/admin/adminMenusService';

function toRendererProject(project) {
  if (!project) return null;
  return {
    id: Number(project.id),
    name: project.name,
    slug: project.slug,
    domain: project.domain ?? null,
    homeSlug: project.homeSlug,
    status: project.status,
  };
}

function toRendererPage(page) {
  if (!page) return null;
  return {
    id: Number(page.id),
    projectId: Number(page.projectId),
    title: page.title,
    slug: page.slug,
    status: page.status,
    publishedJson: page.publishedJson,
    publishedAt: page.publishedAt,
    seoJson: page.seoJson,
  };
}

/**
 * Host-based public route bridge → PublicPageRenderer adapter.
 */
export default async function PublicHostPageView({
  projectSlug,
  pageSlug,
  searchParams = null,
  publishedJson = null,
  project = null,
  page = null,
}) {
  const projectMenus =
    project?.id != null
      ? await getPublicProjectMenus(BigInt(project.id), String(projectSlug || project.slug || ''))
      : null;

  return (
    <PublicPageRenderer
      content={publishedJson ?? page?.publishedJson}
      project={toRendererProject(project)}
      page={toRendererPage(page)}
      projectSlug={projectSlug}
      pageSlug={pageSlug}
      searchParams={searchParams}
      projectMenus={projectMenus}
    />
  );
}
