/**
 * Production battle-test HTTP + SEO smoke audit.
 *
 * Usage:
 *   npm run dev   (separate terminal)
 *   npm run battle-test:audit
 *
 * Env:
 *   BATTLE_BASE_URL=http://localhost:3000
 */

const BASE = (process.env.BATTLE_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

const CHECKS = [
  {
    project: 'battle-real-estate',
    live: [
      '/battle-real-estate/home',
      '/battle-real-estate/austin-luxury-homes',
      '/battle-real-estate/property/oak-lane',
    ],
    preview: ['/preview/battle-real-estate/home'],
    infra: ['/battle-real-estate/sitemap.xml', '/battle-real-estate/robots.txt'],
  },
  {
    project: 'battle-ecommerce',
    live: [
      '/battle-ecommerce/home',
      '/battle-ecommerce/summer-sale',
      '/battle-ecommerce/product/desk-lamp',
    ],
    preview: ['/preview/battle-ecommerce/home'],
    infra: ['/battle-ecommerce/sitemap.xml', '/battle-ecommerce/robots.txt'],
  },
  {
    project: 'battle-logistics',
    live: ['/battle-logistics/home', '/battle-logistics/cross-border-freight'],
    preview: ['/preview/battle-logistics/home'],
    infra: ['/battle-logistics/sitemap.xml', '/battle-logistics/robots.txt'],
  },
];

function extractMeta(html, attr, name) {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${name}["']`,
    'i'
  );
  const m = html.match(re);
  return m ? (m[1] || m[2] || '').trim() : '';
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
}

function hasH1(html) {
  return /<h1[\s>]/i.test(html);
}

function hasLiveSiteRoot(html) {
  return /class=["']live-site["']/i.test(html) || /data-route-kind=["']published["']/i.test(html);
}

function hasIxVars(html) {
  return /--node-anim-name|live-node--ix/i.test(html);
}

async function fetchPath(path, label) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, { cache: 'no-store', redirect: 'follow' });
    const html = await res.text();
    const title = extractTitle(html);
    const description = extractMeta(html, 'name', 'description');
    const canonical = extractMeta(html, 'rel', 'canonical');
    const issues = [];
    if (res.status !== 200) issues.push(`HTTP ${res.status}`);
    const isInfra = path.endsWith('.xml') || path.endsWith('.txt');
    if (!title && !isInfra) issues.push('missing <title>');
    if (!description && !isInfra) {
      issues.push('missing meta description');
    }
    if (!isInfra && !hasH1(html)) {
      issues.push('missing <h1>');
    }
    if (path.includes('/preview/') && !html.includes('draft-preview') && !html.includes('live-site')) {
      issues.push('preview shell markers missing');
    }
    if (!path.includes('/preview/') && !isInfra) {
      if (!hasLiveSiteRoot(html)) issues.push('live-site root missing');
    }
    if (path.includes('/home') && hasIxVars(html) === false && label === 'live') {
      // soft — interactions optional on all pages
    }
    return {
      path,
      url,
      ok: issues.length === 0,
      status: res.status,
      title,
      description: description.slice(0, 80),
      canonical: canonical.slice(0, 80),
      issues,
      hasIx: hasIxVars(html),
    };
  } catch (err) {
    return {
      path,
      url,
      ok: false,
      status: 0,
      issues: [err.message || String(err)],
    };
  }
}

async function main() {
  const results = [];
  let fail = 0;

  process.stdout.write(`Battle audit → ${BASE}\n\n`);

  for (const group of CHECKS) {
    process.stdout.write(`## ${group.project}\n`);
    const paths = [
      ...group.live.map((p) => ({ path: p, label: 'live' })),
      ...group.preview.map((p) => ({ path: p, label: 'preview' })),
      ...group.infra.map((p) => ({ path: p, label: 'infra' })),
    ];
    for (const { path, label } of paths) {
      const r = await fetchPath(path, label);
      results.push(r);
      const icon = r.ok ? 'OK' : 'FAIL';
      if (!r.ok) fail += 1;
      process.stdout.write(`  [${icon}] ${r.status || '—'} ${r.path}`);
      if (r.title) process.stdout.write(` — ${r.title.slice(0, 50)}`);
      if (r.issues?.length) process.stdout.write(` (${r.issues.join('; ')})`);
      process.stdout.write('\n');
    }
    process.stdout.write('\n');
  }

  // Parity: live vs preview title on home (ignore generic root layout title)
  for (const group of CHECKS) {
    const liveHome = results.find((r) => r.path === `/${group.project}/home`);
    const prevHome = results.find((r) => r.path === `/preview/${group.project}/home`);
    const generic = /^Builder Custom$/i;
    if (
      liveHome?.title &&
      prevHome?.title &&
      !generic.test(prevHome.title) &&
      liveHome.title !== prevHome.title
    ) {
      process.stdout.write(
        `  [WARN] ${group.project} preview/live title mismatch: "${prevHome.title}" vs "${liveHome.title}"\n`
      );
    }
    if (prevHome?.title && generic.test(prevHome.title)) {
      process.stdout.write(
        `  [WARN] ${group.project} draft preview uses root layout title — add generateMetadata on /preview route\n`
      );
    }
  }

  process.stdout.write(`\n${results.length} checks, ${fail} failed.\n`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
