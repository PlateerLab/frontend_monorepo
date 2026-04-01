import React, { memo, useMemo } from 'react';
import { Node } from './Node/index';
import { findSpecialNode } from './special-node/specialNode';
import type { NodeComponentProps } from './Node/index';
import type { CanvasNode, CanvasEdge, Port, Parameter } from '@xgen/canvas-types';
import type { PortMouseData } from './Node/types';

export interface CanvasNodesProps {
    nodes: CanvasNode[];
    selectedNodeIds: string[];
    onNodeMouseDown?: (e: React.MouseEvent, nodeId: string) => void;
    onNodeDoubleClick?: (e: React.MouseEvent, nodeId: string) => void;
    onNodeContextMenu?: (e: React.MouseEvent, nodeId: string) => void;
    onPortMouseDown?: (data: PortMouseData, e: React.MouseEvent) => void;
    onPortMouseUp?: (data: PortMouseData, e: React.MouseEvent) => void;
    registerPortRef?: (nodeId: string, portId: string, portType: 'input' | 'output', el: HTMLDivElement | null) => void;
    onNodeNameChange?: (nodeId: string, newName: string) => void;
    onNodeToggleExpand?: (nodeId: string) => void;
    onNodeToggleBypass?: (nodeId: string) => void;
    onParameterChange?: (nodeId: string, paramId: string, value: Parameter['value']) => void;
    onParameterNameChange?: (nodeId: string, paramId: string, newName: string) => void;
    onParameterAdd?: (nodeId: string, parameter: Parameter) => void;
    onParameterDelete?: (nodeId: string, paramId: string) => void;
    onClearSelection?: () => void;
    onOpenNodeModal?: (nodeId: string, paramId: string, paramName: string, paramValue: string) => void;
    onSchemaSyncRequest?: (nodeId: string) => void;
    snappedPortKey?: string | null;
    isSnapTargetInvalid?: boolean;
    currentNodes?: CanvasNode[];
    currentEdges?: CanvasEdge[];
    fetchParameterOptions?: (nodeDataId: string, apiName: string) => Promise<any[]>;
    renderContextMenu?: NodeComponentProps['renderContextMenu'];
}

const CanvasNodesComponent: React.FC<CanvasNodesProps> = ({
    nodes,
    selectedNodeIds,
    onNodeMouseDown,
    onNodeDoubleClick,
    onNodeContextMenu,
    onPortMouseDown,
    onPortMouseUp,
    registerPortRef,
    onNodeNameChange,
    onNodeToggleExpand,
    onNodeToggleBypass,
    onParameterChange,
    onParameterNameChange,
    onParameterAdd,
    onParameterDelete,
    onClearSelection,
    onOpenNodeModal,
    onSchemaSyncRequest,
    snappedPortKey,
    isSnapTargetInvalid,
    currentNodes,
    currentEdges,
    fetchParameterOptions,
    renderContextMenu
}) => {
    return (
        <>
            {nodes.map((node) => {
                const isSelected = selectedNodeIds.includes(node.id);

                // Check for special node
                const specialConfig = node.data ? findSpecialNode(node.data) : null;

                const commonProps: NodeComponentProps = {
                    node,
                    isSelected,
                    onNodeMouseDown,
                    onNodeDoubleClick,
                    onNodeContextMenu,
                    onPortMouseDown,
                    onPortMouseUp,
                    registerPortRef,
                    onNodeNameChange,
                    onNodeToggleExpand,
                    onNodeToggleBypass,
                    onParameterChange,
                    onParameterNameChange,
                    onParameterAdd,
                    onParameterDelete,
                    onClearSelection,
                    onOpenNodeModal,
                    onSchemaSyncRequest,
                    snappedPortKey,
                    isSnapTargetInvalid,
                    currentNodes,
                    currentEdges,
                    fetchParameterOptions,
                    renderContextMenu
                };

                if (specialConfig) {
                    const SpecialComponent = specialConfig.component;
                    return (
                        <SpecialComponent
                            key={node.id}
                            {...commonProps}
                            {...(specialConfig.additionalProps ?? {})}
                        />
                    );
                }

                return <Node key={node.id} {...commonProps} />;
            })}
        </>
    );
};

export const CanvasNodes = memo(CanvasNodesComponent);
