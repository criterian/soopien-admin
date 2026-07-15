import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone', // smaller Coolify image
  reactStrictMode: true,
  // Pin the file-tracing root to this project. Without it Next walks up looking
  // for a lockfile and can pick a parent dir, which nests the standalone output
  // (standalone/<rel/path>/server.js) and breaks `CMD ["node", "server.js"]`.
  outputFileTracingRoot: process.cwd(),
};

export default config;
