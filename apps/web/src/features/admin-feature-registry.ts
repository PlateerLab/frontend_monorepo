/**
 * Admin Feature Registry
 *
 * Centralizes all admin page features. Follows the same pattern as
 * featureRegistry.ts but for /admin route features.
 * Feature 중심 동적 빌드 — 각 feature module이 sidebarItems를 선언.
 */

import type { AdminFeatureModule, SidebarItem, AdminSidebarSectionId } from '@xgen/types';
import { FeatureRegistry as CoreRegistry, hasPermission } from '@xgen/types';

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
// Admin Section → Required Permission Mapping
// 사이드바 섹션별 접근에 필요한 ABAC 권한
// ─────────────────────────────────────────────────────────────

const ADMIN_SECTION_PERMISSIONS: Record<string, string> = {
  'admin-user': 'admin.user:read',
  'admin-workflow': 'admin.workflow:read',
  'admin-setting': 'admin.system:read',
  'admin-system': 'admin.system:monitor',
  'admin-data': 'admin.database:read',
  'admin-mcp': 'admin.mcp:read',
  'admin-governance': 'admin.governance:manage',
};

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
    // ── 개별 import를 Promise.allSettled로 처리 ──
    // 하나의 feature import 실패가 전체를 죽이지 않도록 함
    const featureImports = [
      // 사용자 & 조직 (admin-user)
      import('@xgen/feature-admin-users'),
      import('@xgen/feature-admin-user-create'),
      import('@xgen/feature-admin-role-management'),
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
    ];

    const results = await Promise.allSettled(featureImports);
    const featureModules = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);

    // 실패한 import 로깅
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.warn(`[Admin] Feature import #${i} failed:`, r.reason);
      }
    });

    const features = featureModules.map(mod => mod.default || Object.values(mod)[0]);
    features.forEach(f => CoreRegistry.registerAdminFeature(f as AdminFeatureModule));

    // Gov Monitoring Tab Plugins
    const govResults = await Promise.allSettled([
      import('@xgen/feature-admin-gov-monitoring-history'),
      import('@xgen/feature-admin-gov-monitoring-plan'),
      import('@xgen/feature-admin-gov-monitoring-overdue'),
    ]);
    const [historyResult, planResult, overdueResult] = govResults;
    if (historyResult.status === 'fulfilled') CoreRegistry.registerGovMonitoringTabPlugin(historyResult.value.govMonitoringHistoryPlugin);
    if (planResult.status === 'fulfilled') CoreRegistry.registerGovMonitoringTabPlugin(planResult.value.govMonitoringPlanPlugin);
    if (overdueResult.status === 'fulfilled') CoreRegistry.registerGovMonitoringTabPlugin(overdueResult.value.govMonitoringOverduePlugin);
    govResults.forEach((r, i) => { if (r.status === 'rejected') console.warn(`[Admin] Gov monitoring plugin #${i} failed:`, r.reason); });

    // Workflow Management Tab Plugins
    const wfResults = await Promise.allSettled([
      import('@xgen/feature-admin-workflow-management-view'),
      import('@xgen/feature-admin-workflow-management-executor'),
      import('@xgen/feature-admin-workflow-management-monitoring'),
      import('@xgen/feature-admin-workflow-management-test'),
      import('@xgen/feature-admin-workflow-management-log'),
    ]);
    const wfPlugins = [
      { key: 'workflowMgmtViewPlugin', register: CoreRegistry.registerWorkflowMgmtTabPlugin.bind(CoreRegistry) },
      { key: 'workflowMgmtExecutorPlugin', register: CoreRegistry.registerWorkflowMgmtTabPlugin.bind(CoreRegistry) },
      { key: 'workflowMgmtMonitoringPlugin', register: CoreRegistry.registerWorkflowMgmtTabPlugin.bind(CoreRegistry) },
      { key: 'workflowMgmtTestPlugin', register: CoreRegistry.registerWorkflowMgmtTabPlugin.bind(CoreRegistry) },
      { key: 'workflowMgmtLogPlugin', register: CoreRegistry.registerWorkflowMgmtTabPlugin.bind(CoreRegistry) },
    ];
    wfResults.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        const plugin = r.value[wfPlugins[i].key];
        if (plugin) wfPlugins[i].register(plugin);
      } else {
        console.warn(`[Admin] Workflow plugin #${i} failed:`, r.reason);
      }
    });

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
 * 등록된 AdminFeatureModule들의 sidebarItems를 adminSection별로 그룹핑.
 * @param userPermissions 사용자 ABAC 권한 배열 — 섹션 필터링에 사용
 */
export function getAdminSidebarSections(userPermissions?: string[]): { id: string; titleKey: string; items: SidebarItem[] }[] {
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

  // 빈 섹션 필터링 + ABAC 권한 필터링 후 반환
  return ADMIN_SECTION_ORDER
    .filter(({ id }) => {
      const items = sectionMap.get(id);
      if (!items || items.length === 0) return false;

      // 권한 필터링: userPermissions가 제공되면 해당 섹션 권한 확인
      if (userPermissions) {
        const requiredPerm = ADMIN_SECTION_PERMISSIONS[id];
        if (requiredPerm && !hasPermission(userPermissions, requiredPerm)) {
          return false;
        }
      }

      return true;
    })
    .map(({ id, titleKey }) => ({
      id,
      titleKey,
      items: sectionMap.get(id) || [],
    }));
}
