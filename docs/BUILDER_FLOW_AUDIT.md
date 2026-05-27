# Builder Flow Audit

**Date:** 2026-05-27  
**Scope:** End-to-end audit of builder editor, draft save, publish/live, globals, templates, advanced elements, database, APIs, and cache.  
**Code state:** Reflects current repo (draft/published separation work in progress on branch).

---

## High-level architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ADMIN (Builder)                                    │
│  /admin/builder                          → project list (BuilderProjectsManager)│
│  /admin/builder/{projectSlug}/{pageSlug} → BuilderShell (client)             │
│       │                                                                      │
│       ├─ GET /api/pages/{pageId}/builder → getBuilderState()                │
│       │      └─ pages + projects.config_json + draft page_versions          │
│       │         + builder_nodes (version_id = latest draft)                 │
│       │                                                                      │
│       ├─ Per-edit: PUT /api/nodes/{id} | POST nodes | reorder | delete      │
│       │      └─ mutates builder_nodes + refreshVersionSnapshot (draft only)   │
│       │                                                                      │
│       ├─ Save: PUT /api/nodes/update-bulk → syncDraftSnapshot()             │
│       │      └─ persistClientTreeOntoDraft + snapshot_json on DRAFT version   │
│       │      └─ does NOT touch pages.published_version_id                     │
│       │      └─ does NOT revalidate public routes                             │
│       │                                                                      │
│       └─ Publish: PUT update-bulk (sync) + POST /api/pages/{id}/publish     │
│              └─ publishDraftToSnapshot() → NEW page_versions (published)      │
│              └─ pages.published_version_id = new id                           │
│              └─ snapshot embeds freezeGlobalSectionsForPublish()              │
│              └─ revalidatePath + revalidateTag                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     DRAFT PREVIEW (not public live)                          │
│  /preview/{projectSlug}/{pageSlug} → DraftPreviewView                         │
│       └─ getDraftPageForBuilder() + projects.config_json.globalSections       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           PUBLIC / LIVE                                      │
│  /{projectSlug}/{pageSlug} → getPublishedPageForPublic()                    │
│       └─ pages.published_version_id → page_versions (status=published)      │
│       └─ snapshot_json.nodes + snapshot_json.globalSections (frozen)          │
│       └─ NOT builder_nodes, NOT draft, NOT mutable project globalSections     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Builder admin route flow

### URLs and entry components

| URL | File | Component |
|-----|------|-----------|
| `/admin/builder` | `app/admin/builder/page.jsx` | `BuilderProjectsManager` — list/create projects & pages |
| `/admin/builder/{pageId}` (legacy) | `app/admin/builder/[...slug]/page.jsx` | Redirects to slug URL via `getPageRoutingInfo` |
| `/admin/builder/{projectSlug}/{pageSlug}` | `app/admin/builder/[...slug]/page.jsx` | `BuilderShell` — full editor |

Slug resolution: `getPageIdByProjectAndPageSlug(projectSlug, pageSlug)` → numeric `pageId` passed to `BuilderShell`.

Helper: `lib/builder/adminBuilderRoutes.js` — `adminBuilderPagePath()`, `previewPagePath()`.

### Initial data load

```
Admin URL
  → BuilderShell (useEffect)
  → fetch GET /api/pages/{pageId}/builder
  → app/api/pages/[pageId]/builder/route.js
  → getBuilderState(pageId)  [services/builder/builderService.js]
  → DB:
       pages (+ published_version_id, seo_json)
       projects (slug, type, config_json)
       page_versions WHERE status='draft' (ensureDraftVersion if missing)
       builder_nodes WHERE version_id = draft.id
  → buildTree(nodes) → client `tree` state
```

`getBuilderState` uses `unstable_noStore()` so builder loads are never statically cached.

### Client state (BuilderShell)

| State | Purpose |
|-------|---------|
| `page` | Page meta + `projectConfig` from `projects.config_json` |
| `draftVersion` | Current draft `page_versions` row |
| `tree` | Canvas/layers tree (authoritative UI copy) |
| `selectedNodeId` | Selection for canvas + inspector |
| `projectPages` | Nav links in menus |
| `hasUnpublishedEdits` | Dirty flag (local edits not yet saved/published) |
| `undoStack` / `redoStack` | Local history snapshots |
| `previewCssByNodeId` | Inspector hover preview overrides |
| `inspectorTab` | `content` \| `style` \| `advanced` |

