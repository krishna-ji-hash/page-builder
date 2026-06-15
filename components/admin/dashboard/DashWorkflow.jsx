import Link from 'next/link';
import {
  ADMIN_PLATFORM_HEALTH_PATH,
  ADMIN_PROJECT_NEW_PATH,
  ADMIN_PROJECTS_PATH,
  ADMIN_PUBLISHING_PATH,
} from '@/lib/admin/adminRoutes';

const STEPS = [
  {
    num: 1,
    href: ADMIN_PROJECT_NEW_PATH,
    label: 'Create',
    desc: 'Start a new site',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: 2,
    href: ADMIN_PROJECTS_PATH,
    label: 'Your sites',
    desc: 'Manage pages',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3.5 5.5h13v9a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 013.5 14.5v-9z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 5.5V4a1 1 0 011-1h4a1 1 0 011 1v1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    num: 3,
    href: ADMIN_PUBLISHING_PATH,
    label: 'Publishing',
    desc: 'Go live',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5M4 16.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: 4,
    href: ADMIN_PLATFORM_HEALTH_PATH,
    label: 'Health',
    desc: 'Audit & monitor',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3.5 10h2.5l2-4 3 8 2-4h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function DashWorkflow() {
  return (
    <section className="dash-flow" aria-labelledby="dash-flow-title">
      <div className="dash-section__head">
        <h2 id="dash-flow-title" className="dash-section__title">
          Workflow
        </h2>
      </div>
      <ol className="dash-flow__track">
        {STEPS.map((step, index) => (
          <li key={step.href} className="dash-flow__step-wrap">
            <Link href={step.href} className="dash-flow__step">
              <span className="dash-flow__num">{step.num}</span>
              <span className="dash-flow__icon">{step.icon}</span>
              <span className="dash-flow__label">{step.label}</span>
              <span className="dash-flow__desc">{step.desc}</span>
            </Link>
            {index < STEPS.length - 1 ? (
              <span className="dash-flow__connector" aria-hidden="true">
                <svg viewBox="0 0 24 12" fill="none">
                  <path d="M0 6h18m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
