// ========== Basic Types ==========
export interface Position {
    x: number;
    y: number;
}

export interface View {
    x: number;
    y: number;
    scale: number;
}

// ========== Port and Parameter Types ==========
export interface Port {
    id: string;
    name: string;
    type: string;
    required?: boolean;
    multi?: boolean;
    stream?: boolean;
    description?: string;
    description_ko?: string;
    dependency?: string;
    dependencyValue?: string | number | boolean;
}

export interface ParameterOption {
    value: string | number;
    label?: string;
    isSingleValue?: boolean;
}

export interface Parameter {
    id: string;
    name: string;
    value: string | number | boolean;
    type?: string;
    label?: string;
    required?: boolean;
    optional?: boolean;
    options?: ParameterOption[];
    step?: number;
    min?: number;
    max?: number;
    is_api?: boolean;
    api_name?: string;
    description?: string;
    description_ko?: string;
    handle_id?: boolean;
    is_added?: boolean;
    expandable?: boolean;
    from_schema?: boolean;
    dependency?: string;
    dependencyValue?: string | number | boolean;
    duplicateable?: boolean;
}

// ========== Node Types ==========
export interface NodeData {
    id: string;
    nodeName: string;
    nodeNameKo?: string;
    description?: string;
    description_ko?: string;
    functionId?: string;
    inputs?: Port[];
    outputs?: Port[];
    parameters?: Parameter[];
    bypass?: boolean;
}

export interface CanvasNode {
    id: string;
    data: NodeData;
    position: Position;
    isExpanded?: boolean;
}

// ========== Edge Types ==========
export interface EdgeConnection {
    nodeId: string;
    portId: string;
    portType: string;
    type?: string;
}

export interface CanvasEdge {
    id: string;
    source: EdgeConnection;
    target: EdgeConnection;
}

export interface EdgePreview {
    source: EdgeConnection & { type: string };
    startPos: Position;
    targetPos: Position;
}

// ========== Memo Types ==========
export interface CanvasMemo {
    id: string;
    content: string;
    position: Position;
    size?: { width: number; height: number };
    color?: string;
    fontSize?: number;
}

export const MEMO_DEFAULT_FONT_SIZE = 12;
export const MEMO_MIN_FONT_SIZE = 8;
export const MEMO_MAX_FONT_SIZE = 32;

export const MEMO_COLORS = ['yellow', 'blue', 'green', 'pink', 'purple'] as const;
export type MemoColor = typeof MEMO_COLORS[number];

export const MEMO_DEFAULT_COLOR: MemoColor = 'yellow';
export const MEMO_DEFAULT_SIZE = { width: 200, height: 150 };

// ========== Workflow Types ==========
export interface WorkflowData {
    workflow_name?: string;
    workflow_id?: string;
    nodes?: CanvasNode[];
    edges?: CanvasEdge[];
    memos?: CanvasMemo[];
    view?: View;
    interaction_id?: string;
}

export interface WorkflowState {
    workflow_name?: string;
    workflow_id?: string;
    nodes?: CanvasNode[];
    edges?: CanvasEdge[];
    memos?: CanvasMemo[];
    view?: View;
    interaction_id?: string;
}

// ========== Template Types ==========
export interface RawTemplate {
    workflow_id: string;
    workflow_name: string;
    description?: string;
    tags?: string[];
    contents?: WorkflowData;
}

export interface Template {
    id: string;
    name: string;
    description: string;
    tags: string[];
    nodes: number;
    data?: WorkflowData;
}

// ========== Canvas State Types ==========
export interface DragState {
    type: 'none' | 'canvas' | 'node' | 'edge' | 'selection-box' | 'memo';
    startX?: number;
    startY?: number;
    nodeId?: string;
    memoId?: string;
    offsetX?: number;
    offsetY?: number;
    initialNodePosition?: Position;
    initialPositions?: Record<string, Position>;
    initialMemoPosition?: Position;
    selectionBox?: {
        startX: number;
        startY: number;
        currentX: number;
        currentY: number;
    };
}

export interface PredictedNode {
    id: string;
    nodeData: NodeData;
    position: Position;
    isHovered: boolean;
}

export interface CanvasState {
    view: View;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    memos: CanvasMemo[];
}

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    nodeId?: string;
    nodeName?: string;
    inputName?: string;
}
