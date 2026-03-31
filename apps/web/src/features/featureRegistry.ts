/**
 * Feature Registry
 *
 * Centralizes all main page features and provides methods for registration,
 * lookup, and navigation configuration.
 */

import type { MainFeatureModule, SidebarItem } from '@xgen/types';
import { FeatureRegistry as CoreRegistry } from '@xgen/types';

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
    'workflow',
    'support',
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
   */
  getSidebarSections(): SidebarSection[] {
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

    // Convert to array and filter empty sections
    return this.sectionOrder
      .filter(sectionId => {
        const items = sectionMap.get(sectionId);
        return items && items.length > 0;
      })
      .map(sectionId => ({
        id: sectionId,
        titleKey: `sidebar.${sectionId}.title`,
        items: sectionMap.get(sectionId) || [],
      }));
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
    import('@xgen/feature-main-Dashboard'),
    import('@xgen/feature-main-ChatIntro'),
    import('@xgen/feature-main-ChatHistory'),
    import('@xgen/main-chat-new'),
    import('@xgen/main-chat-current'),

    // Workflow Section
    import('@xgen/main-workflow-intro'),
    import('@xgen/main-canvas-intro'),
    import('@xgen/main-workflow-management-orchestrator'),
    import('@xgen/main-documents'),
    import('@xgen/main-tool-storage'),
    import('@xgen/main-prompt-storage'),
    import('@xgen/main-auth-profile'),

    // Support Section
    import('@xgen/main-ServiceRequest'),
    import('@xgen/main-FAQ'),
  ]);

  // Register all features
  const features = featureModules.map(mod => mod.default || Object.values(mod)[0]);
  featureRegistry.registerAll(features as MainFeatureModule[]);

  // Register Workflow Tab Plugins (순서 = 탭 순서)
  const [
    wfStorageMod,
    wfStoreMod,
    wfSchedulerMod,
    wfTesterMod,
  ] = await Promise.all([
    import('@xgen/main-workflow-management-storage'),
    import('@xgen/main-workflow-management-store'),
    import('@xgen/main-workflow-management-scheduler'),
    import('@xgen/main-workflow-management-tester'),
  ]);

  CoreRegistry.registerWorkflowTabPlugin(wfStorageMod.workflowStoragePlugin);
  CoreRegistry.registerWorkflowTabPlugin(wfStoreMod.workflowStorePlugin);
  CoreRegistry.registerWorkflowTabPlugin(wfSchedulerMod.workflowSchedulerPlugin);
  CoreRegistry.registerWorkflowTabPlugin(wfTesterMod.workflowTesterPlugin);
}

export default featureRegistry;
