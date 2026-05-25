import './globals.css';

export const metadata = {
  title: 'Builder Custom',
  description: 'Builder UI and API',
  icons: {
    icon: '/favicon.svg',
  },
};

/** Required for real phones — without this, CSS `max-width` breakpoints never match. */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
