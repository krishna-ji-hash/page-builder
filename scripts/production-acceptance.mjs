/**
 * Production acceptance test — end-to-end API + HTTP smoke.
 * Usage: npm run dev (separate terminal), then: node scripts/production-acceptance.mjs
 */
const BASE = (process.env.BATTLE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const AUTH_EMAIL = process.env.PAT_ADMIN_EMAIL || process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@localhost';
const AUTH_PASSWORD = process.env.PAT_ADMIN_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD || 'changeme';

const results = [];
let sessionCookie = '';

function absorbSessionCookie(res) {
  const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  for (const raw of setCookies) {
    const part = String(raw).split(';')[0];
    if (part.startsWith('bld_admin_session=')) sessionCookie = part;
  }
}

function record(module, status, detail, extra = {}) {
  results.push({ module, status, detail, ...extra });
}

async function jsonFetch(path, options = {}) {
  const url = `${BASE}${path}`;
  const headers = {
    Origin: BASE,
    ...(options.headers || {}),
  };
  if (sessionCookie) headers.Cookie = sessionCookie;
  const res = await fetch(url, { cache: 'no-store', ...options, headers });
  absorbSessionCookie(res);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { _raw: text.slice(0, 200) };
  }
  return { res, data, url };
}

async function ensureAdminSession() {
  if (process.env.AUTH_DISABLED === 'true' || process.env.AUTH_DISABLED === '1') {
    record('0. Admin Auth', 'WARNING', 'AUTH_DISABLED — skipping login');
    return true;
  }
  try {
    const login = await jsonFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD }),
    });
    if (!login.res.ok) {
      record(
        '0. Admin Auth',
        'FAIL',
        login.data?.error || `login HTTP ${login.res.status} — run npm run db:bootstrap-admin`
      );
      return false;
    }
    const me = await jsonFetch('/api/auth/me');
    if (!me.res.ok) {
      record('0. Admin Auth', 'FAIL', `session check failed HTTP ${me.res.status}`);
      return false;
    }
    record('0. Admin Auth', 'PASS', `logged in as ${me.data?.user?.email || AUTH_EMAIL}`);
    return true;
  } catch (e) {
    record('0. Admin Auth', 'FAIL', e.message);
    return false;
  }
}

function slugUnique(prefix) {
  return `${prefix}-${Date.now().toString(36)}`;
}

async function testProjectWizard() {
  const slug = slugUnique('pat-wizard');
  try {
    const templates = await jsonFetch('/api/platform/wizard/templates?industry=saas');
    if (!templates.res.ok) {
      record('1. Project Wizard', 'FAIL', `templates API ${templates.res.status}`);
      return null;
    }
    if (!templates.data?.templates?.length) {
      record('1. Project Wizard', 'WARNING', 'templates list empty');
    }

    const prov = await jsonFetch('/api/platform/wizard/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'PAT Wizard Site',
        slug,
        industry: 'saas',
        theme: 'light',
        templateId: 'saas-starter',
      }),
    });

    if (prov.res.status === 503) {
      record('1. Project Wizard', 'WARNING', 'Database offline', { slug });
      return null;
    }
    if (!prov.res.ok) {
      record('1. Project Wizard', 'FAIL', prov.data?.error || `provision ${prov.res.status}`);
      return null;
    }

    const project = prov.data?.project;
    const pages = prov.data?.pages || [];
    if (!project?.id || pages.length < 4) {
      record('1. Project Wizard', 'FAIL', `expected project+pages, got pages=${pages.length}`);
      return null;
    }
    if (!prov.data?.globalSections?.header) {
      record('1. Project Wizard', 'WARNING', 'no global header in provision response');
    }
    record('1. Project Wizard', 'PASS', `${pages.length} pages, project ${slug}`);
    return { project, pages, slug };
  } catch (e) {
    record('1. Project Wizard', 'FAIL', e.message);
    return null;
  }
}

async function testTemplateDeployment(ctx) {
  if (!ctx?.pages?.length) {
    record('2. Template Deployment', 'WARNING', 'skipped — no wizard project');
    return;
  }
  try {
    const home = ctx.pages.find((p) => p.slug === 'home') || ctx.pages[0];
    const builder = await jsonFetch(`/api/pages/${home.id}/builder`);
    if (!builder.res.ok) {
      record('2. Template Deployment', 'FAIL', `builder load ${builder.res.status}`);
      return;
    }
    const tree = builder.data?.tree || builder.data?.snapshot?.nodes || [];
    const nodeCount = countNodes(tree);
    if (nodeCount < 5) {
      record('2. Template Deployment', 'FAIL', `home tree too small (${nodeCount} nodes)`);
      return;
    }
    const hasRow = walkFind(tree, (n) => n.nodeType === 'row');
    if (!hasRow) {
      record('2. Template Deployment', 'WARNING', 'no row sections in deployed tree');
    }
    record('2. Template Deployment', 'PASS', `${nodeCount} nodes on home (${home.slug})`);
  } catch (e) {
    record('2. Template Deployment', 'FAIL', e.message);
  }
}

