import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminProjectOverview from '@/components/admin/workspace/AdminProjectOverview';

function workspaceProjectProps(ctx) {
  return {
    projectId: ctx.projectId,
    initialProject: ctx.project,
    activeProjectId: ctx.activeProjectId,
    activeProjectSlug: ctx.activeProjectSlug,
  };
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project overview',
};

export default async function ProjectOverviewPage({ params }) {
  const ctx = await resolveAdminProjectRoute(params, 'overview');
  return <AdminProjectOverview {...workspaceProjectProps(ctx)} />;
}
