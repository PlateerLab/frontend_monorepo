import type { SidebarSection } from '@xgen/types';

// ─────────────────────────────────────────────────────────────
// Admin Sidebar Section Configuration
// 원본 xgen-frontend의 adminSidebarConfig.ts 기반
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
 */
export const adminSidebarConfig: AdminSidebarSectionConfig[] = [
  {
    id: 'admin-user',
    titleKey: 'admin.sidebar.sections.user',
    items: [
      { id: 'admin-users', titleKey: 'admin.sidebar.users' },
      { id: 'admin-organizations', titleKey: 'admin.sidebar.organizations' },
      { id: 'admin-roles', titleKey: 'admin.sidebar.roles' },
    ],
  },
  {
    id: 'admin-workflow',
    titleKey: 'admin.sidebar.sections.workflow',
    items: [
      { id: 'admin-workflow-templates', titleKey: 'admin.sidebar.workflowTemplates' },
      { id: 'admin-agents', titleKey: 'admin.sidebar.agents' },
      { id: 'admin-tools', titleKey: 'admin.sidebar.tools' },
      { id: 'admin-prompts', titleKey: 'admin.sidebar.prompts' },
    ],
  },
  {
    id: 'admin-setting',
    titleKey: 'admin.sidebar.sections.setting',
    items: [
      { id: 'admin-general', titleKey: 'admin.sidebar.general' },
      { id: 'admin-auth', titleKey: 'admin.sidebar.auth' },
      { id: 'admin-notifications', titleKey: 'admin.sidebar.notifications' },
    ],
  },
  {
    id: 'admin-system',
    titleKey: 'admin.sidebar.sections.system',
    items: [
      { id: 'admin-system-status', titleKey: 'admin.sidebar.systemStatus' },
      { id: 'admin-logs', titleKey: 'admin.sidebar.logs' },
      { id: 'admin-resources', titleKey: 'admin.sidebar.resources' },
    ],
  },
  {
    id: 'admin-data',
    titleKey: 'admin.sidebar.sections.data',
    items: [
      { id: 'admin-data-sources', titleKey: 'admin.sidebar.dataSources' },
      { id: 'admin-backups', titleKey: 'admin.sidebar.backups' },
    ],
  },
  {
    id: 'admin-security',
    titleKey: 'admin.sidebar.sections.security',
    items: [
      { id: 'admin-access-control', titleKey: 'admin.sidebar.accessControl' },
      { id: 'admin-audit-log', titleKey: 'admin.sidebar.auditLog' },
    ],
  },
  {
    id: 'admin-mcp',
    titleKey: 'admin.sidebar.sections.mcp',
    items: [
      { id: 'admin-mcp-servers', titleKey: 'admin.sidebar.mcpServers' },
      { id: 'admin-mcp-connections', titleKey: 'admin.sidebar.mcpConnections' },
    ],
  },
  {
    id: 'admin-ml',
    titleKey: 'admin.sidebar.sections.ml',
    items: [
      { id: 'admin-models', titleKey: 'admin.sidebar.models' },
      { id: 'admin-training', titleKey: 'admin.sidebar.training' },
      { id: 'admin-inference', titleKey: 'admin.sidebar.inference' },
    ],
  },
  {
    id: 'admin-governance',
    titleKey: 'admin.sidebar.sections.governance',
    items: [
      { id: 'admin-policies', titleKey: 'admin.sidebar.policies' },
      { id: 'admin-compliance', titleKey: 'admin.sidebar.compliance' },
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
