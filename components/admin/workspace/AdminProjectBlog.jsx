'use client';

import AdminBlogPostsList from '@/components/admin/blog/AdminBlogPostsList';

/** @deprecated Use AdminBlogPostsList — kept as stable import for registry. */
export default function AdminProjectBlog({ projectId, initialProject }) {
  return (
    <AdminBlogPostsList
      projectId={projectId}
      projectSlug={initialProject?.slug || ''}
    />
  );
}
