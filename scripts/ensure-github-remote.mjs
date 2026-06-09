/**
 * Create missing GitHub repo and align `origin` with the authenticated account.
 * Usage: node scripts/ensure-github-remote.mjs [repo-name]
 */
import { spawnSync } from 'node:child_process';
import { execSync } from 'node:child_process';

const repoName = process.argv[2] || 'page-builder';

function readGitHubToken() {
  const r = spawnSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8',
    timeout: 8000,
  });
  if (r.status !== 0) {
    throw new Error('Could not read GitHub credentials. Run: gh auth login');
  }
  const m = String(r.stdout || '').match(/^password=(.+)$/m);
  if (!m?.[1]) throw new Error('No GitHub token in credential manager.');
  return m[1].trim();
}

async function ghApi(token, path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Builder-custom',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || res.statusText;
    throw new Error(`${method} ${path} failed (${res.status}): ${msg}`);
  }
  return data;
}

function currentOrigin() {
  try {
    return execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function setOrigin(login, name) {
  const url = `https://github.com/${login}/${name}.git`;
  execSync(`git remote set-url origin ${url}`, { stdio: 'inherit' });
  return url;
}

async function main() {
  const token = readGitHubToken();
  const user = await ghApi(token, '/user');
  const login = String(user.login || '').trim();
  if (!login) throw new Error('Could not resolve authenticated GitHub user.');

  const origin = currentOrigin();
  console.log(`[github] Authenticated as: ${login}`);
  if (origin) console.log(`[github] Current origin: ${origin}`);

  let repo;
  try {
    repo = await ghApi(token, `/repos/${login}/${repoName}`);
    console.log(`[github] Repo exists: ${repo.html_url}`);
  } catch {
    console.log(`[github] Creating ${login}/${repoName}…`);
    repo = await ghApi(token, '/user/repos', {
      method: 'POST',
      body: {
        name: repoName,
        private: false,
        description: 'Next.js + MySQL page builder (Builder-custom)',
      },
    });
    console.log(`[github] Created: ${repo.html_url}`);
  }

  const expected = `https://github.com/${login}/${repoName}.git`;
  if (origin !== expected) {
    console.log(`[github] Updating origin → ${expected}`);
    setOrigin(login, repoName);
  }

  const configUser = spawnSync('git', ['config', '--global', 'user.name'], { encoding: 'utf8' }).stdout?.trim();
  if (configUser && configUser !== login) {
    console.warn(
      `[github] Note: git user.name is "${configUser}" but GitHub login is "${login}". Push uses "${login}".`
    );
  }

  console.log('[github] Ready. Run: git push -u origin main');
}

main().catch((err) => {
  console.error('[github]', err.message || err);
  process.exit(1);
});
