import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import DProjectPages from '@/components/admin/d/DProjectPages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project pages',
};

export default async function ProjectPagesPage({ params }) {
  const ctx = await resolveAdminProjectRoute(params, 'pages');
  return (
    <DProjectPages
      projectId={ctx.projectId}
      initialProject={ctx.project}
      activeProjectId={ctx.activeProjectId}
      activeProjectSlug={ctx.activeProjectSlug}
    />
  );
}
