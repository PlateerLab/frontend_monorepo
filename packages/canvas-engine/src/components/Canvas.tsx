'use client';

import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { CanvasNode, CanvasEdge, CanvasMemo, EdgePreview, Position, View, NodeData } from '@xgen/canvas-types';
import { areTypesCompatible } from '../utils/canvas-utils';
import type { CanvasProps, CanvasRef } from '../types';
import { useTranslation } from '@xgen/i18n';

// Hooks
import { useCanvasView } from '../hooks/useCanvasView';
import { useCanvasSelection } from '../hooks/useCanvasSelection';
import { useNodeManagement } from '../hooks/useNodeManagement';
import { useEdgeManagement } from '../hooks/useEdgeManagement';
import { useMemoManagement } from '../hooks/useMemoManagement';
import { useDragState } from '../hooks/useDragState';
import { useCompatibleNodes } from '../hooks/useCompatibleNodes';
import { useCanvasEventHandlers } from '../hooks/useCanvasEventHandlers';
import { usePortHandlers } from '../hooks/usePortHandlers';
import { useKeyboardHandlers } from '../hooks/useKeyboardHandlers';
import { useAutoConnect } from '../hooks/useAutoConnect';
import { useHistoryManagement, createHistoryHelpers } from '../hooks/useHistoryManagement';

// Components
import { CanvasNodes } from './CanvasNodes';
import { CanvasEdges } from './CanvasEdges';
import { CanvasMemos } from './CanvasMemos';
import CanvasContextMenu from './CanvasContextMenu';
import { NodeSelectorPopup, type NodeCategory } from './NodeSelectorPopup';

import styles from '../styles/Canvas.module.scss';
import { MIN_SCALE, MAX_SCALE } from '../hooks/useCanvasView';

// ── Component ──────────────────────────────────────────────────

