import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getPrivateLanHosts() {
  const hosts = new Set(['localhost', '127.0.0.1']);
  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const entry of entries || []) {
      if (!entry || entry.family !== 'IPv4' || entry.internal) continue;
      hosts.add(entry.address);
    }
  }
  return Array.from(hosts);
}

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
  // Next.js 15 blocks non-localhost dev access unless listed (LAN testing from phone/Mac)
  allowedDevOrigins: getPrivateLanHosts(),
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
  // Externalize native/heavy deps to avoid flaky dev vendor-chunks on Windows (missing `./vendor-chunks/*.js`).
  serverExternalPackages: ['isomorphic-dompurify', 'dompurify', 'jsdom', 'mysql2'],
  experimental: {
    // Work around unstable dev segment explorer manifest errors in Next 15.x
    devtoolSegmentExplorer: false,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Filesystem cache (with a project-specific id) is more stable on Windows than cache:false,
      // which can race and produce ENOENT for on-demand server page chunks.
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.join(__dirname, '.next', 'cache', 'webpack'),
        buildDependencies: {
          config: [path.join(__dirname, 'next.config.mjs')],
        },
      };
      if (isServer) {
        config.optimization = {
          ...(config.optimization || {}),
          moduleIds: 'named',
          chunkIds: 'named',
        };
      }
    }
    return config;
  },
};

export default nextConfig;