Tree normalization on load: `autoFixTree` → `reconcileStructuralParents` → `repairHeaderRowsInTree`.

### Section selection

- **Canvas:** `BuilderCanvas` — click sets `onSelectNode(node.id)` → `handleNodeSelect`.
- **Layers / Sections panel:** same `handleNodeSelect`.
- **Inspector tab:** containers/images open **Style** first; widgets open **Content** first.

`selectedNode` = `useMemo(() => findNodeInTree(tree, selectedNodeId))`.

`activeSectionRowId` = ancestor row for interior/section-scoped UI.

### Inspector updates

```
Inspector field change
  → BuilderInspector → onUpdateNode({ nodeId, payload })
  → handleNodeUpdate (optimistic setTree)
  → PUT /api/nodes/{id}
  → updateNode() in builderService
  → UPDATE builder_nodes
  → refreshVersionSnapshot(draft.version_id)
  → returns { tree }
  → setTree + setHasUnpublishedEdits(true)
```

Locked sections block edits unless unlocking via `meta.sectionLocked: false`.

---

## 2. Draft save flow

### UI

- **Button:** `BuilderTopbar` — label **"Save"** (not "Save Draft" in UI, but behavior is draft-only).
- **Handler:** `handleSave` in `BuilderShell.jsx`.

### Request chain

```
Edit → local tree state
  → Save click
  → siteThemePersistFlushRef (if theme pending)
  → autoFixTree + reconcileStructuralParents + validateTree
  → PUT /api/nodes/update-bulk  { pageId, nodes: fixedTree }
  → syncDraftSnapshot(pageId, clientRoots)
  → ensureDraftVersionTx
  → persistClientTreeOntoDraft (UPDATE builder_nodes parent/position/props)
  → refreshVersionSnapshot → UPDATE page_versions.snapshot_json (draft row only)
  → assertVersionMutableForDraftWrites (rejects if draft row is published)
```

### What is updated

| Artifact | Updated on Save? |
|----------|------------------|
| `builder_nodes` (draft `version_id`) | Yes (via `persistClientTreeOntoDraft` when client tree sent) |
| `page_versions.snapshot_json` (draft) | Yes (`refreshVersionSnapshot`) |
| `pages.published_version_id` | **No** |
| New `page_versions` row | **No** |
| `projects.config_json` | **No** (except separate theme/globals APIs) |
| Public route cache | **No** |

### Alternate save API (not used by main Save button)

- `PUT /api/pages/{pageId}/snapshot` → `saveDraftPage()` → updates **only** `page_versions.snapshot_json` on draft; does **not** sync `builder_nodes`.
- Risk if called directly: snapshot/nodes drift.

### Per-node saves (without full Save)

Creating, updating, deleting, reordering nodes via `/api/nodes/*` and `/api/pages/{id}/nodes` already call `refreshVersionSnapshot` on the draft version. The **Save** button bulk-syncs the full client tree to guard against drift.

---

## 3. Publish / Update Live flow

### UI

- **Button:** `BuilderTopbar` — **"Publish"** (status text mentions "publish to update the live site").
- **Handler:** `handlePublish`.

### Request chain

```
Publish click
  → siteThemePersistFlushRef
  → PUT /api/nodes/update-bulk (sync client tree to draft DB first)
  → POST /api/pages/{pageId}/publish
  → publishDraftToSnapshot() → publishPage()
  → ensureDraftVersionTx
  → refreshVersionSnapshot(draft.id) from builder_nodes
  → Read draft snapshot_json
  → Build publishSnapshot = {
        nodes: draftSnapshot.nodes,
        globalSections: freezeGlobalSectionsForPublish(page.projectConfig)
     }
  → INSERT page_versions (status='published', snapshot_json)
  → UPDATE old published rows → status='archived'
  → UPDATE pages SET published_version_id, status='published'
  → revalidateTag(`route:{projectSlug}:{pageSlug}`)
  → revalidatePath(`/{projectSlug}/{pageSlug}`)
  → revalidatePath(`/preview/...`) if applicable
  → reloadBuilder()
```

### Published storage

- **Table:** `page_versions` — new row every publish (`version_number` increments).
- **Pointer:** `pages.published_version_id` → that row.
- **Live content:** `snapshot_json` only (nodes tree + frozen `globalSections`). Publish does **not** clone `builder_nodes` into the published version row.
- **Draft:** unchanged draft row remains `status='draft'`; continues to be edited via `builder_nodes`.

### `freezeGlobalSectionsForPublish`

