import assert from 'node:assert/strict';
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_PROJECTS_PATH,
  adminActivePathOpts,
  adminFlatProjectSectionPath,
  adminProjectSectionPath,
  adminProjectPagesAddPath,
  breadcrumbLabels,
  parseAdminPathname,
} from '../lib/admin/adminRoutes.js';

assert.equal(parseAdminPathname('/admin/dashboard').kind, 'dashboard');
assert.equal(parseAdminPathname('/admin/projects/dispatch/cms').projectSlug, 'dispatch');
assert.equal(parseAdminPathname('/admin/projects/dispatch/cms').section, 'cms');
assert.equal(parseAdminPathname('/admin/projects/12/cms').projectId, 12);
assert.equal(parseAdminPathname('/admin/projects/12/cms').projectSlug, null);
assert.equal(parseAdminPathname('/admin/projects/pages').kind, 'active-project');
assert.equal(parseAdminPathname('/admin/projects/pages').section, 'pages');
assert.equal(adminFlatProjectSectionPath('pages'), '/admin/projects/pages');
assert.equal(adminProjectSectionPath('dispatch', 'seo'), '/admin/projects/dispatch/seo');
assert.equal(adminProjectSectionPath({ slug: 'my-site' }, 'pages'), '/admin/projects/my-site/pages');
assert.equal(
  adminProjectSectionPath({ id: 14, slug: 'd' }, 'pages', adminActivePathOpts({ id: 14, slug: 'd' })),
  '/admin/projects/pages'
);
assert.equal(adminProjectPagesAddPath('dispatch'), '/admin/projects/dispatch/pages#add-page');
assert.equal(
  adminProjectPagesAddPath({ id: 14, slug: 'd' }, { id: 14, slug: 'd' }),
  '/admin/projects/pages#add-page'
);
assert.equal(adminProjectSectionPath(5, 'seo'), ADMIN_PROJECTS_PATH);

const projects = [{ id: 3, name: 'Dispatch', slug: 'd' }];
const crumbs = breadcrumbLabels(parseAdminPathname('/admin/projects/d/domains'), projects);
assert.ok(crumbs.some((c) => c.label === 'Dispatch'));
assert.ok(crumbs.some((c) => c.label === 'Domains'));
assert.equal(parseAdminPathname('/admin/login').kind, 'login');
assert.equal(parseAdminPathname('/admin/builder/dispatch/home').kind, 'builder');

console.log('adminRoutes.test.mjs — all assertions passed');