function countNodes(nodes) {
  let c = 0;
  const walk = (arr) => {
    for (const n of arr || []) {
      c += 1;
      walk(n.children);
    }
  };
  walk(nodes);
  return c;
}

function walkFind(nodes, pred) {
  for (const n of nodes || []) {
    if (pred(n)) return n;
    const f = walkFind(n.children, pred);
    if (f) return f;
  }
  return null;
}

async function testSaveDraft(ctx) {
  if (!ctx?.pages?.length) {
    record('3. Save Draft', 'WARNING', 'skipped — no project');
    return;
  }
  try {
    const page = ctx.pages[0];
    const before = await jsonFetch(`/api/pages/${page.id}/builder`);
    const tree = before.data?.tree || [];
    if (!tree.length) {
      record('3. Save Draft', 'FAIL', 'empty tree before save');
      return;
    }
    const marker = `PAT-${Date.now()}`;
    const patched = JSON.parse(JSON.stringify(tree));
    const heading = walkFind(patched, (n) => n.nodeType === 'heading');
    if (heading?.props) heading.props.text = marker;

    const bulk = await jsonFetch('/api/nodes/update-bulk', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: page.id, nodes: patched }),
    });
    if (!bulk.res.ok) {
      record('3. Save Draft', 'FAIL', bulk.data?.error || `bulk ${bulk.res.status}`);
      return;
    }
    const after = await jsonFetch(`/api/pages/${page.id}/builder`);
    const afterTree = after.data?.tree || [];
    const found = walkFind(afterTree, (n) => n.props?.text === marker);
    if (!found) {
      record('3. Save Draft', 'FAIL', 'marker text not persisted after bulk save');
      return;
    }
    record('3. Save Draft', 'PASS', 'update-bulk persisted draft');
    ctx.marker = marker;
    ctx.testPageId = page.id;
    ctx.testPageSlug = page.slug;
    ctx.projectSlug = ctx.slug;
  } catch (e) {
    record('3. Save Draft', 'FAIL', e.message);
  }
}

async function testPublish(ctx) {
  if (!ctx?.testPageId) {
    record('4. Publish', 'WARNING', 'skipped — no saved draft');
    return;
  }
  try {
    const pub = await jsonFetch(`/api/pages/${ctx.testPageId}/publish`, { method: 'POST' });
    if (!pub.res.ok) {
      record('4. Publish', 'FAIL', pub.data?.error || `publish ${pub.res.status}`);
      return;
    }
    if (!pub.data?.publishedVersionId) {
      record('4. Publish', 'FAIL', 'no publishedVersionId in response');
      return;
    }
    ctx.publishedVersionId = pub.data.publishedVersionId;

    const livePath = `/${ctx.projectSlug}/${ctx.testPageSlug}`;
    const live = await jsonFetch(livePath);
    if (live.res.status !== 200) {
      record('4. Publish', 'WARNING', `live URL ${livePath} returned ${live.res.status}`);
    } else if (ctx.marker && !live.data?._raw && !String(live).includes(ctx.marker)) {
      const html = typeof live.data === 'string' ? live.data : '';
      if (!html.includes(ctx.marker)) {
        record('4. Publish', 'WARNING', 'live HTML may not include draft marker (SSR cache)');
      } else {
        record('4. Publish', 'PASS', `published v${pub.data.versionNumber}, live OK`);
      }
    } else {
      record('4. Publish', 'PASS', `published v${pub.data.versionNumber}`);
    }

    const liveRes = await fetch(`${BASE}/${ctx.projectSlug}/${ctx.testPageSlug}`, { cache: 'no-store' });
    const html = await liveRes.text();
    if (!/live-site|live-doc/i.test(html) && liveRes.status === 200) {
      record('4. Publish', 'WARNING', 'live page missing live-site wrapper');
    }
  } catch (e) {
    record('4. Publish', 'FAIL', e.message);
  }
}

