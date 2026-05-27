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

### Round 1 — automated smoke (`npm run battle-test:audit`)

Run against a **fresh production server** (`npm run build` → `PORT=3001 npm run start`). Dev on `:3000` with a stale `.next` cache returns 500 (`vendor-chunks` missing) — use `npm run dev:clean` or rebuild.

| Check | Result |
|-------|--------|
| Live home + SEO landings + CMS PDP | **200**, title + meta description + `live-site` |
| Draft preview `/preview/.../home` | **200**; titles match live via `lib/draftPreviewMetadata.js` + preview `generateMetadata` |
| `sitemap.xml` / `robots.txt` | **200** (non-HTML; audit skips `<title>` requirement) |
| CMS templates | `{{item.title}}` in PDP `<title>` confirms bindings |

### Performance / SEO scores (Lighthouse)

Headless run on production server (`PORT=3001`, `npm run build && npm run start`). Desktop defaults; re-run mobile in DevTools for field data.

| Project | Perf | SEO | A11y | Notes |
|---------|------|-----|------|-------|
| battle-real-estate | see `battle-testing/lighthouse-battle-real-estate-home.json` | same | — | Hero fade + hover CTAs in seed |
| battle-ecommerce | see `battle-testing/lighthouse-ecommerce-home.json` | same | 90+ typical | `/product/[slug]` + summer-sale landing |
| battle-logistics | see `battle-testing/lighthouse-battle-logistics-home.json` | same | — | cross-border-freight landing |

### Round 1 — fixes (this session)

| Issue | Fix |
|-------|-----|
| Preview `<title>` = root layout “Builder Custom” | `buildDraftPreviewMetadata` in `lib/draftPreviewMetadata.js`; preview route `generateMetadata` |
| `draftPublishedSeparation` test fail after metadata in `publicSitePage` | Draft metadata moved out of published live module |
| Stale prod server after build | Restart `PORT=3001` before audit |
| Dev `:3000` 500 (`vendor-chunks`) | `npm run dev:clean` or use prod on 3001 |
| CMS PDP `<title>` showed raw `{{item.title}}` | `resolveSeoMetadata` title path in `lib/seo/seoEngine.js` |

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
