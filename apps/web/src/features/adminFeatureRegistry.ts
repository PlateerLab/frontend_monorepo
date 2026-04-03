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
      // 사용자 & 조직
      import('@xgen/feature-admin-UserOrg'),
      // 워크플로우 리소스
      import('@xgen/feature-admin-WorkflowResource'),
      // 환경 설정
      import('@xgen/feature-admin-Setting'),
      // 시스템 상태
      import('@xgen/feature-admin-System'),
      // 데이터 관리
      import('@xgen/feature-admin-Data'),
      // 보안 & 감사
      import('@xgen/feature-admin-Security'),
      // MCP 관리
      import('@xgen/feature-admin-MCP'),
      // MLOps
      import('@xgen/feature-admin-MLOps'),
      // AI 거버넌스
      import('@xgen/feature-admin-Governance'),
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
