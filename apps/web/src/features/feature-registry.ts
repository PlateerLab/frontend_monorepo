/**
 * Feature Registry
 *
 * Centralizes all main page features and provides methods for registration,
 * lookup, and navigation configuration.
 */

import type { MainFeatureModule, SidebarItem } from '@xgen/types';
import { FeatureRegistry as CoreRegistry } from '@xgen/types';
import { registerCanvasPlugins } from './canvas-features-registry';

// ─────────────────────────────────────────────────────────────
// Main Section → Permission Prefix Mapping
// 사이드바 섹션별 접근에 필요한 ABAC 권한 프리픽스 목록
// chat 섹션은 모든 사용자에게 열려 있으므로 매핑하지 않음
// ─────────────────────────────────────────────────────────────

const MAIN_SECTION_PERMISSION_PREFIXES: Record<string, string[]> = {
  'dashboard': ['main.dashboard:'],
  'agentflow': [
    'main.agentflow:', 'main.agentflow-store:', 'main.agentflow-schedule:',
    'main.tool:', 'main.tool-store:',
    'main.prompt:', 'main.prompt-store:',
    'main.auth-profile:', 'main.auth-profile-store:',
  ],
  'knowledge': ['main.knowledge:', 'main.storage:', 'main.db-connection:'],
  'settings': ['main.settings:'],
  // 'chat' 은 권한 없이 모든 사용자 접근 가능
};

/**
 * 사이드바 아이템별 권한 프리픽스 매핑.
 * 이 맵에 존재하는 아이템은 개별적으로 권한 필터링됨.
 * 존재하지 않으면 섹션 레벨 권한만 확인.
 */
const MAIN_ITEM_PERMISSION_PREFIXES: Record<string, string[]> = {
  'main-dashboard': ['main.dashboard:'],
  'canvas-intro': ['main.agentflow:'],
  'agentflows': ['main.agentflow:', 'main.agentflow-store:', 'main.agentflow-schedule:'],
  'tool-storage': ['main.tool:', 'main.tool-store:'],
  'prompt-storage': ['main.prompt:', 'main.prompt-store:'],
  'auth-profile': ['main.auth-profile:', 'main.auth-profile-store:'],
  'documents': ['main.knowledge:', 'main.storage:', 'main.db-connection:'],
  'upload-history': ['main.knowledge:'],
};

/**
 * 탭 플러그인별 권한 프리픽스 매핑.
 * orchestratorType → tabId → 필요한 권한 프리픽스
 */
const MAIN_TAB_PERMISSION_PREFIXES: Record<string, Record<string, string[]>> = {
  agentflow: {
    'storage': ['main.agentflow:'],
    'store': ['main.agentflow-store:'],
    'scheduler': ['main.agentflow-schedule:'],
    'tester': ['main.agentflow:'],
  },
  document: {
    'collection': ['main.knowledge:'],
    'storage': ['main.storage:'],
    'database': ['main.db-connection:'],
  },
  tool: {
    'storage': ['main.tool:'],
    'library': ['main.tool-store:'],
  },
  prompt: {
    'storage': ['main.prompt:'],
    'library': ['main.prompt-store:'],
  },
  'auth-profile': {
    'storage': ['main.auth-profile:'],
    'library': ['main.auth-profile-store:'],
  },
};

/**
 * 유저가 해당 메인 섹션에 접근할 권한이 있는지 확인.
 */
function hasAnyMainSectionPermission(userPermissions: string[], sectionId: string): boolean {
  if (userPermissions.includes('*:*')) return true;

  const prefixes = MAIN_SECTION_PERMISSION_PREFIXES[sectionId];
  if (!prefixes) return true; // 매핑이 없으면 필터링 안 함 (chat 등)

  return userPermissions.some(perm =>
    prefixes.some(prefix => perm.startsWith(prefix))
  );
}

/**
 * 개별 사이드바 아이템에 대한 권한 확인.
 */
function hasMainItemPermission(userPermissions: string[], itemId: string): boolean {
  if (userPermissions.includes('*:*')) return true;

  const prefixes = MAIN_ITEM_PERMISSION_PREFIXES[itemId];
  if (!prefixes) return true; // 매핑이 없으면 필터링 안 함

  return userPermissions.some(perm =>
    prefixes.some(prefix => perm.startsWith(prefix))
  );
}

/**
 * 탭 플러그인을 권한에 따라 필터링.
 * orchestratorType에 해당하는 탭 권한 매핑을 사용해 접근 가능한 탭만 반환.
 */
