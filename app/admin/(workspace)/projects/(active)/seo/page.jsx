import ActiveProjectSectionPage, { activeProjectSectionMetadata } from '@/lib/admin/activeProjectSectionPage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = activeProjectSectionMetadata('seo');

export default async function Page() {
  return ActiveProjectSectionPage({ section: 'seo' });
}