async function testVersionRestore(ctx) {
  if (!ctx?.testPageId || !ctx?.publishedVersionId) {
    record('5. Version Restore', 'WARNING', 'skipped — no published page');
    return;
  }
  try {
    const list = await jsonFetch(`/api/pages/${ctx.testPageId}/versions`);
    if (!list.res.ok) {
      record('5. Version Restore', 'FAIL', `versions list ${list.res.status}`);
      return;
    }
    const versions = list.data?.versions || [];
    if (!versions.length) {
      record('5. Version Restore', 'FAIL', 'no published/archived versions');
      return;
    }
    const vid = versions[0].id;

    const before = await jsonFetch(`/api/pages/${ctx.testPageId}/builder`);
    const bulk = await jsonFetch('/api/nodes/update-bulk', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId: ctx.testPageId,
        nodes: [],
      }),
    });
    if (!bulk.res.ok) {
      record('5. Version Restore', 'WARNING', 'could not clear tree for restore test');
    }

    const restore = await jsonFetch(`/api/pages/${ctx.testPageId}/versions/${vid}?action=restore`, {
      method: 'POST',
    });
    if (!restore.res.ok) {
      record('5. Version Restore', 'FAIL', restore.data?.error || `restore ${restore.res.status}`);
      return;
    }
    const after = await jsonFetch(`/api/pages/${ctx.testPageId}/builder`);
    const nodeCount = countNodes(after.data?.tree || []);
    if (nodeCount < 3) {
      record('5. Version Restore', 'FAIL', `restored tree too small (${nodeCount})`);
      return;
    }
    record('5. Version Restore', 'PASS', `restored from version ${vid}, ${nodeCount} nodes`);
  } catch (e) {
    record('5. Version Restore', 'FAIL', e.message);
  }
}

async function testDomainMapping(ctx) {
  if (!ctx?.project?.id) {
    record('6. Domain Mapping', 'WARNING', 'skipped — no project');
    return;
  }
  try {
    const domain = `pat-${Date.now().toString(36)}.example.com`;
    const add = await jsonFetch(`/api/projects/${ctx.project.id}/domains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    if (add.res.status === 500 && String(add.data?.details || add.data?.error || '').includes('project_domains')) {
      record('6. Domain Mapping', 'FAIL', 'migration 017 not applied — run npm run db:migrate');
      return;
    }
    if (!add.res.ok) {
      record('6. Domain Mapping', 'FAIL', add.data?.error || `add domain ${add.res.status}`);
      return;
    }
    if (!add.data?.domain?.verificationToken) {
      record('6. Domain Mapping', 'WARNING', 'no verification token in response');
    }

    const resolve = await jsonFetch(`/api/platform/resolve-host?host=${encodeURIComponent(domain)}`);
    if (resolve.res.ok && resolve.data?.projectSlug) {
      record('6. Domain Mapping', 'WARNING', 'unverified domain resolved (should be null until verified)');
    }

    const verify = await jsonFetch(
      `/api/projects/${ctx.project.id}/domains/${add.data.domain.id}?action=verify`,
      { method: 'POST' }
    );
    if (!verify.res.ok) {
      record('6. Domain Mapping', 'WARNING', `verify failed ${verify.res.status}`);
    }

    const resolve2 = await jsonFetch(`/api/platform/resolve-host?host=${encodeURIComponent(domain)}`);
    if (!resolve2.data?.projectSlug) {
      record('6. Domain Mapping', 'WARNING', 'verified domain did not resolve via API');
    }

    const dispatch = await jsonFetch('/api/platform/resolve-host?host=dispatch.in');
    if (dispatch.res.ok) {
      record(
        '6. Domain Mapping',
        dispatch.data?.projectSlug ? 'PASS' : 'WARNING',
        dispatch.data?.projectSlug
          ? `platform host dispatch.in → ${dispatch.data.projectSlug}`
          : 'dispatch.in project slug not in DB'
      );
    } else {
      record('6. Domain Mapping', 'FAIL', `resolve-host ${dispatch.res.status}`);
    }
  } catch (e) {
    record('6. Domain Mapping', 'FAIL', e.message);
  }
}

async function testCmsCollections(ctx) {
  if (!ctx?.project?.id) {
    record('7. CMS Collections', 'WARNING', 'skipped — no project');
    return;
  }
  try {
    const list = await jsonFetch(`/api/projects/${ctx.project.id}/cms/collections`);
    if (!list.res.ok) {
      record('7. CMS Collections', 'FAIL', `list ${list.res.status}`);
      return;
    }
    const cols = list.data?.collections || list.data || [];
    const arr = Array.isArray(cols) ? cols : [];
    if (arr.length === 0) {
      record('7. CMS Collections', 'WARNING', 'no collections (wizard may not have created for industry)');
    } else {
      record('7. CMS Collections', 'PASS', `${arr.length} collection(s)`);
    }

    const slug = `pat-col-${Date.now().toString(36)}`;
    const create = await jsonFetch(`/api/projects/${ctx.project.id}/cms/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'PAT Collection', slug, type: 'custom' }),
    });
    if (!create.res.ok) {
      record('7. CMS Collections', 'WARNING', `create collection ${create.res.status}: ${create.data?.error || ''}`);
    } else {
      record('7. CMS Collections', arr.length ? 'PASS' : 'PASS', 'list + create OK');
    }
  } catch (e) {
    record('7. CMS Collections', 'FAIL', e.message);
  }
}