export function filterTabPlugins<T extends { id: string }>(
  plugins: T[],
  orchestratorType: string,
  userPermissions?: string[],
): T[] {
  if (!userPermissions) return plugins;
  if (userPermissions.includes('*:*')) return plugins;

  const tabMap = MAIN_TAB_PERMISSION_PREFIXES[orchestratorType];
  if (!tabMap) return plugins;

  return plugins.filter(plugin => {
    const prefixes = tabMap[plugin.id];
    if (!prefixes) return true;
    return userPermissions.some(perm =>
      prefixes.some(prefix => perm.startsWith(prefix))
    );
  });
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface FeatureRegistryConfig {
  features: MainFeatureModule[];
}

export interface SidebarSection {
  id: string;
  titleKey: string;
  items: SidebarItem[];
}

export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  featureId: string;
  requiresAuth: boolean;
}

// ─────────────────────────────────────────────────────────────
// Feature Registry Class
// ─────────────────────────────────────────────────────────────

class FeatureRegistry {
  private features: Map<string, MainFeatureModule> = new Map();
  private sectionOrder: string[] = [
    'dashboard',
    'chat',
    'agentflow',
    'knowledge',
    'settings',
  ];

  /**
   * Register a single feature module
   */
  register(feature: MainFeatureModule): void {
    this.features.set(feature.id, feature);
  }

  /**
   * Register multiple feature modules at once
   */
  registerAll(features: MainFeatureModule[]): void {
    features.forEach(feature => this.register(feature));
  }

  /**
   * Get a feature by its ID
   */
  getFeature(id: string): MainFeatureModule | undefined {
    return this.features.get(id);
  }

  /**
   * Get all registered features
   */
  getAllFeatures(): MainFeatureModule[] {
    return Array.from(this.features.values());
  }

  /**
   * Get sidebar sections organized by section ID
   * @param userPermissions 사용자 ABAC 권한 배열 — 섹션 필터링에 사용 (undefined면 필터링 안 함)
   */
  getSidebarSections(userPermissions?: string[]): SidebarSection[] {
    const sectionMap = new Map<string, SidebarItem[]>();

    // Initialize sections in order
    this.sectionOrder.forEach(sectionId => {
      sectionMap.set(sectionId, []);
    });

    // Populate sections with items from features
    this.features.forEach(feature => {
      const sectionItems = sectionMap.get(feature.sidebarSection);
      if (sectionItems && feature.sidebarItems) {
        sectionItems.push(...feature.sidebarItems);
      }
    });

    // Convert to array and filter empty sections + ABAC 권한 필터링
    return this.sectionOrder
      .filter(sectionId => {
        const items = sectionMap.get(sectionId);
        if (!items || items.length === 0) return false;

        // 섹션 레벨 권한 필터링
        if (userPermissions) {
          if (!hasAnyMainSectionPermission(userPermissions, sectionId)) {
            return false;
          }
        }

        return true;
      })
      .map(sectionId => {
        let items = sectionMap.get(sectionId) || [];

        // 아이템별 권한 필터링
        if (userPermissions) {
          items = items.filter(item => hasMainItemPermission(userPermissions, item.id));
        }

        return {
          id: sectionId,
          titleKey: `sidebar.${sectionId}.title`,
          items,
        };
      })
      .filter(section => section.items.length > 0);
  }

  /**
   * Get all route configurations from registered features
   */
  getRoutes(): RouteConfig[] {
    const routes: RouteConfig[] = [];

    this.features.forEach(feature => {
      Object.entries(feature.routes).forEach(([path, component]) => {
        routes.push({
          path,
          component,
          featureId: feature.id,
          requiresAuth: feature.requiresAuth,
        });
      });
    });

    return routes;
  }

  /**
   * Find a route component by path
   */
  getRouteComponent(path: string): React.ComponentType<any> | undefined {
    for (const feature of this.features.values()) {
      if (feature.routes[path]) {
        return feature.routes[path];
      }
    }
    return undefined;
  }

  /**
   * Find feature by sidebar item ID
   */
  getFeatureBySidebarItem(itemId: string): MainFeatureModule | undefined {
    for (const feature of this.features.values()) {
      if (feature.sidebarItems?.some(item => item.id === itemId)) {
        return feature;
      }
    }
    return undefined;
  }