- Source: `projects.config_json.globalSections.header` / `.footer` (row nodes).
- Deep-clones into published `snapshot_json.globalSections`.
- Live public route reads **only** this frozen copy (see §5).

---

## 4. Public / live page fetching flow

### Primary route

`app/[projectSlug]/[pageSlug]/page.jsx`

- `dynamic = 'force-dynamic'`, `revalidate = 0`
- `getPublishedPageForPublic(projectSlug, pageSlug)`
- No `getDraftPageForBuilder`, no `builder_nodes` query

### Service query (`publishedPageService.js`)

```sql
SELECT pages.*, projects.config_json, page_versions.snapshot_json
FROM pages p
JOIN projects pr ON ...
INNER JOIN page_versions pv ON pv.id = p.published_version_id
WHERE pr.slug = ? AND p.slug = ?
  AND p.published_version_id IS NOT NULL
  AND pv.status = 'published'
```

- Parses snapshot via `parsePublishedSnapshot()`.
- `snapshot_json` → page body nodes.
- `publishedGlobalSections` → from snapshot `globalSections` (not project config).
- `projectConfig` used for **siteTheme**, SEO, page vars — **not** live header/footer.
- Expands linked global components + CMS bindings at read time.

### Empty / unpublished states

- No row / no `published_version_id` → "Page not published" message.
- Invalid/empty snapshot → "Re-publish" message.

### CMS template routes (also published-only)

| Route | Template page slug | Service |
|-------|-------------------|---------|
| `app/[projectSlug]/blog/[slug]/page.jsx` | `blog-post` | `getPublishedPageForPublic` |
| `app/[projectSlug]/product/[slug]/page.jsx` | product template slug | same |
| `app/[projectSlug]/property/[slug]/page.jsx` | property template | same |

### Render pipeline

```
snapshot nodes + publishedGlobalSections
  → buildRenderNodesWithGlobals()  [lib/globalSectionMerge.js]
  → PublishedLiveTree
  → renderTree() from lib/liveRenderer.js
```

---

## 5. Global header/footer flow

### Where edited

1. **Project-level globals (header/footer rows):**  
   - Canvas context menu: "Save as global header/footer" → `handleSaveGlobalSection`  
   - `POST /api/projects/{projectId}/global-sections`  
   - `saveGlobalSection()` in `projectAssetsService.js`  
   - Reads row from **draft** via `getBuilderState`, clones into `projects.config_json.globalSections`

2. **Global Components library:**  
   - `/admin/projects/{projectId}/global-components/{id}`  
   - Stored in `global_components.snapshot_json` (linked sections on pages)

### Draft preview vs live

| Surface | Page body | Header/footer source |
|---------|-----------|----------------------|
| Builder canvas | Draft `builder_nodes` | **Not shown** (notice in UI); edit via Globals tab |
| `/preview/...` | `getDraftPageForBuilder` | **Mutable** `projects.config_json.globalSections` |
| Public live | Published snapshot nodes | **Frozen** `snapshot_json.globalSections` |

### Publish freeze

`lib/globalSectionSnapshot.js` → `freezeGlobalSectionsForPublish(projectConfig)` copies header/footer row trees into published snapshot at publish time.

### Live read (confirmed)

`app/[projectSlug]/[pageSlug]/page.jsx` uses `page.publishedGlobalSections` only — **does not** read `projectConfig.globalSections` for render (automated test in `tests/draftPublishedSeparation.test.mjs`).

---

## 6. Section templates flow

### Registry

- **`lib/sectionTemplates.js`** — `SECTION_TEMPLATES` object: declarative trees (row → column → stack → blocks), no DB ids.
- **`lib/fullPageTemplates.js`** — full-page outlines.
- **`lib/templateSectionContent.js`** — specialized section builders (pricing, gallery, etc.).

### UI

- **`BuilderSidebar`** — template cards (Elements / Templates tabs).
- **`TemplateMarketplace.jsx`** — section + full-page marketplace UI.
- **`BuilderCanvas`** — section picker / starter templates on empty rows.

### Insert flow

```
Template card click
  → handleInsertSectionTemplate(key)
  → SECTION_TEMPLATES[key] roots
  → materializeSectionTemplate(roots, { bulkCreateNodesRequest, ... })
  → flattenTemplateToBulkNodes → POST /api/pages/{pageId}/nodes/bulk
  → createNodesBulk → createNodeTx per node → refreshVersionSnapshot
  → reloadBuilder() → select first root id
```

### Replace flows

