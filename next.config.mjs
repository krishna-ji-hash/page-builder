import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Avoid picking a parent folder when another package-lock.json exists above this project
  outputFileTracingRoot: path.join(__dirname),
  // Keep DOMPurify + jsdom as Node requires — avoids missing `.next/server/vendor-chunks/dompurify.js` after HMR.
  serverExternalPackages: ['isomorphic-dompurify', 'dompurify', 'jsdom'],
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
