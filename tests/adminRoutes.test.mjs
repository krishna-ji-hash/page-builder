import assert from 'node:assert/strict';
import {
  ADMIN_DASHBOARD_PATH,
  adminProjectSectionPath,
  breadcrumbLabels,
  parseAdminPathname,
} from '../lib/admin/adminRoutes.js';

assert.equal(parseAdminPathname('/admin/dashboard').kind, 'dashboard');
assert.equal(parseAdminPathname('/admin/projects/12/cms').projectId, 12);
assert.equal(parseAdminPathname('/admin/projects/12/cms').section, 'cms');
assert.equal(adminProjectSectionPath(5, 'seo'), '/admin/projects/5/seo');

const crumbs = breadcrumbLabels(parseAdminPathname('/admin/projects/3/domains'));
assert.ok(crumbs.some((c) => c.label === 'Domains'));
assert.equal(parseAdminPathname('/admin/login').kind, 'login');
assert.equal(parseAdminPathname('/admin/builder/dispatch/home').kind, 'builder');

console.log('adminRoutes.test.mjs — all assertions passed');
