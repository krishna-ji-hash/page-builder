'use client';

import SeoControlCenter from '@/components/admin/seo/SeoControlCenter';

/** Unified SEO Control Center — primary SEO dashboard for project workspace. */
export default function AdminProjectSeo({ projectId }) {
  return <SeoControlCenter projectId={projectId} />;
}
