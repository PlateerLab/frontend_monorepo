import type { Port, Parameter, ParameterOption, CanvasNode, CanvasEdge } from '@xgen/canvas-types';

// ========== Node Header Props ==========

export interface NodeHeaderProps {
    nodeName: string;
    nodeNameKo?: string;
    nodeDataId: string;
    description?: string;
    description_ko?: string;
    functionId?: string;
    isEditingName: boolean;
    editingName: string;
    isPreview?: boolean;
    isExpanded?: boolean;
    onNameDoubleClick: (e: React.MouseEvent) => void;
    onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onNameBlur: () => void;
    onClearSelection?: () => void;
    onToggleExpanded?: (e: React.MouseEvent) => void;
}

// ========== Node Ports Props ==========

export interface NodePortsProps {
    nodeId: string;
    inputs?: Port[];
    outputs?: Port[];
    parameters?: Parameter[];
    isPreview?: boolean;
    isSelected?: boolean;
    onPortMouseDown: (data: PortMouseData, e: React.MouseEvent) => void;
    onPortMouseUp: (data: PortMouseData, e: React.MouseEvent) => void;
    registerPortRef: (nodeId: string, portId: string, portType: 'input' | 'output', el: HTMLDivElement | null) => void;
    snappedPortKey?: string | null;
    isSnapTargetInvalid?: boolean;
    currentNodes?: CanvasNode[];
    currentEdges?: CanvasEdge[];
    onSynchronizeSchema?: (portId: string) => void;
}

export interface PortMouseData {
    nodeId: string;
    portId: string;
    portType: 'input' | 'output';
    isMulti?: boolean;
    type?: string;
}

// ========== Node Parameters Props ==========

export interface NodeParametersProps {
    nodeId: string;
    nodeDataId: string;
    parameters?: Parameter[];
    isPreview?: boolean;
    onParameterChange?: (nodeId: string, paramId: string, value: string | number | boolean, skipHistory?: boolean) => void;
    onParameterNameChange?: (nodeId: string, paramId: string, newName: string) => void;
    onParameterAdd?: (nodeId: string, parameter: Parameter) => void;
    onParameterDelete?: (nodeId: string, paramId: string) => void;
    onClearSelection?: () => void;
    onOpenNodeModal?: (nodeId: string, paramId: string, paramName: string, currentValue: string) => void;
    showAdvanced: boolean;
    onToggleAdvanced: (e: React.MouseEvent) => void;
    currentNodes?: CanvasNode[];
    currentEdges?: CanvasEdge[];
}

// ========== Parameter Types ==========

export type ParameterType = 'api' | 'handle' | 'boolean' | 'tool_name' | 'expandable' | 'default';

export interface ParameterRenderOptions {
    paramKey: string;
    isApiParam: boolean;
    isHandleParam: boolean;
    isEditingHandle: boolean;
    effectiveOptions: ParameterOption[];
    isLoadingOptions: boolean;
    apiSingleValue?: string;
    shouldRenderAsInput: boolean;
}

// ========== Schema Provider Info ==========

export interface SchemaProviderInfo {
    nodeId: string;
    isSchemaProvider: boolean;
    canSynchronize: boolean;
}

// ========== Hook Return Types ==========

export interface UseNodeEditingReturn {
    isEditingName: boolean;
    editingName: string;
    handleNameDoubleClick: (e: React.MouseEvent, nodeName: string, isPreview?: boolean) => void;
    handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, nodeId: string, nodeName: string, onNodeNameChange?: (nodeId: string, newName: string) => void) => void;
    handleNameSubmit: (nodeId: string, nodeName: string, onNodeNameChange?: (nodeId: string, newName: string) => void) => void;
    handleNameCancel: (nodeName: string) => void;
    handleNameBlur: (nodeId: string, nodeName: string, onNodeNameChange?: (nodeId: string, newName: string) => void) => void;
}

export interface UseParameterEditingReturn {
    editingHandleParams: Record<string, boolean>;
    editingHandleValues: Record<string, string>;
    handleHandleParamClick: (param: Parameter, nodeId: string) => void;
    handleHandleParamChange: (e: React.ChangeEvent<HTMLInputElement>, param: Parameter, nodeId: string) => void;
    handleHandleParamKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, param: Parameter) => void;
    handleHandleParamSubmit: (param: Parameter, nodeId: string, onParameterNameChange?: (nodeId: string, paramId: string, newName: string) => void) => void;
    handleHandleParamCancel: (param: Parameter, nodeId: string) => void;
    handleHandleParamBlur: (param: Parameter, nodeId: string, onParameterNameChange?: (nodeId: string, paramId: string, newName: string) => void) => void;
}

export interface UseApiParametersReturn {
    apiOptions: Record<string, ParameterOption[]>;
    loadingApiOptions: Record<string, boolean>;
    apiSingleValues: Record<string, string>;
    loadApiOptions: (param: Parameter, nodeId: string) => void;
    refreshApiOptions: (param: Parameter, nodeId: string) => void;
}

// ========== Parameter Component Base Props ==========

export interface ParameterBaseProps {
    id: string;
    parameter: Parameter;
    nodeId: string;
    onParameterChange?: (nodeId: string, paramId: string, value: string | number | boolean, skipHistory?: boolean) => void;
    onClearSelection?: () => void;
    isPreview?: boolean;
}
