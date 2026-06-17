import { resolveAdminProjectRoute } from '@/lib/admin/adminProjectPage';
import AdminProjectSeo from '@/components/admin/workspace/AdminProjectSeo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project SEO',
  description: 'Project-level SEO defaults',
};

export default async function ProjectSeoPage({ params }) {
  const { projectId } = await resolveAdminProjectRoute(params, 'seo');
  return <AdminProjectSeo projectId={projectId} />;
}
