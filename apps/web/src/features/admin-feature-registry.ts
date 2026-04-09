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
  { id: 'admin-agentflow', titleKey: 'admin.sidebar.sections.agentflow' },
  { id: 'admin-setting', titleKey: 'admin.sidebar.sections.setting' },
  { id: 'admin-system', titleKey: 'admin.sidebar.sections.system' },
  { id: 'admin-security', titleKey: 'admin.sidebar.sections.security' },
  { id: 'admin-data', titleKey: 'admin.sidebar.sections.data' },
  { id: 'admin-mcp', titleKey: 'admin.sidebar.sections.mcp' },
  { id: 'admin-ml', titleKey: 'admin.sidebar.sections.ml' },
  { id: 'admin-governance', titleKey: 'admin.sidebar.sections.governance' },
];

// ─────────────────────────────────────────────────────────────
// Admin Section → Permission Prefix Mapping
// 사이드바 섹션별 접근에 필요한 ABAC 권한 프리픽스 목록
// 유저가 해당 프리픽스 중 하나라도 시작하는 권한을 갖고 있으면 섹션 표시
// ─────────────────────────────────────────────────────────────

const ADMIN_SECTION_PERMISSION_PREFIXES: Record<string, string[]> = {
  'admin-user': ['admin.user:', 'admin.role:', 'admin.supervision:', 'admin.permission:'],
  'admin-agentflow': ['admin.workflow:', 'admin.prompt:', 'admin.user-token:', 'admin.node:'],
  'admin-setting': ['admin.system:read', 'admin.system:update', 'admin.system:config', 'admin.security:'],
  'admin-system': ['admin.system:monitor', 'admin.log:'],
  'admin-security': ['admin.log:', 'admin.security:', 'admin.audit:'],
  'admin-data': ['admin.database:', 'admin.storage:', 'admin.backup:'],
  'admin-mcp': ['admin.mcp:'],
  'admin-ml': ['admin.ml:'],
  'admin-governance': ['admin.governance', 'admin.monitoring:'],
};

/**
 * 사이드바 아이템별 권한 프리픽스 매핑.
 * 이 맵에 존재하는 아이템은 개별적으로 권한 필터링됨.
 * 존재하지 않으면 섹션 레벨 권한만 확인.
 */
const ADMIN_ITEM_PERMISSION_PREFIXES: Record<string, string[]> = {
  // 사용자 & 조직
  'admin-users': ['admin.user:'],
  'admin-user-create': ['admin.user:'],
  'admin-role-management': ['admin.role:', 'admin.supervision:', 'admin.permission:'],
  // 에이전트플로우 리소스
  'admin-agentflow-management': ['admin.workflow:'],
  'admin-chat-monitoring': ['admin.workflow:monitor'],
  'admin-user-token-dashboard': ['admin.user-token:'],
  'admin-node-management': ['admin.node:'],
  'admin-agentflow-store': ['admin.workflow:'],
  'admin-prompt-store': ['admin.prompt:'],
  // 환경 설정
  'admin-system-settings': ['admin.system:read', 'admin.system:update'],
  'admin-system-config': ['admin.system:config'],
  // 시스템 상태
  'admin-system-monitor': ['admin.system:monitor'],
  'admin-system-health': ['admin.system:monitor'],
  'admin-backend-logs': ['admin.log:'],
  // 데이터 관리
  'admin-database': ['admin.database:'],
  // MCP 관리
  'admin-mcp-market': ['admin.mcp:'],
  'admin-mcp-station': ['admin.mcp:'],
  // AI 거버넌스
  'admin-gov-risk-management': ['admin.governance-risk:', 'admin.governance-review:'],
  'admin-gov-monitoring': ['admin.monitoring:'],
  'admin-gov-control-policy': ['admin.governance-pii:', 'admin.governance-forbidden:', 'admin.governance-risk-policy:'],
  'admin-gov-audit-tracking': ['admin.governance:audit', 'admin.audit:'],
};

/**
 * 유저가 해당 섹션에 접근할 권한이 있는지 확인.
 * 유저 권한 중 해당 섹션의 프리픽스 목록과 하나라도 매칭되면 true.
 */
function hasAnySectionPermission(userPermissions: string[], sectionId: string): boolean {
  // '*:*' 와일드카드 보유 시 전체 접근
  if (userPermissions.includes('*:*')) return true;

  const prefixes = ADMIN_SECTION_PERMISSION_PREFIXES[sectionId];
  if (!prefixes) return true; // 매핑이 없으면 필터링 안 함

  return userPermissions.some(perm =>
    prefixes.some(prefix => perm.startsWith(prefix))
  );
}

