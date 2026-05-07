import './globals.css';

export const metadata = {
  title: 'Builder Custom',
  description: 'Builder UI and API',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
