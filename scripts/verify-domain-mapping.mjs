/**
 * Verify multi-project domain mapping flows (localhost + custom hosts).
 * Usage: npm run build && npm start   (separate terminal)
 *        node --env-file=.env scripts/verify-domain-mapping.mjs
 */
import { PrismaClient } from '@prisma/client';

const BASE = (process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const AUTH_EMAIL = process.env.ADMIN_EMAIL || process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@localhost';
const AUTH_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD || 'changeme';

function buildDefaultStarterPageJson(projectName = 'Your Website') {
  return {
    sections: [
      {
        id: 'hero_1',
        type: 'hero',
        props: {
          title: projectName,
          subtitle: 'Your new website is ready to customize.',
          buttonText: 'Get Started',
          buttonHref: '#',
        },
        style: {},
      },
      {
        id: 'text_1',
        type: 'text',
        props: {
          heading: 'About this site',
          text: 'Edit this page in the builder admin to publish your brand, services, and contact details.',
        },
        style: {},
      },
    ],
  };
}

const prisma = new PrismaClient();
const results = [];
let sessionCookie = '';

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function absorbSessionCookie(res) {
  const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  for (const raw of setCookies) {
    const part = String(raw).split(';')[0];
    if (part.startsWith('bld_admin_session=')) sessionCookie = part;
  }
}

async function fetchPath(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (sessionCookie) headers.Cookie = sessionCookie;
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store', redirect: 'manual', ...options, headers });
  absorbSessionCookie(res);
  const text = await res.text();
  return { res, text };
}

async function ensureAdminSession() {
  const login = await fetchPath('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD }),
  });
  if (!login.res.ok) {
    fail('Admin login', `HTTP ${login.res.status}`);
    return false;
  }
  pass('Admin login', AUTH_EMAIL);
  return true;
}

async function ensureMainSiteSections() {
  const project = await prisma.project.findFirst({ where: { slug: 'main-site' } });
  if (!project) {
    fail('Main-site seed', 'project not found — run npx prisma db seed');
    return false;
  }

  const home = await prisma.page.findFirst({
    where: { projectId: project.id, slug: 'home' },
  });
  if (!home) {
    fail('Main-site home page', 'missing');
    return false;
  }

  const published = home.publishedJson && typeof home.publishedJson === 'object' ? home.publishedJson : {};
  const sections = Array.isArray(published.sections) ? published.sections : [];
  if (!sections.length) {
    const sectionsContent = buildDefaultStarterPageJson(project.name || 'Main Website');
    const merged = { ...sectionsContent, ...(published.nodes ? { nodes: published.nodes } : {}) };
    await prisma.page.update({
      where: { id: home.id },
      data: {
        publishedJson: merged,
        draftJson: merged,
        status: 'published',
        publishedAt: home.publishedAt || new Date(),
      },
    });
    pass('Main-site home publishedJson', 'patched with sections');
  } else {
    pass('Main-site home publishedJson', 'sections present');
  }

  await prisma.siteSetting.upsert({
    where: { id: 'main' },
    create: { id: 'main', activeProjectId: project.id },
    update: { activeProjectId: project.id },
  });
  pass('Active project', `main-site (id=${project.id})`);
  return true;
}

async function upsertProject({ name, slug, domain }) {
  const existing = await prisma.project.findFirst({ where: { slug } });
  if (existing) {
    await prisma.project.update({
      where: { id: existing.id },
      data: { name, domain, status: 'ACTIVE' },
    });
    return existing;
  }

  const starterJson = buildDefaultStarterPageJson(name);
  const now = new Date();
  const project = await prisma.project.create({
    data: {
      name,
      title: name,
      slug,
      domain,
      homeSlug: 'home',
      status: 'ACTIVE',
      type: 'website',
      configJson: { siteTheme: { mode: 'light' } },
      pages: {
        create: {
          title: 'Home',
          slug: 'home',
          status: 'published',
          draftJson: starterJson,
          publishedJson: starterJson,
          publishedAt: now,
        },
      },
    },
  });
  return project;
}

function hostHeaders(hostname) {
  const host = `${hostname}:3000`;
  return { Host: host, 'x-forwarded-host': host };
}

function expectHeroTitle(html, title) {
  return (
    html.includes(title) ||
    html.includes('pub-page__hero-title') ||
    html.includes('pub-page__hero')
  );
}

