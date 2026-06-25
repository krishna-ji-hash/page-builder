import AdminProjectOverview from '@/components/admin/workspace/AdminProjectOverview';
import DProjectPages from '@/components/admin/d/DProjectPages';
import AdminProjectCms from '@/components/admin/workspace/AdminProjectCms';
import AdminProjectBlog from '@/components/admin/workspace/AdminProjectBlog';
import AdminProjectForms from '@/components/admin/workspace/AdminProjectForms';
import AdminProjectSeo from '@/components/admin/workspace/AdminProjectSeo';
import AdminProjectDomains from '@/components/admin/workspace/AdminProjectDomains';
import AdminProjectPublishing from '@/components/admin/workspace/AdminProjectPublishing';
import AdminProjectMedia from '@/components/admin/workspace/AdminProjectMedia';
import DProjectMenus from '@/components/admin/d/DProjectMenus';
import AdminProjectTheme from '@/components/admin/workspace/AdminProjectTheme';
import AdminProjectSettings from '@/components/admin/workspace/AdminProjectSettings';
import AppManagerShell from '@/components/builder/apps/AppManagerShell';

/** Workspace section id → page component (receives `projectId`). */
export const ADMIN_SECTION_COMPONENTS = Object.freeze({
  overview: AdminProjectOverview,
  pages: DProjectPages,
  cms: AdminProjectCms,
  blog: AdminProjectBlog,
  forms: AdminProjectForms,
  seo: AdminProjectSeo,
  domains: AdminProjectDomains,
  publishing: AdminProjectPublishing,
  media: AdminProjectMedia,
  menus: DProjectMenus,
  theme: AdminProjectTheme,
  settings: AdminProjectSettings,
  apps: AppManagerShell,
});