| Action | Behavior |
|--------|----------|
| Full page template **Replace** | `handleApplyFullPageTemplate({ mode: 'replace' })` — deletes all root rows, bulk-inserts template at index 0 |
| Full page **Insert** | Appends at end (`insertIndex = countRootRows`) |
| Header template **Replace** | `handleInsertHeaderTemplate({ replaceExisting: true })` — confirms, deletes children of target row, inserts header columns/stacks |
| Section templates | Insert only (append or at `insertIndex`); no global "replace section" for arbitrary sections |

### Defaults applied

- Template rows include `props.meta.sectionTemplate`, `sectionLayout`, `sectionItemsHost`, responsive `style_json` fragments from `lib/responsiveLayoutDefaults.js`.
- `materializeSectionTemplate` validates via `autoFixTree` / `validateTree` in registry where used.

---

## 7. Layout direction flow

### Storage

- **Field:** `props.meta.sectionLayout` on section **row** nodes.
- **Helpers:** `lib/sectionLayout.js` — `normalizeSectionLayout`, `resolveLayoutFlexDirection`, `sectionLayoutToClassName`, gap px mapping.

### Inspector

- **`SectionLayoutControls.jsx`** — direction, columns, gap, align, mobile stack, reverse.
- Wired from **`BuilderInspector`** / **`StylePanel`** when row has `meta.sectionTemplate`.
- `patchSectionLayout` → `handleNodeUpdate` with `props.meta.sectionLayout`.

### CSS (builder + live shared)

| File | Role |
|------|------|
| `styles/shared/section-layout.css` | `.bld-section-layout`, horizontal/vertical/grid/reverse |
| `styles/live/live-site.css` | Imports section-layout + advanced-elements |
| `styles/shared/template-sections.css` | Template-specific polish |
| `components/builder/BuilderShell.jsx` | Imports `live-site.css` for canvas parity |

Builder canvas uses `liveRenderer` + same layout classes as live (`lib/builderLiveParity.js` documents shared pipeline).

---

## 8. Advanced elements flow

### Registry

- **`lib/advancedElementRegistry.js`** — `EXTRA_ADVANCED_ELEMENT_CARDS`, `ADVANCED_WEBSITE_WIDGETS` defaults.
- **`lib/advancedElementRegistryBatch2.js`** — additional widgets.
- **`lib/nodeCreatePayload.js`** — `payloadForWidgetCreate()` merges registry defaults on create.
- **`lib/builder/widgetRegistry.js`** — core widgets + project-type allowlist.

### Sidebar

- **`BuilderSidebar`** — `[...ELEMENT_CARDS, ...EXTRA_ADVANCED_ELEMENT_CARDS]` quick-add grid.

### Create

```
Card click / quick add
  → handleQuickAddNode({ targetNodeId, nodeType })
  → resolveQuickAddParentId (stack under column/row)
  → createNodeRequest → POST /api/pages/{pageId}/nodes
  → builderService.createNode → builder_nodes + refreshVersionSnapshot
```

### Inspector

- **`AdvancedElementControls.jsx`** (+ Batch2) in **`ContentPanel`** for advanced node types.
- Form state → `onUpdateNode` → same PUT `/api/nodes/{id}` path.

### Render

- **Builder:** `BuilderCanvas` → `renderNode` from `lib/liveRenderer.js`.
- **Live:** `PublishedLiveTree` → `renderTree` → `renderAdvancedElementShell` branches for icon, modal, video_embed, batch2 types, etc.
- **CSS:** `styles/shared/advanced-elements.css` (imported by `live-site.css`).

---

## 9. Database relationship audit

### `projects`

| Column | Notes |
|--------|-------|
| `id`, `slug`, `name`/`title`, `type` | Project identity |
| `config_json` | **Draft/mutable** project config: `siteTheme`, `globalSections`, `pageTemplates`, SEO defaults |

| | |
|-|-|
| **Draft or published?** | Mutable project-level config |
| **Writers** | Site theme API, global-sections API, templates API, seed |
| **Readers** | Builder (`getBuilderState`), draft preview, live (theme/SEO only) |

### `pages` (`tbl_builder_pages` equivalent)

| Column | Notes |
|--------|-------|
| `id`, `project_id`, `slug`, `title` | Page identity (unique per project) |
| `status` | `draft` \| `published` \| `archived` |
| `published_version_id` | FK → **live** `page_versions.id` |
| `seo_json` | Page SEO overrides |

