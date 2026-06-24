import DraftPreviewView from '@/components/live/DraftPreviewView';
import PublicPageRenderer from '@/components/PublicPageRenderer';
import { getDraftPageForBuilder } from '@/services/builder/builderService';
import { resolvePublishedRenderMode } from '@/lib/site/publishedContentFormat';

function toRendererProject(project) {
  if (!project) return null;
  return {
    id: Number(project.id),
    name: project.name,
    slug: project.slug,
    domain: project.domain ?? null,
    homeSlug: project.homeSlug,
  };
}

function toRendererPage(page) {
  if (!page) return null;
  return {
    id: Number(page.id),
    projectId: Number(page.projectId),
    title: page.title,
    slug: page.slug,
  };
}

/**
 * Admin draft preview bridge.
 * Primary: DraftPreviewView (full builder draft pipeline).
 * Fallback: PublicPageRenderer adapter for sections/blocks-only draftJson.
 */
export default async function DraftPreviewHostView({ pageId, draftJson, project, page }) {
  const pid = Number(pageId);
  const mode = resolvePublishedRenderMode(draftJson);

  if (mode === 'nodes') {
    try {
      const state = await getDraftPageForBuilder(pid);
      if (Array.isArray(state?.tree) && state.tree.length) {
        return <DraftPreviewView pageId={pid} />;
      }
    } catch {
      /* fall through to adapter */
    }
    return (
      <PublicPageRenderer
        content={draftJson}
        project={toRendererProject(project)}
        page={toRendererPage(page)}
        projectSlug={project?.slug}
        pageSlug={page?.slug}
      />
    );
  }

  if (mode === 'sections' || mode === 'blocks') {
    return (
      <PublicPageRenderer
        content={draftJson}
        project={toRendererProject(project)}
        page={toRendererPage(page)}
        projectSlug={project?.slug}
        pageSlug={page?.slug}
      />
    );
  }

  return <DraftPreviewView pageId={pid} />;
}
