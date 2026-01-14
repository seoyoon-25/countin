/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@countin/ui', '@countin/utils', '@countin/types'],
  experimental: {
    optimizePackageImports: ['@countin/ui'],
  },
};

module.exports = nextConfig;
