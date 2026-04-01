/**
 * Canvas Feature Plugin Registration
 *
 * Registers all canvas page plugins with the FeatureRegistry.
 * Import this file from `initializeFeatures()` to activate
 * the canvas editor feature set.
 *
 * To disable a feature, comment out its import + register line.
 * The canvas core will still function without it.
 */

import { FeatureRegistry } from '@xgen/types';

// Canvas Feature Plugins
import { canvasHeaderPlugin } from '@xgen/feature-canvas-header';
import { canvasHistoryPlugin } from '@xgen/feature-canvas-history';
import { canvasSidebarNodesPlugin } from '@xgen/feature-canvas-sidebar-nodes';
import { canvasSidebarTemplatesPlugin } from '@xgen/feature-canvas-sidebar-templates';
import { canvasSidebarWorkflowsPlugin } from '@xgen/feature-canvas-sidebar-workflows';
import { canvasExecutionPlugin } from '@xgen/feature-canvas-execution';
import { canvasAiGeneratorPlugin } from '@xgen/feature-canvas-ai-generator';
import { canvasNodeDetailPlugin } from '@xgen/feature-canvas-node-detail';
import { canvasDocumentDropPlugin } from '@xgen/feature-canvas-document-drop';

export function registerCanvasPlugins(): void {
    // Header
    FeatureRegistry.registerCanvasPagePlugin(canvasHeaderPlugin);

    // Side panels
    FeatureRegistry.registerCanvasPagePlugin(canvasSidebarNodesPlugin);
    FeatureRegistry.registerCanvasPagePlugin(canvasSidebarTemplatesPlugin);
    FeatureRegistry.registerCanvasPagePlugin(canvasSidebarWorkflowsPlugin);

    // Bottom panels
    FeatureRegistry.registerCanvasPagePlugin(canvasExecutionPlugin);

    // Overlays
    FeatureRegistry.registerCanvasPagePlugin(canvasAiGeneratorPlugin);
    FeatureRegistry.registerCanvasPagePlugin(canvasHistoryPlugin);

    // Modals
    FeatureRegistry.registerCanvasPagePlugin(canvasNodeDetailPlugin);
    FeatureRegistry.registerCanvasPagePlugin(canvasDocumentDropPlugin);
}
