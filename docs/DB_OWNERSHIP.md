# Database ownership

This project uses **one MySQL database** with **two access layers**. Before implementing any feature, declare which layer owns the data.

## Rule

> **New feature must declare DB owner before implementation.**

| If the feature… | Use |
|-----------------|-----|
| Touches builder tree, publish, or `builder_nodes` | **mysql2** (`getDbPool()`) |
| Is admin CRUD on projects/pages/menus/media already on Prisma | **Prisma** (`prisma.*`) |
| Needs a new table | SQL migration in `database/migrations/` + service layer |
| Needs Prisma model | Update `prisma/schema.prisma` **only if** admin CRUD will use Prisma |

**Do not** convert builder core to Prisma. **Do not** remove the mysql2 pool.

---

## mysql2 / raw SQL owns

Used via `getDbPool()` in `lib/db.js` and services under `services/builder/`, `services/seo/`, `services/forms/`, `lib/auth/`.

| Area | Why raw SQL |
|------|-------------|
| `builder_nodes` | Not in Prisma schema; high-frequency bulk writes |
| `page_versions` (legacy) | Publish snapshot pipeline |
| Draft save / bulk node sync | `PUT /api/nodes/update-bulk` |
| Publish snapshot | `publishDraftToSnapshot()` |
| SEO heavy audits | Large JSON scans, custom queries |
| Form submissions & analytics | High write volume |
| Auth sessions | `admin_sessions` |
| CMS collections/items | Legacy tables |
| Global components | Revision history |
| Reusable blocks, project apps | Builder-adjacent |
| Activity logs | Append-only audit |

---

## Prisma owns

Used via `prisma` in `lib/prisma.ts` and `services/admin/*` where already implemented.

| Area | Why Prisma |
|------|------------|
| Projects basic CRUD | Typed models, relations |
| Pages basic CRUD (admin API) | Workspace lists, draft JSON API |
| Users / roles (partial) | Admin user management |
| Media assets | Upload metadata |
| Menus / menu items | Relational CRUD |
| Domains / site settings | Multi-project routing config |
| Page revisions (`page_revisions`) | Admin version history UI |

---

## Ownership table

| Module | Tables | Access layer | Reason | Notes |
|--------|--------|--------------|--------|-------|
| Builder tree | `builder_nodes` | mysql2 | Bulk sync, not in Prisma | Never migrate to Prisma without explicit project decision |
| Draft save | `builder_nodes`, `pages.draft_json`, `page_versions` | mysql2 | Existing publish architecture | Use `withTransaction()` for multi-step writes |
| Publish | `pages.published_json`, `page_versions`, `builder_nodes` | mysql2 | Immutable snapshot flow | Do not change snapshot contract |
| Builder API | `pages`, `builder_nodes` | mysql2 | `builderService.js` | Preserves BuilderCanvas data path |
| Admin pages API | `pages` | Prisma | `adminPagesService.ts` | Draft JSON via admin routes |
| Admin projects | `projects`, `site_settings` | Prisma | Workspace CRUD | Active project in `site_settings` |
| Menus | `menus`, `menu_items` | Prisma | Relational | |
| Media | `media_assets` | Prisma | Upload metadata | Binary files on disk |
| Domains | `project_domains`, `projects.domain` | Prisma + mysql2 | Mixed services | Verify both paths if touching domains |
| Auth users | `admin_users` | mysql2 + Prisma | Sessions via SQL; users via admin API | |
| Auth sessions | `admin_sessions` | mysql2 | Cookie session store | |
| Forms | `form_submissions`, `form_analytics` | mysql2 | Public write endpoints | |
| SEO suite | `seo_redirects`, `pages.seo_json` | mysql2 | Audits & redirects | |
| CMS | `cms_collections`, `cms_items` | mysql2 | Builder-linked content | |
| Global components | `global_components`, `global_component_revisions` | mysql2 | Render expansion | |
| Activity log | `admin_activity_logs` | mysql2 | Append-only | |
| Migrations | `migrations` | SQL runner | `lib/runMigrations.mjs` | Tracked, idempotent |
| Version history (admin) | `page_revisions` | Prisma | Admin restore UI | Separate from legacy `page_versions` |

---

## Shared tables (read carefully)

Some tables are touched by **both** layers. Coordinate changes:

| Table | mysql2 | Prisma | Guidance |
|-------|--------|--------|----------|
| `pages` | Builder publish, SEO | Admin CRUD | Prefer service functions; avoid conflicting writes |
| `projects` | Domain resolver, publish | Admin CRUD | Config JSON: document schema changes |
| `page_versions` | Builder legacy versions | — | Publish flow only via `builderService` |
| `page_revisions` | — | Admin versions | Do not confuse with `page_versions` |

---

## Operations reference

| Task | Command |
|------|---------|
| Migration status | `npm run db:status` |
| Apply migrations | `npm run db:migrate` |
| Backup | `npm run db:backup` |
| Restore | `npm run db:restore -- backups/file.sql` |
| Health check | `GET /api/health` or `npm run health:check` |

See also: `docs/NEW_FEATURE_DB_CHECKLIST.md`, `docs/PRODUCTION_DB_CHECKLIST.md`.
