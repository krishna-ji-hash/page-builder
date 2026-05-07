import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
      <h1 style={{ marginTop: 0 }}>Builder Custom</h1>
      <p>
        <Link href="/admin/builder">Admin — choose a page to edit</Link>
      </p>
      <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
        Public pages use <code>/[projectSlug]/[pageSlug]</code> (for example{' '}
        <Link href="/default/home">/default/home</Link> after seed + publish).
      </p>
    </main>
  );
}
