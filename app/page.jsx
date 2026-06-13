import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ADMIN_DASHBOARD_PATH, ADMIN_LOGIN_PATH } from '@/lib/admin/adminRoutes';
import { resolveSessionFromCookies } from '@/lib/auth/session';
import '@/styles/home.css';

export const dynamic = 'force-dynamic';

const FLOW_STEPS = [
  { num: '1', title: 'Sign in', text: 'Admin login with your platform credentials.' },
  { num: '2', title: 'Dashboard', text: 'Overview of projects, publishing, and platform health.' },
  { num: '3', title: 'Projects', text: 'Create sites, manage pages, domains, SEO, and settings.' },
  { num: '4', title: 'Builder', text: 'Design pages visually — templates and elements only.' },
  { num: '5', title: 'Publish', text: 'Preview drafts, run the checklist, and go live.' },
];

export default async function HomePage() {
  const session = await resolveSessionFromCookies();
  if (session) {
    redirect(ADMIN_DASHBOARD_PATH);
  }

  return (
    <div className="home">
      <header className="home-header">
        <Link href="/" className="home-brand">
          <span className="home-brand__mark" aria-hidden="true">
            B
          </span>
          <span className="home-brand__text">
            <span className="home-brand__name">Builder Custom</span>
            <span className="home-brand__tag">Visual page builder</span>
          </span>
        </Link>
        <nav className="home-nav" aria-label="Main">
          <Link className="home-btn home-btn--primary" href={ADMIN_LOGIN_PATH}>
            Admin sign in
          </Link>
        </nav>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <p className="home-hero__badge">Platform</p>
          <h1 className="home-hero__title">
            Build and publish with <span>Builder Custom</span>
          </h1>
          <p className="home-hero__lead">
            Sign in to the admin console to manage projects, edit pages in the builder, and publish
            to live URLs. Public visitors only see published sites.
          </p>
          <div className="home-hero__actions">
            <Link className="home-btn home-btn--primary" href={ADMIN_LOGIN_PATH}>
              Sign in to admin
            </Link>
          </div>
        </section>

        <section className="home-info" aria-labelledby="home-flow">
          <h2 id="home-flow" className="home-info__title">
            How it works
          </h2>
          <p className="home-info__text">
            All site management lives behind admin login — one place for the full workflow.
          </p>
          <ol className="home-flow">
            {FLOW_STEPS.map((step) => (
              <li key={step.num} className="home-flow__step">
                <span className="home-flow__num" aria-hidden="true">
                  {step.num}
                </span>
                <div>
                  <strong className="home-flow__title">{step.title}</strong>
                  <p className="home-flow__text">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="home-footer">Builder Custom · Admin-first platform</footer>
    </div>
  );
}