  /**
   * Clear all registered features
   */
  clear(): void {
    this.features.clear();
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton Instance
// ─────────────────────────────────────────────────────────────

export const featureRegistry = new FeatureRegistry();

// ─────────────────────────────────────────────────────────────
// Feature Registration Helper
// ─────────────────────────────────────────────────────────────

/**
 * Initialize the feature registry with all main page features
 */
export async function initializeFeatures(): Promise<void> {
  // Dynamic imports for all feature modules
  const featureModules = await Promise.all([
    // Chat Section
    import('@xgen/feature-main-dashboard'),
    import('@xgen/main-chat-new'),
    import('@xgen/main-chat-current'),
    import('@xgen/feature-main-chat-history'),

    // Agentflow Section
    import('@xgen/main-canvas-intro'),
    import('@xgen/main-agentflow-management-orchestrator'),
    import('@xgen/main-tool-management-orchestrator'),
    import('@xgen/main-prompt-management-orchestrator'),
    import('@xgen/main-auth-profile-orchestrator'),

    // Knowledge Section
    import('@xgen/main-document-management-orchestrator'),
    import('@xgen/main-upload-history'),

  ]);

  // Register all features
  const features = featureModules.map(mod => mod.default || Object.values(mod)[0]);
  featureRegistry.registerAll(features as MainFeatureModule[]);

  // Register Agentflow Tab Plugins (순서 = 탭 순서)
  const [
    afStorageMod,
    afStoreMod,
    afSchedulerMod,
    afTesterMod,
  ] = await Promise.all([
    import('@xgen/main-agentflow-management-storage'),
    import('@xgen/main-agentflow-management-store'),
    import('@xgen/main-agentflow-management-scheduler'),
    import('@xgen/main-agentflow-management-tester'),
  ]);

  CoreRegistry.registerAgentflowTabPlugin(afStorageMod.agentflowStoragePlugin);
  CoreRegistry.registerAgentflowTabPlugin(afStoreMod.agentflowStorePlugin);
  CoreRegistry.registerAgentflowTabPlugin(afSchedulerMod.agentflowSchedulerPlugin);
  CoreRegistry.registerAgentflowTabPlugin(afTesterMod.agentflowTesterPlugin);

  // Register Document Tab Plugins (순서 = 탭 순서)
  const [
    docCollectionMod,
    docStorageMod,
    docDatabaseMod,
  ] = await Promise.all([
    import('@xgen/main-document-management-collection'),
    import('@xgen/main-document-management-storage'),
    import('@xgen/main-document-management-database'),
  ]);

  CoreRegistry.registerDocumentTabPlugin(docCollectionMod.documentCollectionPlugin);
  CoreRegistry.registerDocumentTabPlugin(docStorageMod.documentStoragePlugin);
  CoreRegistry.registerDocumentTabPlugin(docDatabaseMod.documentDatabasePlugin);

  // Register Tool Tab Plugins (순서 = 탭 순서)
  const [
    toolStorageMod,
    toolLibraryMod,
  ] = await Promise.all([
    import('@xgen/main-tool-management-storage'),
    import('@xgen/main-tool-management-library'),
  ]);

  CoreRegistry.registerToolTabPlugin(toolStorageMod.toolStoragePlugin);
  CoreRegistry.registerToolTabPlugin(toolLibraryMod.toolLibraryPlugin);

  // Register Prompt Tab Plugins (순서 = 탭 순서)
  const [
    promptStorageMod,
    promptLibraryMod,
  ] = await Promise.all([
    import('@xgen/main-prompt-management-storage'),
    import('@xgen/main-prompt-management-library'),
  ]);

  CoreRegistry.registerPromptTabPlugin(promptStorageMod.promptStoragePlugin);
  CoreRegistry.registerPromptTabPlugin(promptLibraryMod.promptLibraryPlugin);

  // Register Auth Profile Tab Plugins (순서 = 탭 순서)
  const [
    authProfileStorageMod,
    authProfileLibraryMod,
  ] = await Promise.all([
    import('@xgen/main-auth-profile-storage'),
    import('@xgen/main-auth-profile-library'),
  ]);

  CoreRegistry.registerAuthProfileTabPlugin(authProfileStorageMod.authProfileStoragePlugin);
  CoreRegistry.registerAuthProfileTabPlugin(authProfileLibraryMod.authProfileLibraryPlugin);

  // Register Canvas Page Plugins
  registerCanvasPlugins();

  // 탭 권한 맵을 CoreRegistry에 주입하여 각 Orchestrator에서 사용
  CoreRegistry.setMainTabPermissionMap(MAIN_TAB_PERMISSION_PREFIXES);
}

export default featureRegistry;