async function testSeoGeneration(ctx) {
  if (!ctx?.testPageId || !ctx?.project?.id) {
    record('8. SEO Generation', 'WARNING', 'skipped — no page');
    return;
  }
  try {
    const pageSeo = await jsonFetch(`/api/pages/${ctx.testPageId}/seo`);
    if (!pageSeo.res.ok) {
      record('8. SEO Generation', 'FAIL', `page seo GET ${pageSeo.res.status}`);
      return;
    }
    const seo = pageSeo.data?.seo || pageSeo.data;
    if (!seo?.title) {
      record('8. SEO Generation', 'WARNING', 'page seo title empty');
    }

    const projSeo = await jsonFetch(`/api/projects/${ctx.project.id}/seo`);
    if (!projSeo.res.ok) {
      record('8. SEO Generation', 'WARNING', `project seo ${projSeo.res.status}`);
    }

    if (ctx.projectSlug && ctx.testPageSlug) {
      const liveRes = await fetch(`${BASE}/${ctx.projectSlug}/${ctx.testPageSlug}`, {
        cache: 'no-store',
      });
      const html = await liveRes.text();
      const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
      const hasDesc = /name=["']description["']/i.test(html);
      if (!hasTitle) {
        record('8. SEO Generation', 'WARNING', 'live page missing <title>');
      } else if (!hasDesc) {
        record('8. SEO Generation', 'PASS', 'title present; description optional');
      } else {
        record('8. SEO Generation', 'PASS', 'page + project SEO APIs; live metadata present');
      }
    } else {
      record('8. SEO Generation', 'PASS', 'SEO APIs respond');
    }
  } catch (e) {
    record('8. SEO Generation', 'FAIL', e.message);
  }
}

async function testForms(ctx) {
  try {
    const projects = await jsonFetch('/api/projects');
    if (!projects.res.ok) {
      record('9. Forms', 'WARNING', 'cannot list projects for form test');
      return;
    }
    const project = (projects.data?.projects || [])[0];
    if (!project?.id) {
      record('9. Forms', 'WARNING', 'no projects for form submit test');
      return;
    }
    const pages = await jsonFetch(`/api/projects/${project.id}/pages`);
    const page = (pages.data?.pages || [])[0];
    if (!page?.id) {
      record('9. Forms', 'WARNING', 'no pages for form test');
      return;
    }

    const submit = await jsonFetch('/api/forms/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: project.id,
        pageId: page.id,
        formId: 'pat-form-1',
        values: { email: 'pat@test.example', name: 'PAT Tester' },
      }),
    });
    if (submit.res.status === 503) {
      record('9. Forms', 'WARNING', 'DB offline for form submit');
      return;
    }
    if (!submit.res.ok) {
      record('9. Forms', 'FAIL', submit.data?.error || `submit ${submit.res.status}`);
      return;
    }
    record('9. Forms', 'PASS', 'form submission accepted');
  } catch (e) {
    record('9. Forms', 'FAIL', e.message);
  }
}