export const Canvas = forwardRef<CanvasRef, CanvasProps>(function Canvas(props, ref) {
    const {
        initialNodes = [],
        initialEdges = [],
        initialMemos = [],
        availableNodeSpecs = [],
        readOnly = false,
        onNodesChange,
        onEdgesChange,
        onMemosChange,
        onStateChange,
        onNodeContextMenu,
        onCanvasContextMenu,
        onNodeDoubleClick,
        onOpenNodeModal,
        onViewDetails,
        onHistoryChange,
        className,
    } = props;

    // ── Refs ──
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const edgePreviewRef = useRef<EdgePreview | null>(null);
    const snappedPortKeyRef = useRef<string | null>(null);
    const isDraggingRef = useRef(false);
    const nodesRef = useRef<CanvasNode[]>([]);
    const edgesRef = useRef<CanvasEdge[]>([]);
    const memosRef = useRef<CanvasMemo[]>([]);
    const portRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

    // ── Additional state ──
    const [edgePreview, setEdgePreview] = useState<EdgePreview | null>(null);
    const [snappedPortKey, setSnappedPortKey] = useState<string | null>(null);
    const [isSnapTargetValid, setIsSnapTargetValid] = useState(false);
    const [portClickStart, setPortClickStart] = useState<any>(null);
    const [portPositions, setPortPositions] = useState<Record<string, Position>>({});
    const [selectedMemoIds, setSelectedMemoIds] = useState<string[]>([]);
    const [nodeSpecs, setNodeSpecs] = useState(availableNodeSpecs);
    const [nodeCategories, setNodeCategories] = useState<NodeCategory[]>([]);
    const [contextMenuState, setContextMenuState] = useState<{ position: Position; type: string } | null>(null);
    const [addNodePopup, setAddNodePopup] = useState<{ position: Position } | null>(null);

    const { t } = useTranslation();

    // ── Port ref registration (tracks DOM elements for position calculation) ──
    const registerPortRef = useCallback((nodeId: string, portId: string, portType: 'input' | 'output', el: HTMLDivElement | null) => {
        const key = `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
        if (el) {
            portRefsMap.current.set(key, el);
        } else {
            portRefsMap.current.delete(key);
        }
    }, []);

    // ── Hooks composition ──

    // 1. History management
    const history = useHistoryManagement();

    // 2. Canvas view (pan & zoom)
    const { view, setView, getCenteredView, handleWheel, zoomBy } = useCanvasView({
        containerRef,
        contentRef,
        isDraggingRef,
    });

    // 3. Selection
    const {
        selectedNodeIds, selectedEdgeIds, clearSelection,
        selectNode, selectEdge, toggleNodeSelection, toggleEdgeSelection, setSelection,
    } = useCanvasSelection();

    // History helpers (uses refs for lazy canvas state access — avoids circular deps)
    const getCanvasState = useCallback(() => ({
        nodes: nodesRef.current,
        edges: edgesRef.current,
        memos: memosRef.current,
        view: { x: 0, y: 0, scale: 1 },
    }), []);

    const historyHelpers = useMemo(
        () => createHistoryHelpers(history.addHistoryEntry, history, getCanvasState),
        [history, getCanvasState],
    );

    // 4. Edge management
    const {
        edges, setEdges, addEdge, removeEdge, removeNodeEdges,
        isDuplicateEdge, replaceInputEdge,
    } = useEdgeManagement({ historyHelpers });

    // 5. Memo management
    const { memos, setMemos, addMemo, updateMemoContent, updateMemoPosition, deleteMemo } = useMemoManagement();

    // 6. Node management
    const {
        nodes, setNodes, copiedNodes,
        addNode, deleteNode, copyNodes, pasteNodes,
        updateNodeParameter, updateNodeName,
        toggleBypass,
    } = useNodeManagement({ historyHelpers, edges, onPasteEdges: (newEdges) => newEdges.forEach(e => addEdge(e, true)) });

    // Sync refs for lazy state access
    nodesRef.current = nodes;
    edgesRef.current = edges;
    memosRef.current = memos;
    edgePreviewRef.current = edgePreview;
    snappedPortKeyRef.current = snappedPortKey;

    // Wire history state restorer — enables undo/redo/jump to actually restore canvas
    useEffect(() => {
        history.setCanvasStateRestorer((canvasState: any) => {
            if (!canvasState) return;
            if (canvasState.nodes) {
                const validNodes = canvasState.nodes
                    .filter((n: any) => n && n.id && n.data)
                    .map((n: any) => ({ ...n, isExpanded: n.isExpanded !== undefined ? n.isExpanded : true }));
                setNodes(validNodes);
            }
            if (canvasState.edges) {
                setEdges(canvasState.edges.filter((e: any) => e && e.id && e.source && e.target));
            }
            if (canvasState.memos) {
                setMemos(canvasState.memos.filter((m: any) => m && m.id));
            }
        });
        history.setCurrentStateCapture(() => ({
            nodes: nodesRef.current,
            edges: edgesRef.current,
            memos: memosRef.current,
        }));
    }, [history, setNodes, setEdges, setMemos]);

    // 7. Drag state
    const {
        dragState, setDragState,
        startCanvasDrag, startNodeDrag, startEdgeDrag, startSelectionBoxDrag, stopDrag,
    } = useDragState({ historyHelpers, nodes });

    // 8. Compatible nodes (for connectable node modal)
    const {
        compatibleNodes, setCompatibleNodes,
        isDraggingOutput, isDraggingInput,
        setIsDraggingOutput, setIsDraggingInput,
        setCurrentOutputType, setCurrentInputType,
        sourcePortForConnection, setSourcePortForConnection,
        findCompatibleInputNodes, findCompatibleOutputNodes,
        createNodeFromSpec,
        clearCompatibleNodes,
    } = useCompatibleNodes({
        availableNodeSpecs: nodeSpecs,
        areTypesCompatible,
    });

    // 9. Auto connect
    const { findAutoConnection } = useAutoConnect({
        nodes, edges, selectedNodeIds,
        addEdge, isDuplicateEdge, areTypesCompatible,
    });

    // 10. Port handlers
    const { handlePortMouseDown, handlePortMouseUp } = usePortHandlers({
        edges, nodes, portPositions,
        isDraggingOutput, isDraggingInput,
        portClickStart,
        edgePreviewRef,
        setPortClickStart, setEdgePreview, setSnappedPortKey, setIsSnapTargetValid,
        setIsDraggingOutput, setIsDraggingInput,
        setCurrentOutputType, setCurrentInputType,
        setSourcePortForConnection, setCompatibleNodes, setEdges,
        startEdgeDrag, removeEdge,
        addNode, addEdge,
        clearCompatibleNodes, isDuplicateEdge,
        findCompatibleInputNodes, findCompatibleOutputNodes,
    });

    // 11. Canvas event handlers
    const {
        handleCanvasMouseDown, handleMouseMove, handleMouseUp,
        handleNodeMouseDown, handleEdgeClick,
    } = useCanvasEventHandlers({
        dragState, view, portPositions,
        nodes, edges,
        isDraggingOutput, isDraggingInput,
        portClickStart, selectedNodeIds, selectedEdgeIds,
        containerRef, edgePreviewRef, snappedPortKeyRef,
        setView, setNodes, setEdgePreview, setSnappedPortKey, setIsSnapTargetValid,
        setPortClickStart, setCompatibleNodes,
        clearSelection, startCanvasDrag, startSelectionBoxDrag,
        clearCompatibleNodes, findCompatibleInputNodes, findCompatibleOutputNodes,
        stopDrag, selectNode, selectEdge,
        toggleNodeSelection, toggleEdgeSelection, setSelection,
        startNodeDrag, setDragState,
        handlePortMouseUp,
    });

    // 12. Keyboard handlers
    const { handleKeyDown } = useKeyboardHandlers({
        selectedNodeIds, selectedEdgeIds,
        copyNodes, pasteNodes,
        deleteNode: (nodeId: string) => {
            const connectedEdges = removeNodeEdges(nodeId);
            deleteNode(nodeId, connectedEdges);
        },
        removeEdge,
        removeNodeEdges,
        clearSelection, selectNode, setSelection,
        toggleBypass,
        toggleExpanded: (nodeId: string) => {
            setNodes(prevNodes => {
                const idx = prevNodes.findIndex(n => n.id === nodeId);
                if (idx === -1) return prevNodes;
                const target = prevNodes[idx];
                const currentExpanded = target.isExpanded !== undefined ? target.isExpanded : true;
                return [
                    ...prevNodes.slice(0, idx),
                    { ...target, isExpanded: !currentExpanded },
                    ...prevNodes.slice(idx + 1)
                ];
            });
        },
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        historyHelpers,
        nodes, edges,
    });

    // ── Sync isDraggingRef with drag state ──
    useEffect(() => {
        isDraggingRef.current = dragState.type === 'canvas';
    }, [dragState.type]);

    // ── Initialize with initial data ──
    useEffect(() => {
        if (initialNodes.length > 0) setNodes(initialNodes);
        if (initialEdges.length > 0) setEdges(initialEdges);
        if (initialMemos.length > 0) setMemos(initialMemos);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Attach wheel event listener ──
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // ── Attach keyboard event listener ──
    useEffect(() => {
        if (readOnly) return;
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, readOnly]);

    // ── Recalculate port positions from DOM refs ──
    useEffect(() => {
        const content = contentRef.current;
        if (!content) return;
        const newPositions: Record<string, Position> = {};
        portRefsMap.current.forEach((el, key) => {
            if (!el.isConnected) {
                portRefsMap.current.delete(key);
                return;
            }
            const elRect = el.getBoundingClientRect();
            const contentRect = content.getBoundingClientRect();
            // Convert screen position to world coordinates
            const worldX = (elRect.left + elRect.width / 2 - contentRect.left) / view.scale;
            const worldY = (elRect.top + elRect.height / 2 - contentRect.top) / view.scale;
            newPositions[key] = { x: worldX, y: worldY };
        });
        // Only update state if positions actually changed (avoid infinite render loop)
        const newKeys = Object.keys(newPositions);
        const prevKeys = Object.keys(portPositions);
        let changed = newKeys.length !== prevKeys.length;
        if (!changed) {
            for (const k of newKeys) {
                const prev = portPositions[k];
                const next = newPositions[k];
                if (!prev || prev.x !== next.x || prev.y !== next.y) {
                    changed = true;
                    break;
                }
            }
        }
        if (changed) {
            setPortPositions(newPositions);
        }
    });

    // ── Propagate state changes to parent ──
    useEffect(() => {
        onNodesChange?.(nodes);
    }, [nodes, onNodesChange]);

    useEffect(() => {
        onEdgesChange?.(edges);
    }, [edges, onEdgesChange]);

    useEffect(() => {
        onMemosChange?.(memos);
    }, [memos, onMemosChange]);

    useEffect(() => {
        onStateChange?.({ view, nodes, edges, memos });
    }, [view, nodes, edges, memos, onStateChange]);

    // Notify parent when history state changes
    useEffect(() => {
        onHistoryChange?.({
            history: history.history,
            currentHistoryIndex: history.currentHistoryIndex,
            canUndo: history.canUndo,
            canRedo: history.canRedo,
        });
    }, [history.history, history.currentHistoryIndex, history.canUndo, history.canRedo, onHistoryChange]);

    // ── Imperative handle ──
    useImperativeHandle(ref, () => ({
        getNodes: () => nodes,
        setNodes,
        getEdges: () => edges,
        setEdges,
        getMemos: () => memos,
        setMemos,
        addNode: (node: CanvasNode) => addNode(node),
        deleteNode: (nodeId: string) => {
            const connectedEdges = removeNodeEdges(nodeId);
            deleteNode(nodeId, connectedEdges);
        },
        addEdge: (edge: CanvasEdge) => addEdge(edge),
        removeEdge: (edgeId: string) => removeEdge(edgeId),
        getView: () => view,
        setView,
        getSelectedNodeIds: () => selectedNodeIds,
        clearSelection,
        validate: () => {
            for (const node of nodes) {
                const inputs = node.data?.inputs ?? [];
                for (const input of inputs) {
                    if (input.required) {
                        const hasConnection = edges.some(
                            (e) => e.target.nodeId === node.id && e.target.portId === input.id,
                        );
                        if (!hasConnection) {
                            return {
                                isValid: false,
                                nodeId: node.id,
                                nodeName: node.data.nodeName,
                                inputName: input.name,
                            };
                        }
                    }
                }
            }
            return { isValid: true };
        },
        undo: () => { history.undo(); },
        redo: () => { history.redo(); },
        canUndo: () => history.canUndo,
        canRedo: () => history.canRedo,
        getHistoryState: () => ({
            history: history.history,
            currentHistoryIndex: history.currentHistoryIndex,
            canUndo: history.canUndo,
            canRedo: history.canRedo,
        }),
        jumpToHistoryIndex: (index: number) => { history.jumpToHistoryIndex(index); },
        clearHistory: () => { history.clearHistory(); },
        toggleExpanded: (nodeId: string) => {
            setNodes(prevNodes => {
                const idx = prevNodes.findIndex(n => n.id === nodeId);
                if (idx === -1) return prevNodes;
                const target = prevNodes[idx];
                const currentExpanded = target.isExpanded !== undefined ? target.isExpanded : true;
                return [
                    ...prevNodes.slice(0, idx),
                    { ...target, isExpanded: !currentExpanded },
                    ...prevNodes.slice(idx + 1)
                ];
            });
        },
        findAutoConnection,
        getCanvasState: () => ({ view, nodes, edges, memos }),
        loadAgentflow: (state) => {
            if (state.nodes) setNodes(state.nodes);
            if (state.edges) setEdges(state.edges);
            if (state.memos) setMemos(state.memos);
            if (state.view) setView(state.view);
            clearSelection();
            history.clearHistory();
        },
        loadCanvasState: (state) => {
            try {
                if (state.nodes) {
                    const validNodes = state.nodes
                        .filter(node => node && node.id && node.data)
                        .map(node => ({
                            ...node,
                            isExpanded: node.isExpanded !== undefined ? node.isExpanded : true,
                        }));
                    setNodes(validNodes);
                }
                if (state.edges) {
                    const validEdges = state.edges.filter(edge => edge && edge.id && edge.source && edge.target);
                    setEdges(validEdges);
                }
                if (state.memos) {
                    setMemos(state.memos.filter(memo => memo && memo.id));
                } else {
                    setMemos([]);
                }
                if (state.view) {
                    setView(state.view);
                }
            } catch (error) {
                console.error('Error during canvas state restoration:', error);
            }
        },
        loadCanvasStateWithoutView: (state) => {
            try {
                if (state.nodes) {
                    const validNodes = state.nodes
                        .filter(node => node && node.id && node.data)
                        .map(node => ({
                            ...node,
                            isExpanded: node.isExpanded !== undefined ? node.isExpanded : true,
                        }));
                    setNodes(validNodes);
                }
                if (state.edges) {
                    const validEdges = state.edges.filter(edge => edge && edge.id && edge.source && edge.target);
                    setEdges(validEdges);
                }
                if (state.memos) {
                    setMemos(state.memos.filter(memo => memo && memo.id));
                } else {
                    setMemos([]);
                }
            } catch (error) {
                console.error('Error during canvas state restoration (no view):', error);
            }
        },
        applyNodeLayout: (positions, skipHistory) => {
            if (!positions || Object.keys(positions).length === 0) return;
            const currentNodes = nodesRef.current;
            const moves: Array<{ actionType: string; nodeId: string; fromPosition: Position; toPosition: Position }> = [];
            const updatedNodes = currentNodes.map(node => {
                const nextPosition = positions[node.id];
                if (!nextPosition) return node;
                const fromPosition = node.position;
                if (fromPosition.x === nextPosition.x && fromPosition.y === nextPosition.y) return node;
                moves.push({ actionType: 'NODE_MOVE', nodeId: node.id, fromPosition, toPosition: nextPosition });
                return { ...node, position: { ...nextPosition } };
            });
            if (moves.length === 0) return;
            if (!skipHistory && historyHelpers) {
                if (moves.length === 1) {
                    historyHelpers.recordNodeMove(moves[0].nodeId, moves[0].fromPosition, moves[0].toPosition);
                } else {
                    historyHelpers.recordMultiAction(`Auto layout ${moves.length} nodes`, moves);
                }
            }
            setNodes(updatedNodes);
        },
        validateAndPrepareExecution: () => {
            for (const node of nodes) {
                const inputs = node.data?.inputs ?? [];
                for (const input of inputs) {
                    if (input.required) {
                        const hasConnection = edges.some(
                            (e) => e.target.nodeId === node.id && e.target.portId === input.id,
                        );
                        if (!hasConnection) {
                            selectNode(node.id);
                            return {
                                error: `Required input "${input.name}" is missing in node "${node.data.nodeName}"`,
                                nodeId: node.id,
                            };
                        }
                    }
                }
            }
            clearSelection();
            return { success: true };
        },
        setAvailableNodeSpecs: (specs) => {
            setNodeSpecs(specs);
        },
        setAvailableNodeCategories: (cats: NodeCategory[]) => {
            setNodeCategories(cats);
        },
        zoomIn: () => {
            zoomBy(1.2);
        },
        zoomOut: () => {
            zoomBy(1 / 1.2);
        },
        zoomBy,
        getCenteredView,
        addMemo: (position) => {
            addMemo(position);
        },
        updateNodeParameter: (nodeId, paramId, value) => {
            updateNodeParameter(nodeId, paramId, value);
        },
        updateSidebarDragPreview: (_nodeData, _clientX, _clientY) => {
            // Sidebar drag preview is handled by the page orchestrator
        },
        clearSidebarDragPreview: () => {
            // Sidebar drag preview is handled by the page orchestrator
        },
        openAddNodePopup: (position: Position) => {
            setAddNodePopup({ position });
        },
        closeAddNodePopup: () => {
            setAddNodePopup(null);
        },
    }), [
        nodes, edges, memos, view, selectedNodeIds,
        setNodes, setEdges, setMemos, setView,
        addNode, deleteNode, addEdge, removeEdge, removeNodeEdges,
        clearSelection, selectNode, updateNodeParameter, findAutoConnection,
        history, historyHelpers, zoomBy, getCenteredView, addMemo, nodeSpecs,
    ]);

    // ── Derived values ──
    const selectedNodeIdArray = useMemo(
        () => Array.from(selectedNodeIds),
        [selectedNodeIds],
    );
    const selectedEdgeIdArray = useMemo(
        () => Array.from(selectedEdgeIds),
        [selectedEdgeIds],
    );

    // ── Node callbacks ──
    const handleNodeNameChangeCallback = useCallback(
        (nodeId: string, newName: string) => updateNodeName(nodeId, newName),
        [updateNodeName],
    );

    const handleParameterChangeCallback = useCallback(
        (nodeId: string, paramId: string, value: any) => updateNodeParameter(nodeId, paramId, value),
        [updateNodeParameter],
    );

    const handleNodeToggleExpand = useCallback((nodeId: string) => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) return prevNodes;

            const targetNode = prevNodes[targetNodeIndex];
            const currentExpanded = targetNode.isExpanded !== undefined ? targetNode.isExpanded : true;

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    isExpanded: !currentExpanded
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, [setNodes]);

    const handleNodeToggleBypass = useCallback(
        (nodeId: string) => toggleBypass(nodeId),
        [toggleBypass],
    );

    // ── Context menu handlers ──
    const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - view.x) / view.scale;
        const worldY = (e.clientY - rect.top - view.y) / view.scale;
        setContextMenuState({
            position: { x: e.clientX, y: e.clientY },
            type: 'canvas',
        });
        setContextMenuWorldPosition({ x: worldX, y: worldY });
    }, [view]);

    const [contextMenuWorldPosition, setContextMenuWorldPosition] = useState<Position>({ x: 0, y: 0 });

    const handleCloseCanvasContextMenu = useCallback(() => {
        setContextMenuState(null);
    }, []);

    const handlePasteAtPosition = useCallback(() => {
        pasteNodes(contextMenuWorldPosition);
        setContextMenuState(null);
    }, [pasteNodes, contextMenuWorldPosition]);

    const handleExpandAll = useCallback(() => {
        setNodes(prevNodes => prevNodes.map(node => ({ ...node, isExpanded: true })));
        setContextMenuState(null);
    }, [setNodes]);

    const handleCollapseAll = useCallback(() => {
        setNodes(prevNodes => prevNodes.map(node => ({ ...node, isExpanded: false })));
        setContextMenuState(null);
    }, [setNodes]);

    const handleAddMemoAtPosition = useCallback((position: Position) => {
        addMemo(position);
        setContextMenuState(null);
    }, [addMemo]);

    const allNodesExpanded = useMemo(() =>
        nodes.length > 0 && nodes.every(n => n.isExpanded !== false),
        [nodes],
    );

    // ── Add-node popup handlers ──
    const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (addNodePopup) return;
        const target = e.target as HTMLElement;
        const container = containerRef.current;
        const content = contentRef.current;
        if (!container || !content) return;
        if (target.closest('[data-node-id]')) return;
        if (target.closest('[data-port-id]')) return;
        if (target.closest('[data-edge-id]')) return;
        if (target.closest('[data-memo-id]')) return;
        if (target.closest('button, input, textarea, select, a, [role="button"]')) return;
        const isDirectCanvasClick = target === container || target === content;
        if (!isDirectCanvasClick) return;
        const rect = container.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - view.x) / view.scale;
        const worldY = (e.clientY - rect.top - view.y) / view.scale;
        setAddNodePopup({ position: { x: worldX, y: worldY } });
    }, [view, addNodePopup]);

    const handleAddNodeFromPopup = useCallback((nodeData: any) => {
        if (!addNodePopup) return;
        const newNode: CanvasNode = {
            id: `${nodeData.id}-${Date.now()}`,
            data: nodeData,
            position: addNodePopup.position,
            isExpanded: true,
        };
        addNode(newNode);
        findAutoConnection(newNode.id);
        setAddNodePopup(null);
    }, [addNodePopup, addNode, findAutoConnection]);

    const handleCloseAddNodesPopup = useCallback(() => {
        setAddNodePopup(null);
    }, []);

    // ── Connectable node popup handlers (edge drop on empty canvas) ──
    const handleConnectableNodeSelect = useCallback((nodeData: NodeData) => {
        const container = containerRef.current;
        if (!container) return;

        // Place new node at viewport center
        const rect = container.getBoundingClientRect();
        const centerX = (rect.width / 2 - view.x) / view.scale;
        const centerY = (rect.height / 2 - view.y) / view.scale;
        const position = { x: centerX - 120, y: centerY - 60 };

        const newNode = createNodeFromSpec(nodeData, position);

        // Create edge between source port and new node
        const source = sourcePortForConnection;
        if (source) {
            let newEdge: CanvasEdge | null = null;

            if (isDraggingOutput && nodeData.inputs) {
                const compatibleInput = nodeData.inputs.find(input =>
                    areTypesCompatible(source.type, input.type)
                );
                if (compatibleInput) {
                    newEdge = {
                        id: `edge-${source.nodeId}:${source.portId}-${newNode.id}:${compatibleInput.id}-${Date.now()}`,
                        source: { nodeId: source.nodeId, portId: source.portId, portType: source.portType as 'input' | 'output' },
                        target: { nodeId: newNode.id, portId: compatibleInput.id, portType: 'input' },
                    };
                }
            } else if (isDraggingInput && nodeData.outputs) {
                const compatibleOutput = nodeData.outputs.find(output =>
                    areTypesCompatible(output.type, source.type)
                );
                if (compatibleOutput) {
                    newEdge = {
                        id: `edge-${newNode.id}:${compatibleOutput.id}-${source.nodeId}:${source.portId}-${Date.now()}`,
                        source: { nodeId: newNode.id, portId: compatibleOutput.id, portType: 'output' },
                        target: { nodeId: source.nodeId, portId: source.portId, portType: source.portType as 'input' | 'output' },
                    };
                }
            }

            if (newEdge && historyHelpers?.recordMultiAction) {
                historyHelpers.recordMultiAction(
                    `Created node ${newNode.data.nodeName} with edge connection`,
                    [{ actionType: 'MULTI_ACTION', nodeId: newNode.id, nodeType: newNode.data.nodeName, position: newNode.position }],
                );
                addNode(newNode, true);
                addEdge(newEdge, true);
            } else if (newEdge) {
                addNode(newNode);
                addEdge(newEdge);
            } else {
                addNode(newNode);
            }
        } else {
            addNode(newNode);
        }

        // Clean up
        setEdgePreview(null);
        clearCompatibleNodes();
    }, [
        view, sourcePortForConnection, isDraggingOutput, isDraggingInput,
        createNodeFromSpec, addNode, addEdge, setEdgePreview, clearCompatibleNodes,
        historyHelpers,
    ]);

    const handleConnectableNodesClose = useCallback(() => {
        clearCompatibleNodes();
        setEdgePreview(null);
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);
    }, [clearCompatibleNodes, setEdgePreview, setSnappedPortKey, setIsSnapTargetValid]);

    // ── Canvas container class ──
    const containerClassName = [styles.canvasContainer, className].filter(Boolean).join(' ');

    return (
        <div
            ref={containerRef}
            className={containerClassName}
            onMouseDown={readOnly ? undefined : handleCanvasMouseDown}
            onMouseMove={readOnly ? undefined : handleMouseMove}
            onMouseUp={readOnly ? undefined : handleMouseUp}
            onMouseLeave={readOnly ? undefined : () => handleMouseUp()}
            onDoubleClick={readOnly ? undefined : handleCanvasDoubleClick}
            onContextMenu={readOnly ? undefined : handleCanvasContextMenu}
        >
            {/* Transformed content layer */}
            <div
                ref={contentRef}
                className={styles.canvasGrid}
                style={{
                    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                    transformOrigin: '0 0',
                }}
            >
                {/* Nodes */}
                <CanvasNodes
                    nodes={nodes}
                    selectedNodeIds={selectedNodeIdArray}
                    onNodeMouseDown={handleNodeMouseDown}
                    onPortMouseDown={handlePortMouseDown}
                    onPortMouseUp={handlePortMouseUp}
                    registerPortRef={registerPortRef}
                    onNodeNameChange={handleNodeNameChangeCallback}
                    onNodeToggleExpand={handleNodeToggleExpand}
                    onNodeToggleBypass={handleNodeToggleBypass}
                    onParameterChange={handleParameterChangeCallback}
                    onOpenNodeModal={onOpenNodeModal}
                    onClearSelection={clearSelection}
                    snappedPortKey={snappedPortKey}
                    isSnapTargetInvalid={!isSnapTargetValid}
                    currentNodes={nodes}
                    currentEdges={edges}
                />

                {/* Edges (SVG layer) */}
                <CanvasEdges
                    edges={edges}
                    nodes={nodes}
                    portPositions={portPositions}
                    selectedEdgeIds={selectedEdgeIdArray}
                    edgePreview={edgePreview}
                    scale={view.scale}
                    onEdgeClick={(e, edgeId) => handleEdgeClick(edgeId, e)}
                />

                {/* Memos */}
                <CanvasMemos
                    memos={memos}
                    selectedMemoIds={selectedMemoIds}
                    scale={view.scale}
                    onMemoChange={(memoId, changes) => {
                        if (changes.content !== undefined) updateMemoContent(memoId, changes.content);
                        if (changes.position) updateMemoPosition(memoId, changes.position);
                    }}
                    onMemoDelete={deleteMemo}
                />

                {/* Selection box */}
                {dragState.type === 'selection-box' && dragState.selectionBox && (
                    <div
                        style={{
                            position: 'absolute',
                            left: Math.min(dragState.selectionBox.startX, dragState.selectionBox.currentX),
                            top: Math.min(dragState.selectionBox.startY, dragState.selectionBox.currentY),
                            width: Math.abs(dragState.selectionBox.currentX - dragState.selectionBox.startX),
                            height: Math.abs(dragState.selectionBox.currentY - dragState.selectionBox.startY),
                            border: '1px solid #305EEB',
                            backgroundColor: 'rgba(48, 94, 235, 0.1)',
                            pointerEvents: 'none',
                            zIndex: 1000,
                        }}
                    />
                )}
            </div>

            {/* Canvas context menu */}
            <CanvasContextMenu
                isOpen={contextMenuState !== null}
                position={contextMenuState?.position ?? { x: 0, y: 0 }}
                canPaste={copiedNodes.length > 0}
                allExpanded={allNodesExpanded}
                nodeCount={nodes.length}
                onClose={handleCloseCanvasContextMenu}
                onPaste={handlePasteAtPosition}
                onExpandAll={handleExpandAll}
                onCollapseAll={handleCollapseAll}
                onAddMemo={() => handleAddMemoAtPosition(contextMenuWorldPosition)}
            />

            {/* Add nodes popup (on double-click) */}
            <NodeSelectorPopup
                isOpen={addNodePopup !== null}
                title={t('canvas.addNode')}
                nodes={nodeSpecs}
                categories={nodeCategories.length > 0 ? nodeCategories : undefined}
                onSelectNode={handleAddNodeFromPopup}
                onClose={handleCloseAddNodesPopup}
            />

            {/* Connectable node popup (on edge drop to empty canvas) */}
            <NodeSelectorPopup
                isOpen={compatibleNodes.length > 0}
                title={t('canvas.selectConnectableNode')}
                nodes={compatibleNodes}
                onSelectNode={handleConnectableNodeSelect}
                onClose={handleConnectableNodesClose}
            />
        </div>
    );
});

export default Canvas;
