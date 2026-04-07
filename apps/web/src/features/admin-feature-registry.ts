/**
 * Admin Feature Registry
 *
 * Centralizes all admin page features. Follows the same pattern as
 * featureRegistry.ts but for /admin route features.
 * Feature 중심 동적 빌드 — 각 feature module이 sidebarItems를 선언.
 */

import type { AdminFeatureModule, SidebarItem, AdminSidebarSectionId } from '@xgen/types';
import { FeatureRegistry as CoreRegistry } from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// Admin Section Order & Metadata
// getSidebarSections()에서 섹션 순서 및 titleKey 결정
// ─────────────────────────────────────────────────────────────

interface AdminSectionMeta {
  id: AdminSidebarSectionId;
  titleKey: string;
}

const ADMIN_SECTION_ORDER: AdminSectionMeta[] = [
  { id: 'admin-user', titleKey: 'admin.sidebar.sections.user' },
  { id: 'admin-workflow', titleKey: 'admin.sidebar.sections.workflow' },
  { id: 'admin-setting', titleKey: 'admin.sidebar.sections.setting' },
  { id: 'admin-system', titleKey: 'admin.sidebar.sections.system' },
  { id: 'admin-data', titleKey: 'admin.sidebar.sections.data' },
  { id: 'admin-mcp', titleKey: 'admin.sidebar.sections.mcp' },
  { id: 'admin-governance', titleKey: 'admin.sidebar.sections.governance' },
];

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
      import('@xgen/feature-admin-workflow-management-orchestrator'),
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

      // MCP 관리 (admin-mcp)
      import('@xgen/feature-admin-mcp-market'),
      import('@xgen/feature-admin-mcp-station'),
      // AI 거버넌스 (admin-governance) — xgen-frontend 원본 구조: 4개
      import('@xgen/feature-admin-gov-risk-management'),
      import('@xgen/feature-admin-gov-monitoring-orchestrator'),
      import('@xgen/feature-admin-gov-control-policy'),
      import('@xgen/feature-admin-gov-audit-tracking'),
    ]);

    const features = featureModules.map(mod => mod.default || Object.values(mod)[0]);
    features.forEach(f => CoreRegistry.registerAdminFeature(f as AdminFeatureModule));

    // Gov Monitoring Tab Plugins
    const [historyMod, planMod, overdueMod] = await Promise.all([
      import('@xgen/feature-admin-gov-monitoring-history'),
      import('@xgen/feature-admin-gov-monitoring-plan'),
      import('@xgen/feature-admin-gov-monitoring-overdue'),
    ]);
    CoreRegistry.registerGovMonitoringTabPlugin(historyMod.govMonitoringHistoryPlugin);
    CoreRegistry.registerGovMonitoringTabPlugin(planMod.govMonitoringPlanPlugin);
    CoreRegistry.registerGovMonitoringTabPlugin(overdueMod.govMonitoringOverduePlugin);

    // Workflow Management Tab Plugins
    const [viewMod, executorMod, monitoringMod, testMod, logMod] = await Promise.all([
      import('@xgen/feature-admin-workflow-management-view'),
      import('@xgen/feature-admin-workflow-management-executor'),
      import('@xgen/feature-admin-workflow-management-monitoring'),
      import('@xgen/feature-admin-workflow-management-test'),
      import('@xgen/feature-admin-workflow-management-log'),
    ]);
    CoreRegistry.registerWorkflowMgmtTabPlugin(viewMod.workflowMgmtViewPlugin);
    CoreRegistry.registerWorkflowMgmtTabPlugin(executorMod.workflowMgmtExecutorPlugin);
    CoreRegistry.registerWorkflowMgmtTabPlugin(monitoringMod.workflowMgmtMonitoringPlugin);
    CoreRegistry.registerWorkflowMgmtTabPlugin(testMod.workflowMgmtTestPlugin);
    CoreRegistry.registerWorkflowMgmtTabPlugin(logMod.workflowMgmtLogPlugin);

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

/**
 * Admin 사이드바 섹션을 Feature 기반으로 동적 빌드.
 * Main의 featureRegistry.getSidebarSections()와 동일한 패턴.
 * 등록된 AdminFeatureModule들의 sidebarItems를 adminSection별로 그룹핑.
 */
export function getAdminSidebarSections(): { id: string; titleKey: string; items: SidebarItem[] }[] {
  const sectionMap = new Map<string, SidebarItem[]>();

  // 섹션 순서대로 초기화
  ADMIN_SECTION_ORDER.forEach(({ id }) => {
    sectionMap.set(id, []);
  });

  // 등록된 feature들의 sidebarItems를 해당 섹션에 추가
  CoreRegistry.getAdminFeatures().forEach((feature) => {
    const items = sectionMap.get(feature.adminSection);
    if (items && feature.sidebarItems) {
      items.push(...feature.sidebarItems);
    }
  });

  // 빈 섹션 필터링 후 반환
  return ADMIN_SECTION_ORDER
    .filter(({ id }) => {
      const items = sectionMap.get(id);
      return items && items.length > 0;
    })
    .map(({ id, titleKey }) => ({
      id,
      titleKey,
      items: sectionMap.get(id) || [],
    }));
}