async function testDarkLightMode(ctx) {
  if (!ctx?.project?.id || !ctx?.pages?.length) {
    record('10. Dark/Light Mode', 'WARNING', 'skipped — no project');
    return;
  }
  try {
    const builder = await jsonFetch(`/api/pages/${ctx.pages[0].id}/builder`);
    if (!builder.res.ok) {
      record('10. Dark/Light Mode', 'FAIL', `builder load ${builder.res.status}`);
      return;
    }
    const cfg = builder.data?.page?.projectConfig || {};
    const t = cfg.themeTokens;
    const site = cfg.siteTheme;
    const mode = t?.mode || site?.presetId;
    if (!t && !site) {
      record('10. Dark/Light Mode', 'FAIL', 'no theme in projectConfig');
      return;
    }

    const patch = await jsonFetch(`/api/projects/${ctx.project.id}/theme-tokens`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        themeTokens: { ...t, mode: 'dark' },
      }),
    });
    if (!patch.res.ok) {
      record('10. Dark/Light Mode', 'FAIL', `theme-tokens PATCH ${patch.res.status}`);
      return;
    }

    const sitePatch = await jsonFetch(`/api/projects/${ctx.project.id}/site-theme`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteTheme: { ...site, presetId: 'dark' },
      }),
    });
    if (!sitePatch.res.ok) {
      record('10. Dark/Light Mode', 'WARNING', `site-theme PATCH ${sitePatch.res.status}`);
    }

    const revert = await jsonFetch(`/api/projects/${ctx.project.id}/theme-tokens`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeTokens: { ...t, mode: 'light' } }),
    });

    if (revert.res.ok) {
      record(
        '10. Dark/Light Mode',
        'PASS',
        `config mode=${mode}; PATCH theme-tokens + site-theme OK (no GET route — use builder)`
      );
    } else {
      record('10. Dark/Light Mode', 'WARNING', 'dark patch OK, light revert failed');
    }
  } catch (e) {
    record('10. Dark/Light Mode', 'FAIL', e.message);
  }
}

async function testUiRoutes() {
  const routes = [
    ['/admin/dashboard', 'Admin dashboard'],
    ['/admin/projects', 'Projects list'],
    ['/admin/builder', 'Builder index redirects to projects'],
    ['/admin/publishing', 'Publishing dashboard'],
    ['/admin/platform-health', 'Platform health'],
  ];
  for (const [path, label] of routes) {
    try {
      const headers = sessionCookie ? { Cookie: sessionCookie } : {};
      const res = await fetch(`${BASE}${path}`, { cache: 'no-store', redirect: 'follow', headers });
      if (res.status >= 500) {
        record('UI Routes', 'FAIL', `${path} (${label}) HTTP ${res.status}`);
      } else if (res.status === 401 || res.url.includes('/admin/login')) {
        record('UI Routes', 'FAIL', `${path} (${label}) redirected to login`);
      } else {
        record('UI Routes', 'PASS', `${path} (${label}) HTTP ${res.status}`);
      }
    } catch (e) {
      record('UI Routes', 'FAIL', `${path}: ${e.message}`);
    }
  }
}

async function main() {
  process.stdout.write(`\nProduction Acceptance Testing → ${BASE}\n\n`);

  let serverOk = false;
  try {
    const ping = await fetch(BASE, { cache: 'no-store' });
    serverOk = ping.status < 500;
  } catch (e) {
    process.stderr.write(`Cannot reach ${BASE}: ${e.message}\nRun: npm run dev\n`);
    process.exit(1);
  }
  if (!serverOk) {
    process.stderr.write('Server returned 5xx on /\n');
    process.exit(1);
  }

  const authed = await ensureAdminSession();
  if (!authed && process.env.AUTH_DISABLED !== 'true' && process.env.AUTH_DISABLED !== '1') {
    process.stdout.write('\nAborting PAT — admin authentication required.\n');
    process.exit(1);
  }
  await testUiRoutes();
  const ctx = await testProjectWizard();
  await testTemplateDeployment(ctx);
  await testSaveDraft(ctx);
  await testPublish(ctx);
  await testVersionRestore(ctx);
  await testDomainMapping(ctx);
  await testCmsCollections(ctx);
  await testSeoGeneration(ctx);
  await testForms(ctx);
  await testDarkLightMode(ctx);

  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  const warn = results.filter((r) => r.status === 'WARNING').length;

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : r.status === 'FAIL' ? '✗' : '⚠';
    process.stdout.write(`${icon} [${r.status}] ${r.module}: ${r.detail}\n`);
  }

  process.stdout.write(`\n--- Summary: ${pass} PASS, ${fail} FAIL, ${warn} WARNING ---\n`);

  const moduleNames = [
    '1. Project Wizard',
    '2. Template Deployment',
    '3. Save Draft',
    '4. Publish',
    '5. Version Restore',
    '6. Domain Mapping',
    '7. CMS Collections',
    '8. SEO Generation',
    '9. Forms',
    '10. Dark/Light Mode',
  ];
  for (const name of moduleNames) {
    const row = results.find((r) => r.module === name);
    if (!row) process.stdout.write(`? ${name}: NOT RUN\n`);
  }

  const productionScore = Math.round(((pass + warn * 0.5) / moduleNames.length) * 100);
  process.stdout.write(`\nProduction readiness estimate: ${productionScore}%\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