| | |
|-|-|
| **Draft or published?** | Row is metadata; content versioned separately |
| **Writers** | Page CRUD APIs, `publishPage` updates pointer + status |
| **Readers** | Builder, published service, routing |

### `page_versions`

| Column | Notes |
|--------|-------|
| `page_id`, `version_number`, `status` | `draft` \| `published` \| `archived` |
| `snapshot_json` | Tree snapshot `{ nodes, globalSections? }` |

| | |
|-|-|
| **Draft row** | Latest `status='draft'` — edited via `builder_nodes` + snapshot refresh |
| **Published row** | Immutable snapshot created on each publish; old published → `archived` |
| **Writers** | `refreshVersionSnapshot`, `saveDraftPage`, `publishPage` (insert published) |
| **Readers** | `getBuilderState` (draft), `getPublishedPageForPublic` (published) |

### `builder_nodes`

| Column | Notes |
|--------|-------|
| `page_id`, `version_id`, `parent_node_id` | Tree structure |
| `node_type`, `display_name`, `position_index` | Node identity/order |
| `props_json`, `data_json`, `actions_json` | Content/style/actions |

| | |
|-|-|
| **Draft or published?** | Rows exist for **draft** `version_id` only in normal edit flow |
| **Writers** | All node CRUD + `syncDraftSnapshot` |
| **Readers** | `getBuilderState` — **not** public live |

### `global_components` / `global_component_revisions`

Reusable linked blocks (not the same as header/footer globals). Snapshots expanded at render for `meta.globalMode === 'linked'`.

### `reusable_blocks`

Saved section snippets per project (`projectAssetsService`).

### `cms_collections` / `cms_items`

CMS data bound into trees at render via `expandCms`.

---

## 10. API route map

| Route | Method | Purpose | Called from | Service | DB tables | Mode |
|-------|--------|---------|-------------|---------|-----------|------|
| `/api/pages/{pageId}/builder` | GET | Load editor state | `BuilderShell` | `getBuilderState` | pages, projects, page_versions (draft), builder_nodes | Draft |
| `/api/nodes/update-bulk` | PUT | Save/sync full tree | Save, Publish | `syncDraftSnapshot` | builder_nodes, page_versions (draft) | Draft |
| `/api/pages/{pageId}/snapshot` | PUT | Snapshot-only save | (alt; tests) | `saveDraftPage` | page_versions (draft) | Draft |
| `/api/pages/{pageId}/publish` | POST | Go live | Publish button | `publishDraftToSnapshot` | page_versions, pages | Publish |
| `/api/nodes/{id}` | PUT | Update one node | Inspector, canvas | `updateNode` | builder_nodes, page_versions | Draft |
| `/api/nodes/{id}` | DELETE | Delete subtree | Canvas | `deleteNode` | builder_nodes | Draft |
| `/api/nodes/{id}/duplicate` | POST | Duplicate | Canvas | `duplicateNode` | builder_nodes | Draft |
| `/api/nodes/reorder` | PUT | DnD reorder | Canvas | `reorderNode` | builder_nodes | Draft |
| `/api/pages/{pageId}/nodes` | POST | Create node | Quick add | `createNode` | builder_nodes | Draft |
| `/api/pages/{pageId}/nodes/bulk` | POST | Template insert | Templates | `createNodesBulk` | builder_nodes | Draft |
| `/api/pages/{pageId}` | PATCH | Page meta slug/title | Manager | `updatePageMeta` | pages (+ revalidate live) | Meta |
| `/api/projects/{id}/global-sections` | POST | Save header/footer to project | Canvas menu | `saveGlobalSection` | projects.config_json | Draft config |
| `/api/projects/{id}/site-theme` | PUT | Theme | Theme panel | project config | projects.config_json | Draft config |
| `/api/projects/{id}/global-components` | CRUD | Component library | Globals tab | `globalComponentsService` | global_components | Draft assets |
| `/api/projects/{id}/reusable-blocks` | CRUD | Saved sections | Sidebar | `projectAssetsService` | reusable_blocks | Draft assets |
| `/{projectSlug}/{pageSlug}` | GET | Public page | Browser | `getPublishedPageForPublic` | pages, page_versions (published) | Live |

---

## 11. Cache / revalidate flow

### Strategy

- **No `unstable_cache`** in builder/live paths audited.
- Public pages: `dynamic = 'force-dynamic'`, `revalidate = 0`.
- Builder APIs: `dynamic = 'force-dynamic'`.
- `getBuilderState` / `getPublishedPageForPublic`: `unstable_noStore()`.

