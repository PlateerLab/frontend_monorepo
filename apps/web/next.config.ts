import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@xgen/types',
    '@xgen/i18n',
    '@xgen/ui',
    '@xgen/utils',
    '@xgen/icons',
    '@xgen/api-client',
    '@xgen/auth-provider',
    '@xgen/config',
    '@xgen/styles',
  ],
  experimental: {
    optimizePackageImports: ['@xgen/icons', '@xgen/ui'],
  },
};

export default nextConfig;
