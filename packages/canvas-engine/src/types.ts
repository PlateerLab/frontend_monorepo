import type { Position, CanvasNode, NodeData, CanvasEdge, EdgePreview, View, CanvasMemo, PredictedNode } from '@xgen/canvas-types';
import type { PortMouseEventData } from './hooks/usePortHandlers';

// ========== Canvas Component Props ==========

export interface CanvasProps {
    /** Initial nodes to render */
    initialNodes?: CanvasNode[];
    /** Initial edges to render */
    initialEdges?: CanvasEdge[];
    /** Initial memos to render */
    initialMemos?: CanvasMemo[];
    /** Available node specifications for predicted nodes */
    availableNodeSpecs?: NodeData[];
    /** Whether the canvas is read-only */
    readOnly?: boolean;
    /** Callback when nodes change */
    onNodesChange?: (nodes: CanvasNode[]) => void;
    /** Callback when edges change */
    onEdgesChange?: (edges: CanvasEdge[]) => void;
    /** Callback when memos change */
    onMemosChange?: (memos: CanvasMemo[]) => void;
    /** Callback when canvas state changes (view, nodes, edges, memos) */
    onStateChange?: (state: { view: View; nodes: CanvasNode[]; edges: CanvasEdge[]; memos: CanvasMemo[] }) => void;
    /** Callback for node context menu actions */
    onNodeContextMenu?: (nodeId: string, action: string) => void;
    /** Callback for canvas context menu actions */
    onCanvasContextMenu?: (position: Position, action: string) => void;
    /** Callback when a node is double-clicked */
    onNodeDoubleClick?: (nodeId: string) => void;
    /** Callback to open a node parameter modal */
    onOpenNodeModal?: (nodeId: string, paramId: string, paramName: string, currentValue: string) => void;
    /** Callback to view node details */
    onViewDetails?: (nodeId: string, nodeDataId: string, nodeName: string) => void;
    /** CSS class name for the container */
    className?: string;
}

// ========== Canvas Ref (Imperative Handle) ==========

export interface CanvasRef {
    /** Get all current nodes */
    getNodes: () => CanvasNode[];
    /** Set nodes directly */
    setNodes: (nodes: CanvasNode[]) => void;
    /** Get all current edges */
    getEdges: () => CanvasEdge[];
    /** Set edges directly */
    setEdges: (edges: CanvasEdge[]) => void;
    /** Get all current memos */
    getMemos: () => CanvasMemo[];
    /** Set memos directly */
    setMemos: (memos: CanvasMemo[]) => void;
    /** Add a node */
    addNode: (node: CanvasNode) => void;
    /** Delete a node by ID */
    deleteNode: (nodeId: string) => void;
    /** Add an edge */
    addEdge: (edge: CanvasEdge) => void;
    /** Remove an edge by ID */
    removeEdge: (edgeId: string) => void;
    /** Get current view */
    getView: () => View;
    /** Set view */
    setView: (view: View) => void;
    /** Get selected node IDs */
    getSelectedNodeIds: () => Set<string>;
    /** Clear selection */
    clearSelection: () => void;
    /** Validate required inputs */
    validate: () => { isValid: boolean; nodeId?: string; nodeName?: string; inputName?: string };
    /** Undo last action */
    undo: () => void;
    /** Redo last undone action */
    redo: () => void;
    /** Check if can undo */
    canUndo: () => boolean;
    /** Check if can redo */
    canRedo: () => boolean;
    /** Toggle node expand/collapse */
    toggleExpanded: (nodeId: string) => void;
    /** Find auto connection for a node */
    findAutoConnection: (nodeId: string) => void;
    /** Get full canvas state (view + nodes + edges + memos) */
    getCanvasState: () => { view: View; nodes: CanvasNode[]; edges: CanvasEdge[]; memos: CanvasMemo[] };
    /** Load a workflow into the canvas (replaces entire state) */
    loadWorkflow: (state: { nodes?: CanvasNode[]; edges?: CanvasEdge[]; memos?: CanvasMemo[]; view?: View }) => void;
    /** Load canvas state with validation (for history restore) */
    loadCanvasState: (state: Partial<{ view: View; nodes: CanvasNode[]; edges: CanvasEdge[]; memos: CanvasMemo[] }>) => void;
    /** Load canvas state without view (for history undo/redo) */
    loadCanvasStateWithoutView: (state: Partial<{ view: View; nodes: CanvasNode[]; edges: CanvasEdge[]; memos: CanvasMemo[] }>) => void;
    /** Apply node layout positions */
    applyNodeLayout: (positions: Record<string, Position>, skipHistory?: boolean) => void;
    /** Validate and prepare for execution */
    validateAndPrepareExecution: () => { success?: boolean; error?: string; nodeId?: string };
    /** Set available node specs */
    setAvailableNodeSpecs: (specs: NodeData[]) => void;
    /** Zoom in */
    zoomIn: () => void;
    /** Zoom out */
    zoomOut: () => void;
    /** Zoom by a factor */
    zoomBy: (factor: number) => void;
    /** Get centered view for current content */
    getCenteredView: () => View;
    /** Add a memo at position */
    addMemo: (position: Position) => void;
    /** Update a node parameter value */
    updateNodeParameter: (nodeId: string, paramId: string, value: string | number | boolean) => void;
    /** Update sidebar drag preview */
    updateSidebarDragPreview: (nodeData: NodeData, clientX: number, clientY: number) => void;
    /** Clear sidebar drag preview */
    clearSidebarDragPreview: () => void;
}

// ========== Edge Component Props ==========

export interface EdgeProps {
    id: string;
    sourcePos: Position;
    targetPos: Position;
    isSelected: boolean;
    onClick?: (edgeId: string, e?: React.MouseEvent) => void;
}

// ========== Node Component Props ==========

export interface NodeProps {
    node: CanvasNode;
    isSelected: boolean;
    isExpanded: boolean;
    view: View;
    onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    onPortMouseDown: (data: PortMouseEventData, mouseEvent?: React.MouseEvent) => void;
    onPortMouseUp: (data: PortMouseEventData, mouseEvent?: React.MouseEvent) => void;
    onParameterChange: (nodeId: string, paramId: string, value: string | number | boolean, label?: string) => void;
    onNodeNameChange?: (nodeId: string, newName: string) => void;
    onContextMenu?: (nodeId: string, action: string) => void;
    onDoubleClick?: (nodeId: string) => void;
    registerPortPosition: (nodeId: string, portId: string, portType: 'input' | 'output', position: Position) => void;
}

// ========== Context Menu Props ==========

export interface CanvasContextMenuProps {
    position: { x: number; y: number };
    worldPosition: Position;
    onAction: (action: string) => void;
    onClose: () => void;
}

export interface NodeContextMenuProps {
    nodeId: string;
    position: { x: number; y: number };
    onAction: (nodeId: string, action: string) => void;
    onClose: () => void;
}
