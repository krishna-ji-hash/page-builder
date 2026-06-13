import { buildPublishChecklist } from '@/lib/audits/publishChecklist';
import { getBuilderState } from '@/services/builder/builderService';
import { listProjectDomains } from '@/services/platform/domainService';

export async function getPublishChecklistForPage(pageId) {
  const pid = Number(pageId);
  if (!Number.isInteger(pid) || pid <= 0) return null;

  const state = await getBuilderState(pid);
  if (!state?.page) return null;

  let domains = [];
  try {
    domains = await listProjectDomains(state.page.projectId);
  } catch {
    domains = [];
  }

  const checklist = buildPublishChecklist({
    tree: state.tree || [],
    pageSeo: state.page.seo,
    projectConfig: state.page.projectConfig,
    domains,
  });

  return {
    pageId: pid,
    pageTitle: state.page.title,
    projectSlug: state.page.projectSlug,
    pageSlug: state.page.slug,
    checklist,
  };
}