/**
 * 개별 사이드바 아이템에 대한 권한 확인.
 * ADMIN_ITEM_PERMISSION_PREFIXES에 매핑이 있으면 해당 프리픽스로 확인,
 * 없으면 true (섹션 레벨 필터링에 위임).
 */
function hasItemPermission(userPermissions: string[], itemId: string): boolean {
  if (userPermissions.includes('*:*')) return true;

  const prefixes = ADMIN_ITEM_PERMISSION_PREFIXES[itemId];
  if (!prefixes) return true; // 매핑이 없으면 필터링 안 함

  return userPermissions.some(perm =>
    prefixes.some(prefix => perm.startsWith(prefix))
  );
}

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
      // 에이전트플로우 리소스 (admin-agentflow)
      import('@xgen/feature-admin-agentflow-management-orchestrator'),
      import('@xgen/feature-admin-chat-monitoring'),
      import('@xgen/feature-admin-user-token-dashboard'),
      import('@xgen/feature-admin-node-management'),
      import('@xgen/feature-admin-agentflow-store'),
      import('@xgen/feature-admin-prompt-store'),
      // 환경 설정 (admin-setting)
      import('@xgen/feature-admin-system-settings'),
      import('@xgen/feature-admin-system-config'),
      // 시스템 상태 (admin-system)
      import('@xgen/feature-admin-system-monitor'),
      import('@xgen/feature-admin-system-health'),
      import('@xgen/feature-admin-backend-logs'),
      // 보안 & 감사 (admin-security)
      import('@xgen/feature-admin-audit-logs'),
      import('@xgen/feature-admin-error-logs'),
      import('@xgen/feature-admin-security-settings'),
      // 데이터 관리 (admin-data)
      import('@xgen/feature-admin-database'),
      import('@xgen/feature-admin-backup'),
      import('@xgen/feature-admin-storage'),
      // MCP 관리 (admin-mcp)
      import('@xgen/feature-admin-mcp-market'),
      import('@xgen/feature-admin-mcp-station'),
      // ML 모델 관리 (admin-ml)
      import('@xgen/feature-admin-ml-model-control'),
      // AI 거버넌스 (admin-governance)
      import('@xgen/feature-admin-gov-risk-management'),
      import('@xgen/feature-admin-gov-monitoring-orchestrator'),
      import('@xgen/feature-admin-gov-control-policy'),
      import('@xgen/feature-admin-gov-audit-tracking'),
      import('@xgen/feature-admin-gov-agentflow-approval'),
      import('@xgen/feature-admin-gov-operation-history'),
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

    // Agentflow Management Tab Plugins
    const agentflowResults = await Promise.allSettled([
      import('@xgen/feature-admin-agentflow-management-view'),
      import('@xgen/feature-admin-agentflow-management-executor'),
      import('@xgen/feature-admin-agentflow-management-monitoring'),
      import('@xgen/feature-admin-agentflow-management-test'),
      import('@xgen/feature-admin-agentflow-management-log'),
    ]);
    const [viewResult, executorResult, monitoringResult, testResult, logResult] = agentflowResults;
    if (viewResult.status === 'fulfilled') CoreRegistry.registerAgentflowMgmtTabPlugin(viewResult.value.agentflowMgmtViewPlugin);
    if (executorResult.status === 'fulfilled') CoreRegistry.registerAgentflowMgmtTabPlugin(executorResult.value.agentflowMgmtExecutorPlugin);
    if (monitoringResult.status === 'fulfilled') CoreRegistry.registerAgentflowMgmtTabPlugin(monitoringResult.value.agentflowMgmtMonitoringPlugin);
    if (testResult.status === 'fulfilled') CoreRegistry.registerAgentflowMgmtTabPlugin(testResult.value.agentflowMgmtTestPlugin);
    if (logResult.status === 'fulfilled') CoreRegistry.registerAgentflowMgmtTabPlugin(logResult.value.agentflowMgmtLogPlugin);
    agentflowResults.forEach((r, i) => { if (r.status === 'rejected') console.warn(`[Admin] Agentflow mgmt plugin #${i} failed:`, r.reason); });

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
    .map(({ id, titleKey }) => {
      let items = sectionMap.get(id) || [];

      // 아이템별 권한 필터링: userPermissions가 제공되면 개별 아이템도 필터링
      if (userPermissions) {
        items = items.filter(item => hasItemPermission(userPermissions, item.id));
      }

      return { id, titleKey, items };
    })
    .filter(({ id, items }) => {
      if (items.length === 0) return false;

      // 섹션 레벨 권한 필터링
      if (userPermissions) {
        if (!hasAnySectionPermission(userPermissions, id)) {
          return false;
        }
      }

      return true;
    });
}
