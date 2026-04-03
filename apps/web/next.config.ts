import type { NextConfig } from 'next';
import path from 'path';

// K3s/Istio 환경 여부 확인 (Istio가 라우팅하므로 rewrites 불필요)
const isK3sEnv = process.env.K3S_ENV === 'true';

const nextConfig: NextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    experimental: {
        proxyTimeout: 600000,
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
        '@xgen/canvas-types',
        '@xgen/canvas-layout',
        '@xgen/canvas-engine',
        '@xgen/feature-canvas-core',
        '@xgen/feature-canvas-header',
        '@xgen/feature-canvas-sidebar-nodes',
        '@xgen/feature-canvas-sidebar-templates',
        '@xgen/feature-canvas-sidebar-workflows',
        '@xgen/feature-canvas-execution',
        '@xgen/feature-canvas-history',
        '@xgen/feature-canvas-ai-generator',
        '@xgen/feature-canvas-node-detail',
        '@xgen/feature-canvas-document-drop',
        '@xgen/sidebar-main',
        '@xgen/sidebar-admin',
        '@xgen/feature-admin-UserOrg',
        '@xgen/feature-admin-WorkflowResource',
        '@xgen/feature-admin-Setting',
        '@xgen/feature-admin-System',
        '@xgen/feature-admin-Data',
        '@xgen/feature-admin-Security',
        '@xgen/feature-admin-MCP',
        '@xgen/feature-admin-MLOps',
        '@xgen/feature-admin-Governance',
    ],
    // Docker/로컬 환경용 API 프록시 (원본 xgen-frontend과 동일한 구조)
    // K3s 환경에서는 Istio VirtualService가 라우팅하므로 rewrites 비활성화
    async rewrites() {
        if (isK3sEnv) {
            return [];
        }

        const host_url =
            process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost';
        const port = process.env.NEXT_PUBLIC_BACKEND_PORT ?? '8000';

        let BASE_URL = '';
        const hasPortInHost = /:\d+$/.test(host_url.replace(/\/$/, ''));
        if (!port || hasPortInHost) {
            BASE_URL = host_url.replace(/\/$/, '');
        } else {
            BASE_URL = `${host_url.replace(/\/$/, '')}:${port}`;
        }

        return [
            {
                source: '/api/:path*',
                destination: `${BASE_URL}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
