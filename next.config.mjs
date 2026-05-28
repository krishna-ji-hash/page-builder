import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const publicProjectSlug = String(
  process.env.NEXT_PUBLIC_PUBLIC_PROJECT_SLUG || process.env.PUBLIC_PROJECT_SLUG || 'dispatch'
)
  .trim()
  .replace(/^\/+|\/+$/g, '') || 'dispatch';

const flatPublicUrls =
  process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS !== '0' &&
  process.env.NEXT_PUBLIC_FLAT_PUBLIC_URLS !== 'false';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    if (!flatPublicUrls) return [];
    return [
      {
        source: `/${publicProjectSlug}/:page`,
        destination: '/:page',
        permanent: true,
      },
    ];
  },
  // Avoid picking a parent folder when another package-lock.json exists above this project
  outputFileTracingRoot: path.join(__dirname),
  // Keep DOMPurify + jsdom as Node requires — avoids missing `.next/server/vendor-chunks/dompurify.js` after HMR.
  // Also externalize `mysql2` to avoid flaky dev vendor-chunks on Windows (`./vendor-chunks/mysql2.js` missing).
  serverExternalPackages: ['isomorphic-dompurify', 'dompurify', 'jsdom', 'mysql2'],
  experimental: {
    // Work around unstable dev segment explorer manifest errors in Next 15.x
    devtoolSegmentExplorer: false,
  },
  webpack: (config, { dev }) => {
    // Prevents stale chunk maps after HMR on Windows: "__webpack_modules__[moduleId] is not a function"
    // and "Cannot find module './NNNN.js'" under .next/server (corrupt webpack filesystem cache).
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