### When cache updates

| Action | revalidatePath | revalidateTag |
|--------|----------------|---------------|
| Save (update-bulk) | **No** | **No** |
| Save (snapshot PUT) | **No** | **No** |
| Publish | `/{projectSlug}/{pageSlug}`, `/preview/...` | `route:{projectSlug}:{pageSlug}` |
| Page slug change (`PATCH /api/pages/{id}`) | Old + new paths, preview | route tags |

### Builder vs live CSS

Builder imports `styles/live/live-site.css` (which pulls `section-layout.css` + `advanced-elements.css`), so canvas mirrors live layout rules.

---

## 12. Findings (bugs / gaps)

No critical production bugs were fixed in this audit. Documented risks:

1. **Dual save paths:** Main UI uses `update-bulk` (nodes + snapshot). `PUT .../snapshot` only updates `snapshot_json` — potential drift if used by a client.
2. **Draft preview globals are mutable:** `/preview` reads `projects.config_json.globalSections`, not frozen snapshot — preview can differ from live until publish.
3. **Old publishes without `globalSections` in snapshot:** Live gets `emptyFrozenGlobalSections()` — no header/footer on live until re-publish after globals configured.
4. **Pages never published:** `published_version_id` NULL → public 404-style message; expected.
5. **`getPublishedPage` deprecated alias** still exported — grep callers before removal.
6. **Publish always syncs client tree first:** Accidental publish pushes current canvas to draft then live; intentional but worth UX guard (confirm dialog not present).
7. **Legacy draft/published id collision:** `ensureDraftVersionTx` clones new draft if draft id equals `published_version_id` (legacy data).
8. **CMS routes** depend on a published template page slug (e.g. `blog-post`) existing — misconfiguration → `notFound()`.

---

## 13. Current status — what is correct

- Public route uses **`getPublishedPageForPublic`** only; requires `published_version_id` + `status='published'`.
- Public route does **not** read `builder_nodes` or draft versions.
- Live header/footer from **`publishedGlobalSections`** (snapshot), not mutable project config.
- Publish creates a **new immutable** `page_versions` row; does not mutate draft row to published.
- Draft writes guarded by **`assertVersionMutableForDraftWrites`**.
- Save paths do **not** revalidate public URLs; publish does.
- Builder and live share **`liveRenderer`** + shared layout CSS.
- Automated separation tests in `tests/draftPublishedSeparation.test.mjs`, `tests/globalSectionSnapshot.test.mjs`, `tests/publishedSnapshot.test.mjs`.

---

## 14. Recommended next improvements

1. Rename Save button to **"Save draft"** and add publish confirmation when `hasUnpublishedEdits`.
2. Deprecate or align `PUT /api/pages/{id}/snapshot` with `update-bulk` (single save contract).
3. Optional: show frozen global header/footer on builder canvas (read-only) for WYSIWYG.
4. Backfill script: re-publish pages missing `snapshot_json.globalSections` after globals are set.
5. Use `revalidateTag` consistently on global-section save if preview should update without full publish.
6. Document CMS template page slugs (`blog-post`, etc.) in admin UI.
7. Remove `getPublishedPage` alias once all imports use `getPublishedPageForPublic`.

---

## Appendix: Key file index

| Area | Files |
|------|-------|
| Admin routes | `app/admin/builder/**` |
| Builder UI | `components/builder/BuilderShell.jsx`, `BuilderCanvas.jsx`, `BuilderInspector.jsx`, `BuilderTopbar.jsx`, `BuilderSidebar.jsx` |
| Live UI | `components/live/PublishedLiveTree.jsx`, `DraftPreviewView.jsx` |
| Services | `services/builder/builderService.js`, `services/site/publishedPageService.js`, `services/builder/projectAssetsService.js` |
| Snapshot | `lib/publishedSnapshot.js`, `lib/globalSectionSnapshot.js`, `lib/globalSectionMerge.js` |
| Render | `lib/liveRenderer.js`, `lib/builderLiveParity.js` |
| Templates | `lib/sectionTemplates.js`, `lib/fullPageTemplates.js` |
| Layout | `lib/sectionLayout.js`, `styles/shared/section-layout.css` |
| Advanced | `lib/advancedElementRegistry.js`, `components/runtime/AdvancedElement.jsx` |
| Migrations | `database/migrations/*.sql` |
| Tests | `tests/draftPublishedSeparation.test.mjs`, `scripts/verify-draft-live-separation.mjs` |
