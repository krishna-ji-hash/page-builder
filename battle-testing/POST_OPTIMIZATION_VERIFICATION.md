# Post-Optimization Verification — 2026-05-27

## Validation run

| Step | Result |
|------|--------|
| `npm test` | **185/185 pass** |
| `npm run build` | **Pass** |
| Prod server `:3001` | Restarted after build |
| `npm run battle-test:audit` | **17/17 OK** (SEO titles, meta, `live-site`) |
| `npm run battle-test:refresh-content` | Homes + landings + PDP templates republished |
| `npm run battle-test:lighthouse` | History written to `lighthouse-history.json` |

## Lighthouse before / after (mobile emulation, localhost:3001)

| Project | CLS (before → after) | LCP (before → after) | Target CLS &lt; 0.1 | Target LCP 2.5–3s |
|---------|----------------------|----------------------|---------------------|-------------------|
| **battle-real-estate** | 0.758 → **0.004** | 3.1s → **2.8s** | ✅ | ✅ |
| **battle-ecommerce** | 0.14 → **0.004** | 3.1s → **2.7s** | ✅ | ✅ |
| **battle-logistics** | 0.223 → **0.004** | 4.9s → **3.7s** | ✅ | ⚠️ improved, still &gt; 3s |

Audit scores (Lighthouse performance category audits): CLS **100** all three; LCP audit **82 / 85 / 59**.

SEO stability: `document-title` and `meta-description` audits **100** (unchanged). Battle audit: all live + preview titles match.

## Pages improved

- `battle-real-estate/home`, `austin-luxury-homes`
- `battle-ecommerce/home`, `summer-sale`
- `battle-logistics/home`, `cross-border-freight` (carousel section removed on home)
- `property-detail`, `product-detail`, `blog-post` templates (image dimensions)

## Code + content fixes (this phase)

### Platform (prior + verified)

- `lib/liveImagePerf.js` — intrinsic attrs, loading policy, figure stability
- `lib/liveRenderer.js` — LCP-first image, style cache, stable figures
- `components/seo/LcpImagePreload.jsx` — hero preload
- Scroll animation CLS guard in `styles/live/live-site.css`
- Carousel / feature-tabs image attrs

### Battle fixture content (`battle-testing/fixtures/battleProjects.mjs`)

| Change | Why |
|--------|-----|
| Unsplash URLs `w=1200&q=75` (was 1600/q=80) | Smaller transfer, faster LCP |
| `imageBlock(..., { imageHeightPx, aspectRatio })` on all heroes/CMS images | CLS reservation |
| Carousel slides `imageHeightPx: 420`, `imageWidthPx: 1200` | Hero carousel stability |
| Hero H1 animation `on-scroll` 0.45s (was `on-load` 0.7s) | Less initial layout motion |
| CTA hover scale `1.01` (was `1.03`) | Subtler hover |
| CMS repeater limits 4–6 (was 6–12) | Mobile density |
| Logistics home: removed carousel section | Competing LCP with hero image |

### Tooling

- `npm run battle-test:refresh-content` — republish fixture trees to MySQL
- `npm run battle-test:lighthouse` — append metrics to `lighthouse-history.json`
- Fixed `mkdir` for `.lighthouse-runs` output path

## Remaining bottlenecks

| Issue | Project | Mitigation (content-only) |
|-------|---------|---------------------------|
| LCP **3.7s** | logistics | Host hero on CDN/WebP; reduce truck image to `w=960`; optional remove hero image if text-only hero is acceptable |
| `uses-responsive-images` audit | all | Add `srcset` in media library when available (platform); use smaller Unsplash `w=` per slot |
| External JPEG (not WebP) | all | Upload WebP to project media and replace Unsplash URLs in builder |
| Logistics LCP audit score **59** | logistics | Same as LCP — hero is still largest paint on slow 4G emulation |
| PDP templates | property/product | Re-publish after editing in builder if not running `battle-test:refresh-content` |

## Parity

- Live and preview share `renderTree`, `live-site.css`, and `LcpImagePreload`
- No `renderTree` or layout-hack changes in this verification round
- `style_json` responsive overrides preserved (`desktop.size.aspectRatio` + `imageHeightPx` props)

## Commands

```bash
npm run build
$env:PORT=3001; npm run start
npm run battle-test:refresh-content   # after fixture edits
BATTLE_BASE_URL=http://localhost:3001 npm run battle-test:audit
npm run battle-test:lighthouse
```
