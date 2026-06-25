/**
 * Layout preservation regression — ensures core builder/admin/public layout was not removed.
 *
 * No browser automation; filesystem + module smoke tests only.
 *
 * Run after a production build:
 *   npm run build
 *   npm run verify:layout
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function abs(rel) {
  return path.join(ROOT, rel.replace(/\//g, path.sep));
}

function fileExists(rel) {
  return fs.existsSync(abs(rel));
}

function readText(rel) {
  return fs.readFileSync(abs(rel), 'utf8');
}

function checkFilesExist(groupLabel, files) {
  for (const rel of files) {
    if (fileExists(rel)) pass(`${groupLabel}: ${rel}`);
    else fail(`${groupLabel}: ${rel}`, 'missing');
  }
}

function collectBuildRoutePages(manifest) {
  const pages = new Set();
  for (const route of manifest.staticRoutes || []) {
    if (route?.page) pages.add(route.page);
  }
  for (const route of manifest.dynamicRoutes || []) {
    if (route?.page) pages.add(route.page);
  }
  return pages;
}

console.log('\nLayout preservation verification\n');

// ── 0. Build artifact (run `npm run build` first) ───────────────────────────
if (!fileExists('.next/BUILD_ID')) {
  fail('Production build', '.next/BUILD_ID missing — run `npm run build` first');
} else {
  pass('Production build', fs.readFileSync(abs('.next/BUILD_ID'), 'utf8').trim());
}

// ── 1. Important existing files ─────────────────────────────────────────────
const BUILDER_COMPONENTS = [
  'components/builder/BuilderShell.jsx',
  'components/builder/BuilderCanvas.jsx',
  'components/builder/BuilderSidebar.jsx',
  'components/builder/BuilderInspector.jsx',
  'components/builder/BuilderTopbar.jsx',
  'components/builder/media/MediaLibraryModal.jsx',
  'components/live/PublishedLiveTree.jsx',
  'lib/liveRenderer.js',
  'lib/builderLiveParity.js',
];

const BUILDER_CSS = [
  'styles/builder/builder-shell.css',
  'styles/builder/builder-canvas.css',
  'styles/builder/builder-sidebar.css',
  'styles/builder/builder-inspector.css',
  'styles/builder/builder-topbar.css',
  'styles/builder/builder-live-mirror.css',
  'styles/shared/live-semantic-tokens.css',
  'styles/shared/section-template-parity.css',
];

const ADMIN_LAYOUT = [
  'app/admin/(workspace)/layout.jsx',
  'app/admin/page.jsx',
  'app/admin/login/page.jsx',
  'app/d/layout.jsx',
  'app/d/page.jsx',
  'components/admin/AdminShell.jsx',
  'components/admin/d/DShell.jsx',
  'styles/admin/shell.css',
  'styles/admin/d-shell.css',
  'styles/admin/platform.css',
];

const CORE_PUBLIC = [
  'components/PublicPageRenderer.tsx',
  'lib/site/domainResolver.ts',
  'lib/site/publicHostPageView.jsx',
  'lib/publicSitePage.jsx',
  'components/public/PublicPageLiveTreeView.jsx',
  'components/public/PublicPageSectionsFallback.tsx',
  'components/public/PublicPageBlocksFallback.tsx',
  'lib/site/publishedContentFormat.js',
  'middleware.ts',
];

checkFilesExist('builder component', BUILDER_COMPONENTS);
checkFilesExist('builder CSS', BUILDER_CSS);
checkFilesExist('admin layout', ADMIN_LAYOUT);
checkFilesExist('public renderer', CORE_PUBLIC);

// ── 2. Public renderer modes (nodes / sections / blocks) ────────────────────
try {
  const fmt = await import('../lib/site/publishedContentFormat.js');

  const nodesMode = fmt.resolvePublishedRenderMode({ nodes: [{ id: 'n1', nodeType: 'row' }] });
  if (nodesMode === 'nodes') pass('Renderer mode: nodes');
  else fail('Renderer mode: nodes', `got ${nodesMode}`);

  const sectionsMode = fmt.resolvePublishedRenderMode({
    sections: [{ id: 's1', type: 'hero', props: {} }],
  });
  if (sectionsMode === 'sections') pass('Renderer mode: sections');
  else fail('Renderer mode: sections', `got ${sectionsMode}`);

  const blocksMode = fmt.resolvePublishedRenderMode({
    blocks: [{ id: 'b1', type: 'text', props: {} }],
  });
  if (blocksMode === 'blocks') pass('Renderer mode: blocks');
  else fail('Renderer mode: blocks', `got ${blocksMode}`);

  const extracted = fmt.extractPublishedNodes({ nodes: [{ id: 'x' }] });
  if (Array.isArray(extracted) && extracted.length === 1) pass('extractPublishedNodes');
  else fail('extractPublishedNodes', 'expected one node');

  const sections = fmt.normalizePublishedSections({ sections: [{ id: 'a' }] });
  if (sections.length === 1) pass('normalizePublishedSections');
  else fail('normalizePublishedSections');

  const blocks = fmt.normalizePublishedBlocks({ blocks: [{ id: 'b' }] });
  if (blocks.length === 1) pass('normalizePublishedBlocks');
  else fail('normalizePublishedBlocks');
} catch (error) {
  fail('publishedContentFormat import', error instanceof Error ? error.message : String(error));
}

const rendererSrc = fileExists('components/PublicPageRenderer.tsx')
  ? readText('components/PublicPageRenderer.tsx')
  : '';
for (const marker of [
  'PublicPageLiveTreeView',
  'PublicPageSectionsFallback',
  'PublicPageBlocksFallback',
  "mode === 'nodes'",
  "mode === 'sections'",
  "mode === 'blocks'",
  'resolvePublishedRenderMode',
]) {
  if (rendererSrc.includes(marker)) pass(`PublicPageRenderer references ${marker}`);
  else fail(`PublicPageRenderer references ${marker}`, 'not found in source');
}

const resolverSrc = fileExists('lib/site/domainResolver.ts')
  ? readText('lib/site/domainResolver.ts')
  : '';
for (const marker of ['getProjectByHost', 'getPublishedPageForRequest', 'normalizeHost']) {
  if (resolverSrc.includes(marker)) pass(`domainResolver exports ${marker}`);
  else fail(`domainResolver exports ${marker}`, 'not found in source');
}

// ── 3. Admin routes (source + build manifest) ───────────────────────────────
const ADMIN_ROUTE_SOURCES = [
  { route: '/admin', files: ['app/admin/page.jsx'] },
  { route: '/admin/projects', files: ['app/admin/(workspace)/projects/page.jsx', 'components/admin/d/DProjectsList.jsx'] },
  { route: '/d (redirect)', files: ['app/d/page.jsx', 'app/d/layout.jsx'] },
  { route: '/d/projects (redirect)', files: ['app/d/projects/page.jsx'] },
  {
    route: '/d/home (project slug page)',
    files: ['app/[projectSlug]/[pageSlug]/page.jsx'],
  },
];

for (const { route, files } of ADMIN_ROUTE_SOURCES) {
  let ok = true;
  for (const rel of files) {
    if (!fileExists(rel)) {
      fail(`Route source ${route}`, `missing ${rel}`);
      ok = false;
    }
  }
  if (ok) pass(`Route source ${route}`, files.join(', '));
}

const manifestPath = abs('.next/routes-manifest.json');
if (fileExists('.next/routes-manifest.json')) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const pages = collectBuildRoutePages(manifest);

    for (const route of ['/admin', '/admin/projects', '/d', '/d/projects']) {
      if (pages.has(route)) pass(`Build route ${route}`);
      else fail(`Build route ${route}`, 'not in .next/routes-manifest.json');
    }

    const hasProjectSlugPage = [...pages].some(
      (p) => p === '/[projectSlug]/[pageSlug]' || String(p).includes('[projectSlug]')
    );
    if (hasProjectSlugPage) pass('Build route /[projectSlug]/[pageSlug] (supports /d/home)');
    else fail('Build route /[projectSlug]/[pageSlug]', 'not in build manifest');
  } catch (error) {
    fail('Parse routes-manifest.json', error instanceof Error ? error.message : String(error));
  }
} else if (fileExists('.next/BUILD_ID')) {
  fail('routes-manifest.json', 'missing after build');
}

// ── Summary ─────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed\n`);
if (failed.length) process.exit(1);
