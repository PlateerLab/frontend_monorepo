import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    sassOptions: {
        includePaths: [
            path.join(__dirname, '../../packages/ui/src/styles'),
            path.join(__dirname, '../../packages'),
            path.join(__dirname, '../../node_modules'),
        ],
    },
    transpilePackages: [
        '@xgen/ui',
        '@xgen/i18n',
        '@xgen/icons',
        '@xgen/types',
        '@xgen/config',
        '@xgen/api-client',
        '@xgen/auth-provider',
        '@xgen/feature-main-Dashboard',
        '@xgen/feature-main-ChatIntro',
        '@xgen/feature-main-ChatHistory',
        '@xgen/main-chat-new',
        '@xgen/main-chat-current',
        '@xgen/main-workflow-intro',
        '@xgen/main-canvas-intro',
        '@xgen/main-workflow-management-orchestrator',
        '@xgen/main-workflow-management-storage',
        '@xgen/main-workflow-management-store',
        '@xgen/main-workflow-management-scheduler',
        '@xgen/main-workflow-management-tester',
        '@xgen/main-documents',
        '@xgen/main-tool-storage',
        '@xgen/main-prompt-storage',
        '@xgen/main-auth-profile',
        '@xgen/main-ServiceRequest',
        '@xgen/main-FAQ',
    ],
};

export default nextConfig;
