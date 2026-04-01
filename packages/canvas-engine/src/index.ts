import './locales';

export { useCanvasView } from './hooks/useCanvasView';
export { useCanvasSelection } from './hooks/useCanvasSelection';
export { useNodeManagement } from './hooks/useNodeManagement';
export { useEdgeManagement } from './hooks/useEdgeManagement';
export { useMemoManagement } from './hooks/useMemoManagement';
export { useDragState } from './hooks/useDragState';
export { useCompatibleNodes } from './hooks/useCompatibleNodes';
export { useCanvasEventHandlers } from './hooks/useCanvasEventHandlers';
export { usePortHandlers } from './hooks/usePortHandlers';
export { useKeyboardHandlers } from './hooks/useKeyboardHandlers';
export { useAutoConnect } from './hooks/useAutoConnect';
export { useHistoryManagement, createHistoryHelpers } from './hooks/useHistoryManagement';

// Zoom constants
export { MIN_SCALE, MAX_SCALE } from './hooks/useCanvasView';

// Utils
export {
    // Constants
    SNAP_DISTANCE,
    VERTICAL_SPACING,
    HORIZONTAL_SPACING,
    NODE_APPROX_WIDTH,
    NODE_APPROX_HEIGHT,
    // Multi-Type utilities
    parseMultiType,
    isMultiType,
    getPrimaryType,
    formatTypeDisplay,
    // Type compatibility
    areTypesCompatible,
    getCompatibleTypePairs,
    getPortTypeClasses,
    // Validation
    validateRequiredInputs,
    // Position
    calculateDistance,
    // Port utilities
    generatePortKey,
    parsePortKey,
    findPortData,
    // Node identification
    isPredictedNodeId,
    isSchemaProviderNode,
    isRouterNode,
    // Event utilities
    isParameterInput,
    // Canvas coordinates
    getWorldPosition,
    // Grid
    calculateGridLayout,
    getGridPosition,
    // Edge signatures
    createEdgeSignature,
    parseEdgeSignature,
    // Schema sync
    getConnectedSchemaProvider,
    // Mouse events
    isClick,
    // Viewport
    getCenteredViewport,
    // Snap
    findClosestSnapTarget,
} from './utils/canvas-utils';

// Types
export type {
    CanvasProps,
    CanvasRef,
    EdgeProps,
    NodeProps,
    CanvasContextMenuProps,
    NodeContextMenuProps,
} from './types';

export type {
    UseCanvasViewReturn,
    UseCanvasSelectionReturn,
    UseNodeManagementReturn,
    UseEdgeManagementReturn,
    UseMemoManagementReturn,
    UseDragStateReturn,
    UseHistoryManagementReturn,
    HistoryEntry,
    HistoryActionType,
    PortMouseEventData,
} from './hooks';

// Canvas main component
export { Canvas } from './components/Canvas';

// Node-level hooks
export { useNodeEditing, useNodeContextMenu, useParameterEditing, useApiParameters } from './hooks/node';

// Components
export { Node } from './components/Node/index';
export type { NodeComponentProps } from './components/Node/index';
export { Edge } from './components/Edge';
export { Memo } from './components/Memo';
export { CanvasContextMenu } from './components/CanvasContextMenu';
export { NodeContextMenu } from './components/NodeContextMenu';
export { CanvasNodes } from './components/CanvasNodes';
export type { CanvasNodesProps } from './components/CanvasNodes';
export { CanvasEdges } from './components/CanvasEdges';
export type { CanvasEdgesProps } from './components/CanvasEdges';
export { CanvasMemos } from './components/CanvasMemos';
export type { CanvasMemosProps } from './components/CanvasMemos';
export { CanvasAddNodesPopup } from './components/CanvasAddNodesPopup';
export type { CanvasAddNodesPopupProps } from './components/CanvasAddNodesPopup';
export { NodeSelectorPopup } from './components/NodeSelectorPopup';
export type { NodeSelectorPopupProps } from './components/NodeSelectorPopup';

// Node sub-components
export { NodeHeader } from './components/Node/components/NodeHeader';
export { NodePorts } from './components/Node/components/NodePorts';
export { NodePortsCollapsed } from './components/Node/components/NodePortsCollapsed';
export { NodeParameters } from './components/Node/components/NodeParameters';
export { RouterNodePorts } from './components/Node/components/RouterNodePorts';
export { RouterNodeParameters } from './components/Node/components/specialized/RouterNodeParameters';
export { SchemaProviderNodeParameters } from './components/Node/components/specialized/SchemaProviderNodeParameters';

// Special nodes
export {
    findSpecialNode,
    isSpecialNode,
    getAllAdditionalProps,
    registerSpecialNode,
    getSpecialNodes,
    SpecialNodeMatchers,
} from './components/special-node/specialNode';
export type { SpecialNodeConfig } from './components/special-node/specialNode';
export { RouterNode } from './components/special-node/RouterNode';
export type { RouterNodeProps } from './components/special-node/RouterNode';
export { AgentXgenNode } from './components/special-node/AgentXgenNode';
export type { AgentXgenNodeProps } from './components/special-node/AgentXgenNode';
export { SchemaProviderNode } from './components/special-node/SchemaProviderNode';
export type { SchemaProviderNodeProps } from './components/special-node/SchemaProviderNode';

// Node types & utilities
export type {
    NodeHeaderProps,
    NodePortsProps,
    PortMouseData,
    NodeParametersProps,
    ParameterType,
    ParameterRenderOptions,
    SchemaProviderInfo,
    UseNodeEditingReturn,
    UseParameterEditingReturn,
    UseApiParametersReturn,
    ParameterBaseProps,
} from './components/Node/types';
export {
    getDisplayNodeName,
    getLocalizedNodeName,
    hasInputsAndOutputs,
    getConnectedSchemaProvider as getNodeSchemaProvider,
    generatePortKey as generateNodePortKey,
    getPortClasses,
    getPortTypeDisplay,
    getNodeContainerClasses,
    getNodeContainerStyles,
    createCommonEventHandlers,
} from './components/Node/utils/nodeUtils';
export {
    createParameterValueMap,
    normalizeBoolean,
    isPortDependencySatisfied,
    filterPortsByDependency,
} from './components/Node/utils/portUtils';
export {
    detectParameterType,
    separateParameters,
    validateToolName,
    processToolNameValue,
    createCustomParameter,
    duplicateParameter,
    getLocalizedDescription,
    getLocalizedPortDescription,
} from './components/Node/utils/parameterUtils';
