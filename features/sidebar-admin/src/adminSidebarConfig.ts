import type { SidebarSection } from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// Admin Sidebar Section Configuration
// xgen-frontend의 adminSidebarConfig.ts 기반 — 모노레포 구조에 맞게 재정의
// item.id가 AdminFeatureModule의 routes key와 1:1 매칭
// ─────────────────────────────────────────────────────────────

export interface AdminSidebarSectionConfig {
  id: string;
  titleKey: string;
  items: {
    id: string;
    titleKey: string;
    descriptionKey?: string;
  }[];
}

/**
 * Admin 사이드바의 9개 섹션 정의.
 * i18n 키만 포함 — 실제 번역은 컴포넌트에서 t() 사용.
 * item.id는 각 AdminFeatureModule의 routes key와 정확히 일치해야 한다.
 */
export const adminSidebarConfig: AdminSidebarSectionConfig[] = [
  // ── 1. 사용자 & 조직 ──
  {
    id: 'admin-user',
    titleKey: 'admin.sidebar.sections.user',
    items: [
      { id: 'admin-users', titleKey: 'admin.sidebar.user.users.title', descriptionKey: 'admin.sidebar.user.users.description' },
      { id: 'admin-user-create', titleKey: 'admin.sidebar.user.userCreate.title', descriptionKey: 'admin.sidebar.user.userCreate.description' },
      { id: 'admin-group-permissions', titleKey: 'admin.sidebar.user.groupPermissions.title', descriptionKey: 'admin.sidebar.user.groupPermissions.description' },
    ],
  },
  // ── 2. 워크플로우 리소스 ──
  {
    id: 'admin-workflow',
    titleKey: 'admin.sidebar.sections.workflow',
    items: [
      { id: 'admin-workflow-management', titleKey: 'admin.sidebar.workflow.workflowManagement.title', descriptionKey: 'admin.sidebar.workflow.workflowManagement.description' },
      { id: 'admin-workflow-monitoring', titleKey: 'admin.sidebar.workflow.workflowMonitoring.title', descriptionKey: 'admin.sidebar.workflow.workflowMonitoring.description' },
      { id: 'admin-test-monitoring', titleKey: 'admin.sidebar.workflow.testMonitoring.title', descriptionKey: 'admin.sidebar.workflow.testMonitoring.description' },
      { id: 'admin-agent-traces', titleKey: 'admin.sidebar.workflow.agentTraces.title', descriptionKey: 'admin.sidebar.workflow.agentTraces.description' },
      { id: 'admin-chat-monitoring', titleKey: 'admin.sidebar.workflow.chatMonitoring.title', descriptionKey: 'admin.sidebar.workflow.chatMonitoring.description' },
      { id: 'admin-user-token-dashboard', titleKey: 'admin.sidebar.workflow.userTokenDashboard.title', descriptionKey: 'admin.sidebar.workflow.userTokenDashboard.description' },
      { id: 'admin-node-management', titleKey: 'admin.sidebar.workflow.nodeManagement.title', descriptionKey: 'admin.sidebar.workflow.nodeManagement.description' },
      { id: 'admin-workflow-store', titleKey: 'admin.sidebar.workflow.workflowStore.title', descriptionKey: 'admin.sidebar.workflow.workflowStore.description' },
      { id: 'admin-prompt-store', titleKey: 'admin.sidebar.workflow.promptStore.title', descriptionKey: 'admin.sidebar.workflow.promptStore.description' },
    ],
  },
  // ── 3. 환경 설정 ──
  {
    id: 'admin-setting',
    titleKey: 'admin.sidebar.sections.setting',
    items: [
      { id: 'admin-system-settings', titleKey: 'admin.sidebar.setting.systemSettings.title', descriptionKey: 'admin.sidebar.setting.systemSettings.description' },
      { id: 'admin-system-config', titleKey: 'admin.sidebar.setting.systemConfig.title', descriptionKey: 'admin.sidebar.setting.systemConfig.description' },
    ],
  },
  // ── 4. 시스템 상태 ──
  {
    id: 'admin-system',
    titleKey: 'admin.sidebar.sections.system',
    items: [
      { id: 'admin-system-monitor', titleKey: 'admin.sidebar.system.systemMonitor.title', descriptionKey: 'admin.sidebar.system.systemMonitor.description' },
      { id: 'admin-system-health', titleKey: 'admin.sidebar.system.systemHealth.title', descriptionKey: 'admin.sidebar.system.systemHealth.description' },
      { id: 'admin-backend-logs', titleKey: 'admin.sidebar.system.backendLogs.title', descriptionKey: 'admin.sidebar.system.backendLogs.description' },
    ],
  },
  // ── 5. 데이터 관리 ──
  {
    id: 'admin-data',
    titleKey: 'admin.sidebar.sections.data',
    items: [
      { id: 'admin-database', titleKey: 'admin.sidebar.data.database.title', descriptionKey: 'admin.sidebar.data.database.description' },
      { id: 'admin-data-scraper', titleKey: 'admin.sidebar.data.dataScraper.title', descriptionKey: 'admin.sidebar.data.dataScraper.description' },
      { id: 'admin-storage', titleKey: 'admin.sidebar.data.storage.title', descriptionKey: 'admin.sidebar.data.storage.description' },
      { id: 'admin-backup', titleKey: 'admin.sidebar.data.backup.title', descriptionKey: 'admin.sidebar.data.backup.description' },
    ],
  },
  // ── 6. 보안 & 감사 ──
  {
    id: 'admin-security',
    titleKey: 'admin.sidebar.sections.security',
    items: [
      { id: 'admin-security-settings', titleKey: 'admin.sidebar.security.securitySettings.title', descriptionKey: 'admin.sidebar.security.securitySettings.description' },
      { id: 'admin-audit-logs', titleKey: 'admin.sidebar.security.auditLogs.title', descriptionKey: 'admin.sidebar.security.auditLogs.description' },
      { id: 'admin-error-logs', titleKey: 'admin.sidebar.security.errorLogs.title', descriptionKey: 'admin.sidebar.security.errorLogs.description' },
    ],
  },
  // ── 7. MCP 관리 ──
  {
    id: 'admin-mcp',
    titleKey: 'admin.sidebar.sections.mcp',
    items: [
      { id: 'admin-mcp-market', titleKey: 'admin.sidebar.mcp.mcpMarket.title', descriptionKey: 'admin.sidebar.mcp.mcpMarket.description' },
      { id: 'admin-mcp-station', titleKey: 'admin.sidebar.mcp.mcpStation.title', descriptionKey: 'admin.sidebar.mcp.mcpStation.description' },
    ],
  },
  // ── 8. MLOps ──
  {
    id: 'admin-ml',
    titleKey: 'admin.sidebar.sections.ml',
    items: [
      { id: 'admin-ml-model-control', titleKey: 'admin.sidebar.ml.mlModelControl.title', descriptionKey: 'admin.sidebar.ml.mlModelControl.description' },
    ],
  },
  // ── 9. AI 거버넌스 ──
  {
    id: 'admin-governance',
    titleKey: 'admin.sidebar.sections.governance',
    items: [
      { id: 'admin-gov-workflow-approval', titleKey: 'admin.sidebar.governance.workflowApproval.title', descriptionKey: 'admin.sidebar.governance.workflowApproval.description' },
      { id: 'admin-gov-risk-management', titleKey: 'admin.sidebar.governance.riskManagement.title', descriptionKey: 'admin.sidebar.governance.riskManagement.description' },
      { id: 'admin-gov-monitoring', titleKey: 'admin.sidebar.governance.monitoring.title', descriptionKey: 'admin.sidebar.governance.monitoring.description' },
      { id: 'admin-gov-control-policy', titleKey: 'admin.sidebar.governance.controlPolicy.title', descriptionKey: 'admin.sidebar.governance.controlPolicy.description' },
      { id: 'admin-gov-operation-history', titleKey: 'admin.sidebar.governance.operationHistory.title', descriptionKey: 'admin.sidebar.governance.operationHistory.description' },
      { id: 'admin-gov-audit-tracking', titleKey: 'admin.sidebar.governance.auditTracking.title', descriptionKey: 'admin.sidebar.governance.auditTracking.description' },
    ],
  },
];

/** Helper: AdminSidebarSectionConfig → SidebarSection (for @xgen/ui) */
export function toSidebarSections(configs: AdminSidebarSectionConfig[]): SidebarSection[] {
  return configs.map((cfg) => ({
    id: cfg.id,
    titleKey: cfg.titleKey,
    items: cfg.items.map((item) => ({
      id: item.id,
      titleKey: item.titleKey,
      descriptionKey: item.descriptionKey,
    })),
  }));
}
