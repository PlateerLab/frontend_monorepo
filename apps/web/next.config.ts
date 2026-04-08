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
        '@xgen/feature-main-dashboard',
        '@xgen/feature-main-chat-history',
        '@xgen/main-chat-new',
        '@xgen/main-chat-current',
        '@xgen/main-canvas-intro',
        '@xgen/main-agentflow-management-orchestrator',
        '@xgen/main-agentflow-management-storage',
        '@xgen/main-agentflow-management-store',
        '@xgen/main-agentflow-management-scheduler',
        '@xgen/main-agentflow-management-tester',
        '@xgen/main-document-management-orchestrator',
        '@xgen/main-document-management-collection',
        '@xgen/main-document-management-storage',
        '@xgen/main-document-management-repository',
        '@xgen/main-document-management-database',
        '@xgen/main-tool-storage',
        '@xgen/main-prompt-storage',
        '@xgen/main-auth-profile-orchestrator',
        '@xgen/main-auth-profile-storage',
        '@xgen/main-auth-profile-library',
        '@xgen/main-ServiceRequest',
        '@xgen/main-FAQ',
        '@xgen/canvas-types',
        '@xgen/canvas-layout',
        '@xgen/canvas-engine',
        '@xgen/feature-canvas-core',
        '@xgen/feature-canvas-header',
        '@xgen/feature-canvas-sidebar-nodes',
        '@xgen/feature-canvas-sidebar-templates',
        '@xgen/feature-canvas-sidebar-agentflows',
        '@xgen/feature-canvas-execution',
        '@xgen/feature-canvas-history',
        '@xgen/feature-canvas-ai-generator',
        '@xgen/feature-canvas-node-detail',
        '@xgen/feature-canvas-document-drop',
        '@xgen/feature-canvas-deploy',
        '@xgen/feature-deploy-settings',
        '@xgen/sidebar-main',
        '@xgen/sidebar-admin',
        // admin features (33 individual per-sidebar-item packages)
        '@xgen/feature-admin-users',
        '@xgen/feature-admin-user-create',
        '@xgen/feature-admin-workflow-management-orchestrator',
        '@xgen/feature-admin-workflow-management-view',
        '@xgen/feature-admin-workflow-management-executor',
        '@xgen/feature-admin-workflow-management-monitoring',
        '@xgen/feature-admin-workflow-management-test',
        '@xgen/feature-admin-workflow-management-log',
        '@xgen/feature-admin-chat-monitoring',
        '@xgen/feature-admin-user-token-dashboard',
        '@xgen/feature-admin-node-management',
        '@xgen/feature-admin-agentflow-store',
        '@xgen/feature-admin-prompt-store',
        '@xgen/feature-admin-system-settings',
        '@xgen/feature-admin-system-config',
        '@xgen/feature-admin-system-monitor',
        '@xgen/feature-admin-system-health',
        '@xgen/feature-admin-backend-logs',
        '@xgen/feature-admin-database',
        '@xgen/feature-admin-storage',
        '@xgen/feature-admin-backup',
        '@xgen/feature-admin-security-settings',
        '@xgen/feature-admin-audit-logs',
        '@xgen/feature-admin-error-logs',
        '@xgen/feature-admin-mcp-market',
        '@xgen/feature-admin-mcp-station',
        '@xgen/feature-admin-ml-model-control',
        '@xgen/feature-admin-gov-agentflow-approval',
        '@xgen/feature-admin-gov-risk-management',
        '@xgen/feature-admin-gov-monitoring',
        '@xgen/feature-admin-gov-control-policy',
        '@xgen/feature-admin-gov-operation-history',
        '@xgen/feature-admin-gov-audit-tracking',
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
