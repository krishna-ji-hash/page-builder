# Production Performance Optimization — Round 1

## Strategy

Real CWV improvements without changing `renderTree` architecture, `style_json` model, or layout hacks:

1. **Reserve image space** before decode (`aspect-ratio`, `minHeight`, intrinsic `width`/`height` hints).
2. **Prioritize LCP** — first page image `fetchPriority="high"` + `<link rel="preload">` from published tree.
3. **Lazy below-the-fold** — subsequent images and duplicate carousel ticker rows.
4. **Transform-only motion** — scroll interactions use `translate3d` + `opacity`; reduced-motion disables glow/shimmer.
5. **Per-render style cache** — `normalizeResponsiveStyle` results memoized by `nodeId:device` during `renderTree`.
6. **Lighthouse history** — `npm run battle-test:lighthouse` appends CLS/LCP audit scores per battle project.

## Changed files

| Area | Files |
|------|--------|
| Image CLS/LCP | `lib/liveImagePerf.js`, `lib/liveImageFluid.js` (consumer), `lib/liveRenderer.js`, `lib/findLcpImageUrl.js`, `components/seo/LcpImagePreload.jsx` |
| Carousel / tabs | `lib/liveCarouselImageAttrs.js`, `components/runtime/Carousel.jsx`, `components/runtime/FeatureTabs.jsx` |
| CSS stability | `styles/live/live-site.css` |
| Runtime | `lib/publicSitePage.jsx`, `components/live/DraftPreviewView.jsx` |
| Audits | `lib/audits/auditEngine.js` |
| Lighthouse tooling | `lib/lighthouseHistory.js`, `scripts/lighthouse-history.mjs`, `package.json` |
| Tests | `tests/liveImagePerf.test.mjs` |

## CLS fixes

- Figures get `live-image-stable`, `minHeight` from `imageHeightPx`, `aspectRatio` from `style_json.size`.
- Tree audit warns when images lack height **and** aspect ratio.
- Scroll-triggered interactions: initial `translate3d` + `opacity` (no height animation).
- Carousel/ticker: duplicate row images forced `loading="lazy"`.

## LCP fixes

- First document-order image: `loading="eager"`, `fetchPriority="high"`.
- `LcpImagePreload` on published + draft preview routes.
- Feature tabs panel image: eager + height attribute.

## Runtime optimizations

- `_renderStyleCache` Map during `renderTree` (avoids repeated normalization for same node/device).

## Validation

```bash
npm test          # 185 tests
npm run build
BATTLE_BASE_URL=http://localhost:3001 npm run battle-test:audit
npm run battle-test:lighthouse   # requires running prod server + Chrome
```

## Targets (re-measure after deploy)

| Metric | Target | Notes |
|--------|--------|--------|
| CLS | &lt; 0.1 | Real-estate seed had ~0.76 — verify after image height + animation fixes |
| LCP | &lt; 2.5–3s | Localhost varies; compress hero assets in media library |
| Mobile | Stable tap targets | Existing `live-site` mobile rules preserved |

History file: `battle-testing/lighthouse-history.json` (created on first lighthouse run).