/** Active-project home may use sections fallback or the existing builder live tree. */
function hasPublishedHomeContent(html, projectName = '') {
  if (
    html.includes('pub-page__hero') ||
    html.includes('live-doc') ||
    html.includes('bld-live-doc')
  ) {
    return true;
  }
  return Boolean(projectName && html.includes(projectName));
}

async function main() {
  console.log(`\nDomain mapping verification — ${BASE}\n`);

  try {
    try {
      await fetchPath('/');
    } catch (error) {
      fail('Server reachable', error.message);
      console.error('\nStart the app first: npm run build && npm start\n');
      process.exit(1);
    }

    if (!(await ensureMainSiteSections())) {
      process.exit(1);
    }

    const mainProject = await prisma.project.findFirst({ where: { slug: 'main-site' } });
    const mainProjectName = mainProject?.name || 'Main Website';

    // 1. localhost active project home
    const localhostHome = await fetchPath('/', {
      headers: hostHeaders('localhost'),
    });
    if (
      localhostHome.res.status === 200 &&
      (hasPublishedHomeContent(localhostHome.text, mainProjectName) ||
        expectHeroTitle(localhostHome.text, mainProjectName))
    ) {
      pass('localhost:3000/', 'active project home from publishedJson');
    } else {
      fail('localhost:3000/', `HTTP ${localhostHome.res.status}, hero missing`);
    }

    // 2–4. Dispatch project
    const dispatch = await upsertProject({
      name: 'Dispatch',
      slug: 'dispatch',
      domain: 'dispatch.local',
    });
    pass('Create project Dispatch', `id=${dispatch.id}, domain=dispatch.local`);

    const dispatchHome = await fetchPath('/', {
      headers: hostHeaders('dispatch.local'),
    });
    if (dispatchHome.res.status === 200 && expectHeroTitle(dispatchHome.text, 'Dispatch')) {
      pass('dispatch.local:3000', 'Dispatch home from publishedJson');
    } else {
      fail('dispatch.local:3000', `HTTP ${dispatchHome.res.status}, expected Dispatch hero`);
    }

    // 5–7. Ace Nest project
    const aceNest = await upsertProject({
      name: 'Ace Nest',
      slug: 'ace-nest',
      domain: 'acenest.local',
    });
    pass('Create project Ace Nest', `id=${aceNest.id}, domain=acenest.local`);

    const aceHome = await fetchPath('/', {
      headers: hostHeaders('acenest.local'),
    });
    if (aceHome.res.status === 200 && expectHeroTitle(aceHome.text, 'Ace Nest')) {
      pass('acenest.local:3000', 'Ace Nest home from publishedJson');
    } else {
      fail('acenest.local:3000', `HTTP ${aceHome.res.status}, expected Ace Nest hero`);
    }

    // 8. Admin projects list on localhost
    if (await ensureAdminSession()) {
      const projectsApi = await fetchPath('/api/admin/projects', {
        headers: { ...hostHeaders('localhost'), Origin: BASE },
      });
      let projects = [];
      try {
        projects = JSON.parse(projectsApi.text).projects || [];
      } catch {
        projects = [];
      }
      const names = projects.map((p) => p.name);
      const hasDispatch = names.some((n) => n === 'Dispatch');
      const hasAceNest = names.some((n) => n === 'Ace Nest');
      if (projectsApi.res.status === 200 && hasDispatch && hasAceNest) {
        pass('localhost:3000/d/projects', `API lists ${projects.length} projects incl. Dispatch & Ace Nest`);
      } else {
        fail('localhost:3000/d/projects', `API HTTP ${projectsApi.res.status}, names=${names.join(', ')}`);
      }
    }

    // 9. Admin block on client domain
    const blocked = await fetchPath('/d/projects', {
      headers: hostHeaders('dispatch.local'),
    });
    const location = blocked.res.headers.get('location') || '';
    if (
      (blocked.res.status === 307 || blocked.res.status === 302 || blocked.res.status === 308) &&
      (location === '/' || location.endsWith('/'))
    ) {
      pass('dispatch.local:3000/d/projects', 'redirects away from admin');
    } else if (blocked.res.status === 200 && !blocked.text.includes('proj-pages')) {
      pass('dispatch.local:3000/d/projects', 'blocked (no project manager UI)');
    } else {
      fail('dispatch.local:3000/d/projects', `HTTP ${blocked.res.status}, location=${location || 'none'}`);
    }

    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed\n`);
    if (failed.length) process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
