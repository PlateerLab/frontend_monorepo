/**
 * Feature Module Types
 *
 * Re-exports feature types for convenience and adds app-specific extensions.
 */

export type { MainFeatureModule, SidebarItem, RouteComponentProps } from '@xgen/types';
export { featureRegistry, initializeFeatures } from './feature-registry';
export type { SidebarSection, RouteConfig, FeatureRegistryConfig } from './feature-registry';
