import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    transpilePackages: [
        '@xgen/ui',
        '@xgen/i18n',
        '@xgen/icons',
        '@xgen/types',
    ],
};

export default nextConfig;
