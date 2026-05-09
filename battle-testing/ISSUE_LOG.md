# Battle Testing — Issue Log

Structured findings from production-style stress projects. Update this file as you run QA rounds.

---

## Methodology

1. **Seed projects**: `npm run battle-test:seed` (requires migrated MySQL + `.env`).
2. **Open builder**: `/admin/builder/[pageId]` for each battle project home page.
3. **Live preview**: `/[projectSlug]/home` (and dynamic routes below).
4. **Manual Lighthouse**: Chrome DevTools → Lighthouse (mobile + desktop), or `npx lighthouse http://localhost:3000/[slug]/home --view`.

### Dynamic routes to verify

| Project slug           | Route pattern                                      |
|------------------------|----------------------------------------------------|
| `battle-real-estate`   | `/battle-real-estate/property/oak-lane`            |
| `battle-saas`          | `/battle-saas/blog/launch-checklist`               |
| `battle-ecommerce`     | `/battle-ecommerce/product/desk-lamp`               |
| `battle-logistics`     | CMS listing on home only                           |

### SEO / infra smoke

- `/[projectSlug]/sitemap.xml`
- `/[projectSlug]/robots.txt`
- Page SEO modal + Project SEO (canonical domain in seeded `config_json.seo.canonicalDomain`)

---

## Round 0 — Setup & stabilization

### Issues found (historical)

| Area | Severity | Description |
|------|----------|-------------|
| CMS bindings | High | Wrong token paths (`{{title}}` vs `{{item.title}}`) — **fixed in fixtures + docs**. |
| SEO / CMS pages | Medium | Raw SEO fields + JSON-LD not CMS-bound — **fixed in `seoEngine`**. |
| Menu / buttons on live site | Medium | `to: '/'`, `/contact` pointed at host root, not `/${projectSlug}/…` — **fixed via `projectPathPrefix` in `liveRenderer`**. |
| Ecommerce PDP | Low | No `/product/[slug]` route — **fixed**: new route + sitemap + battle `product-detail` template. |

### Fixes applied (code)

- `battle-testing/fixtures/battleProjects.mjs` — `{{item.*}}` bindings; ecommerce **product-detail** page + “View product” → `/product/{{sys.slug}}`.
- `lib/seo/seoEngine.js` — bindings on fallback title/description/OG; JSON-LD `applyBindingsToAny`; **OG image + canonical URL** string binding when placeholders present.
- `lib/cms/cmsBindings.js` — export `applyBindingsToAny`.
- `lib/projectPathPrefix.js` — prefix relative menu `to`/`href` and button `href` with `projectSlug` on published/preview renders.
- `lib/liveRenderer.js` — uses prefix helpers when `options.projectSlug` is set.
- `app/[projectSlug]/product/[slug]/page.jsx` — CMS PDP (collection `products`, template slug `product-detail`).
- `app/[projectSlug]/sitemap.xml/route.js` — includes published **`products`** → `/product/[slug]`.
- Published pages + preview + blog/property routes pass **`projectSlug`** into `renderTree`.

### Re-seed ecommerce battle project

If `battle-ecommerce` was seeded **before** `product-detail` existed, either reset battle rows (see below) and run `npm run battle-test:seed`, or add the page manually in the builder.

### Performance / SEO scores

_Not run in CI — record here after local Lighthouse._

| Project | Perf (mobile) | SEO | A11y | Notes |
|---------|---------------|-----|------|-------|
| battle-real-estate | — | — | — | |
| battle-ecommerce | — | — | — | |
| battle-logistics | — | — | — | |
| battle-saas | — | — | — | |

---

## battle-real-estate

### Issues found

_Add manual QA notes._

### Fixes applied

- Live menu/button links scoped to project slug.

---

## battle-ecommerce

### Issues found

### Fixes applied

- `/product/[slug]` route, sitemap entries, seeded PDP template (after re-seed).

---

## battle-logistics

### Issues found

### Fixes applied

---

## battle-saas

### Issues found

### Fixes applied

---

## Template weaknesses (cross-cutting)

| Topic | Notes |
|-------|-------|
| Generic CMS slug routes | **Property**, **blog**, and **product** (products collection) covered. Other collection types remain listing-only until a route convention exists. |

---

## Audit false positives

_Log IDs / labels from Audit modal that were verified safe._

---

## Accessibility

_Tap targets, contrast, aria-labels, carousel controls — record findings._

---

## Reset battle data

To re-seed from scratch (destructive):

```sql
DELETE FROM pages WHERE project_id IN (SELECT id FROM projects WHERE slug LIKE 'battle-%');
DELETE FROM cms_collections WHERE project_id IN (SELECT id FROM projects WHERE slug LIKE 'battle-%');
DELETE FROM project_apps WHERE project_id IN (SELECT id FROM projects WHERE slug LIKE 'battle-%');
DELETE FROM projects WHERE slug LIKE 'battle-%';
```

Then run `npm run battle-test:seed` again.
