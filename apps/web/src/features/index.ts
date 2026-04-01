/**
 * Feature Module Types
 *
 * Re-exports feature types for convenience and adds app-specific extensions.
 */

export type { MainFeatureModule, SidebarItem, RouteComponentProps } from '@xgen/types';
export { featureRegistry, initializeFeatures } from './featureRegistry';
export type { SidebarSection, RouteConfig, FeatureRegistryConfig } from './featureRegistry';
