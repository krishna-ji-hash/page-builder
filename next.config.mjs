import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Avoid picking a parent folder when another package-lock.json exists above this project
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // Work around unstable dev segment explorer manifest errors in Next 15.x
    devtoolSegmentExplorer: false,
  },
};

export default nextConfig;
