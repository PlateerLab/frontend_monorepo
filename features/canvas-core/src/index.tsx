/**
 * @xgen/feature-canvas-core
 *
 * Core canvas orchestration feature. Provides the peripheral UI components
 * that surround the canvas engine: side menu, edit/run toggle, zoom controls,
 * and the empty-state CTA overlay.
 *
 * This package does NOT depend on any other canvas feature packages;
 * sub-panels (AddNodePanel, AgentflowPanel, TemplatePanel) are injected
 * as render props by the app-level page component.
 */
import './locales';

export { default as SideMenu } from './components/SideMenu';
export type { SideMenuProps, MenuView } from './components/SideMenu';

export { default as EditRunFloating } from './components/EditRunFloating';
export type { EditRunFloatingProps, CanvasMode } from './components/EditRunFloating';

export { default as Zoombox } from './components/Zoombox';
export type { ZoomboxProps } from './components/Zoombox';

export { default as ZoomPercent } from './components/ZoomPercent';
export type { ZoomPercentProps } from './components/ZoomPercent';

export { default as CanvasEmptyState } from './components/CanvasEmptyState';
export type { CanvasEmptyStateProps } from './components/CanvasEmptyState';
