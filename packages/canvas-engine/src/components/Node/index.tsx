import React, { useState, useMemo, useCallback, memo } from 'react';
import styles from '../../styles/Node.module.scss';
import { NodeHeader } from './components/NodeHeader';
import { NodePorts } from './components/NodePorts';
import { NodePortsCollapsed } from './components/NodePortsCollapsed';
import { NodeParameters } from './components/NodeParameters';
import { useNodeEditing } from '../../hooks/node/useNodeEditing';
import { useNodeContextMenu } from '../../hooks/node/useNodeContextMenu';
import { getDisplayNodeName, getLocalizedNodeName, getNodeContainerClasses, getNodeContainerStyles, createCommonEventHandlers, hasInputsAndOutputs, hasParameters } from './utils/nodeUtils';
import { useTranslation } from '@xgen/i18n';
import type { CanvasNode, CanvasEdge, Port, Parameter } from '@xgen/canvas-types';
import type { PortMouseData } from './types';

export interface NodeComponentProps {
    node: CanvasNode;
    isSelected?: boolean;
    isPreview?: boolean;
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
    renderContextMenu?: (props: {
        nodeId: string;
        position: { x: number; y: number };
        onClose: () => void;
    }) => React.ReactNode;
    children?: React.ReactNode;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
    node,
    isSelected = false,
    isPreview = false,
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
    renderContextMenu,
    children
}) => {
    const { locale } = useTranslation();
    const [showAdvanced, setShowAdvanced] = useState(false);

    const nodeName = node.data?.nodeName ?? '';
    const nodeNameKo = node.data?.nodeNameKo;
    const localizedName = getLocalizedNodeName(nodeName, nodeNameKo, locale);

    const nodeEditing = useNodeEditing(localizedName);
    const nodeContextMenu = useNodeContextMenu({
        nodeId: node.id,
        nodeName: localizedName,
        nodeDataId: node.data?.nodeDataId ?? '',
        isPreview,
        isExpanded: node.isExpanded !== undefined ? node.isExpanded : true,
        isBypassed: node.isBypassed ?? false,
        isSelected: node.isSelected ?? false,
        onToggleExpanded: onNodeToggleExpand ? (id: string) => onNodeToggleExpand(id) : undefined,
        onToggleBypass: onNodeToggleBypass ? (id: string) => onNodeToggleBypass(id) : undefined,
        onDeleteNode: undefined,
        onCopyNode: undefined,
        onOpenNodeModal,
        handleNameDoubleClick: nodeEditing.handleNameDoubleClick,
    });

    const isExpanded = node.isExpanded !== undefined ? node.isExpanded : true;
    const isBypassed = node.isBypassed ?? false;
    const inputs = node.data?.inputs ?? [];
    const outputs = node.data?.outputs ?? [];
    const parameters = node.data?.parameters ?? [];
    const displayName = getDisplayNodeName(localizedName, 25);
    const { hasIO } = hasInputsAndOutputs(inputs, outputs);
    const hasParams = hasParameters(parameters);

    const containerClasses = useMemo(() => {
        const classes = [styles.node];
        if (isSelected) classes.push(styles.selected);
        if (!isExpanded) classes.push(styles.collapsed);
        if (isBypassed) classes.push(styles.bypassed);
        if (isPreview) classes.push(styles.preview);
        return classes.join(' ');
    }, [isSelected, isExpanded, isBypassed, isPreview]);

    const containerStyles = useMemo(
        () => getNodeContainerStyles(node.position),
        [node.position]
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (isPreview) return;
            if (onNodeMouseDown) {
                onNodeMouseDown(e, node.id);
            }
        },
        [isPreview, node.id, onNodeMouseDown]
    );

    const handleDoubleClick = useCallback(
        (e: React.MouseEvent) => {
            if (isPreview) return;
            if (onNodeDoubleClick) {
                onNodeDoubleClick(e, node.id);
            }
        },
        [isPreview, node.id, onNodeDoubleClick]
    );

    const handleContextMenu = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (isPreview) return;
            if (onNodeContextMenu) {
                onNodeContextMenu(e, node.id);
            }
            nodeContextMenu.handleContextMenu(e);
        },
        [isPreview, node.id, onNodeContextMenu, nodeContextMenu]
    );

    const handleToggleExpand = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (onNodeToggleExpand) {
                onNodeToggleExpand(node.id);
            }
        },
        [node.id, onNodeToggleExpand]
    );

    const handleToggleAdvanced = useCallback(
        (e: React.MouseEvent | React.KeyboardEvent) => {
            e.stopPropagation();
            setShowAdvanced((prev) => !prev);
        },
        []
    );

    return (
        <div
            className={containerClasses}
            style={containerStyles}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            data-node-id={node.id}
            role="button"
            tabIndex={0}
        >
            {/* Node Header */}
            <NodeHeader
                nodeName={nodeName}
                nodeNameKo={nodeNameKo}
                nodeDataId={node.data?.id ?? ''}
                description={node.data?.description}
                description_ko={node.data?.description_ko}
                functionId={node.data?.functionId}
                isPreview={isPreview}
                isExpanded={isExpanded}
                isEditingName={nodeEditing.isEditingName}
                editingName={nodeEditing.editingName}
                onNameDoubleClick={(e) => nodeEditing.handleNameDoubleClick(e, localizedName, isPreview)}
                onNameChange={nodeEditing.handleNameChange}
                onNameKeyDown={(e) => nodeEditing.handleNameKeyDown(e, node.id, localizedName, onNodeNameChange)}
                onNameBlur={() => nodeEditing.handleNameBlur(node.id, localizedName, onNodeNameChange)}
                onClearSelection={onClearSelection}
                onToggleExpanded={handleToggleExpand}
            />

            {/* Body Section */}
            {isExpanded ? (
                <div className={styles.body}>
                    {/* Input/Output Ports */}
                    {hasIO && (
                        <NodePorts
                            nodeId={node.id}
                            inputs={inputs}
                            outputs={outputs}
                            parameters={parameters}
                            isPreview={isPreview}
                            onPortMouseDown={onPortMouseDown}
                            onPortMouseUp={onPortMouseUp}
                            registerPortRef={registerPortRef}
                            snappedPortKey={snappedPortKey}
                            isSnapTargetInvalid={isSnapTargetInvalid}
                            currentNodes={currentNodes}
                            currentEdges={currentEdges}
                            onSynchronizeSchema={onSchemaSyncRequest}
                        />
                    )}

                    {/* Parameters */}
                    {hasParams && (
                        <>
                            {hasIO && <div className={styles.divider}></div>}
                            <NodeParameters
                                nodeId={node.id}
                                nodeDataId={node.data?.id ?? ''}
                                parameters={parameters}
                                isPreview={isPreview}
                                onParameterChange={onParameterChange}
                                onParameterNameChange={onParameterNameChange}
                                onParameterAdd={onParameterAdd}
                                onParameterDelete={onParameterDelete}
                                onClearSelection={onClearSelection}
                                onOpenNodeModal={onOpenNodeModal}
                                showAdvanced={showAdvanced}
                                onToggleAdvanced={handleToggleAdvanced}
                                fetchParameterOptions={fetchParameterOptions}
                            />
                        </>
                    )}
                </div>
            ) : (
                <div className={styles.collapsedBody}>
                    {hasIO && (
                        <NodePortsCollapsed
                            nodeId={node.id}
                            inputs={inputs}
                            outputs={outputs}
                            parameters={parameters}
                            isPreview={isPreview}
                            onPortMouseDown={onPortMouseDown}
                            onPortMouseUp={onPortMouseUp}
                            registerPortRef={registerPortRef}
                            snappedPortKey={snappedPortKey}
                            isSnapTargetInvalid={isSnapTargetInvalid}
                        />
                    )}
                </div>
            )}

            {/* Custom children (for special node extensions) */}
            {children}

            {/* Context Menu */}
            {nodeContextMenu.contextMenuOpen && renderContextMenu && (
                renderContextMenu({
                    nodeId: node.id,
                    position: nodeContextMenu.contextMenuPosition,
                    onClose: nodeContextMenu.handleContextMenuClose
                })
            )}
        </div>
    );
};

export const Node = memo(NodeComponent);
