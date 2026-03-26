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
        '@xgen/main-workflow-management',
        '@xgen/main-workflow-storage',
        '@xgen/main-workflow-store',
        '@xgen/main-workflow-scheduler',
        '@xgen/main-workflow-tester',
        '@xgen/main-documents',
        '@xgen/main-tool-storage',
        '@xgen/main-prompt-storage',
        '@xgen/main-auth-profile',
        '@xgen/main-ModelIntro',
        '@xgen/main-ModelTrain',
        '@xgen/main-ModelEval',
        '@xgen/main-ModelStorage',
        '@xgen/main-ModelMetrics',
        '@xgen/main-MlModelIntro',
        '@xgen/main-MlTrain',
        '@xgen/main-MlModelHub',
        '@xgen/main-DataIntro',
        '@xgen/main-DataStation',
        '@xgen/main-DataStorage',
        '@xgen/main-ServiceRequest',
        '@xgen/main-FAQ',
    ],
};

export default nextConfig;
