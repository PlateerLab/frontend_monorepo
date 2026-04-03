/**
 * Admin Feature Registry
 *
 * Centralizes all admin page features. Follows the same pattern as
 * featureRegistry.ts but for /admin route features.
 */

import type { AdminFeatureModule } from '@xgen/types';
import { FeatureRegistry as CoreRegistry } from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// Admin Feature Initialization
// ─────────────────────────────────────────────────────────────

let adminInitialized = false;

/**
 * Initialize admin features by dynamically importing all admin feature modules
 * and registering them with the CoreRegistry.
 */
export async function initializeAdminFeatures(): Promise<void> {
  if (adminInitialized) return;

  try {
    const featureModules = await Promise.all([
      // 사용자 & 조직 (admin-user)
      import('@xgen/feature-admin-users'),
      import('@xgen/feature-admin-user-create'),
      import('@xgen/feature-admin-group-permissions'),
      // 워크플로우 리소스 (admin-workflow)
      import('@xgen/feature-admin-workflow-management'),
      import('@xgen/feature-admin-workflow-monitoring'),
      import('@xgen/feature-admin-test-monitoring'),
      import('@xgen/feature-admin-agent-traces'),
      import('@xgen/feature-admin-chat-monitoring'),
      import('@xgen/feature-admin-user-token-dashboard'),
      import('@xgen/feature-admin-node-management'),
      import('@xgen/feature-admin-workflow-store'),
      import('@xgen/feature-admin-prompt-store'),
      // 환경 설정 (admin-setting)
      import('@xgen/feature-admin-system-settings'),
      import('@xgen/feature-admin-system-config'),
      // 시스템 상태 (admin-system)
      import('@xgen/feature-admin-system-monitor'),
      import('@xgen/feature-admin-system-health'),
      import('@xgen/feature-admin-backend-logs'),
      // 데이터 관리 (admin-data)
      import('@xgen/feature-admin-database'),
      import('@xgen/feature-admin-data-scraper'),
      import('@xgen/feature-admin-storage'),
      import('@xgen/feature-admin-backup'),
      // 보안 & 감사 (admin-security)
      import('@xgen/feature-admin-security-settings'),
      import('@xgen/feature-admin-audit-logs'),
      import('@xgen/feature-admin-error-logs'),
      // MCP 관리 (admin-mcp)
      import('@xgen/feature-admin-mcp-market'),
      import('@xgen/feature-admin-mcp-station'),
      // MLOps (admin-ml)
      import('@xgen/feature-admin-ml-model-control'),
      // AI 거버넌스 (admin-governance)
      import('@xgen/feature-admin-gov-workflow-approval'),
      import('@xgen/feature-admin-gov-risk-management'),
      import('@xgen/feature-admin-gov-monitoring'),
      import('@xgen/feature-admin-gov-control-policy'),
      import('@xgen/feature-admin-gov-operation-history'),
      import('@xgen/feature-admin-gov-audit-tracking'),
    ]);

    const features = featureModules.map(mod => mod.default || Object.values(mod)[0]);
    features.forEach(f => CoreRegistry.registerAdminFeature(f as AdminFeatureModule));

    adminInitialized = true;
  } catch (error) {
    console.error('[Admin] Failed to initialize admin features:', error);
    // 초기화 실패해도 adminInitialized를 true로 설정하여 무한 재시도 방지
    adminInitialized = true;
  }
}

/**
 * Get route component for a given admin sidebar item ID.
 * Delegates to CoreRegistry.
 */
export function getAdminRouteComponent(itemId: string) {
  return CoreRegistry.getAdminRouteComponent(itemId);
}
