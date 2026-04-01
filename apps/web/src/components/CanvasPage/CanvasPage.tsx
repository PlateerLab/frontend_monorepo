'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { RouteComponentProps, MainFeatureModule, CanvasPagePlugin, CanvasPluginContext } from '@xgen/types';
import { FeatureRegistry } from '@xgen/types';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';

// Canvas packages
import { Canvas } from '@xgen/canvas-engine';
import type { CanvasRef } from '@xgen/canvas-engine';

// API
import {
    useNodes,
    saveWorkflow as apiSaveWorkflow,
    loadWorkflow as apiLoadWorkflow,
    checkWorkflowExistence,
    listWorkflows as apiListWorkflows,
    listWorkflowsDetail as apiListWorkflowsDetail,
    renameWorkflow as apiRenameWorkflow,
    duplicateWorkflow as apiDuplicateWorkflow,
    deleteWorkflow as apiDeleteWorkflow,
} from '@xgen/api-client';

// Canvas core UI
import {
    SideMenu,
    EditRunFloating,
    Zoombox,
    ZoomPercent,
    CanvasEmptyState,
} from '@xgen/feature-canvas-core';
import type { CanvasMode, MenuView } from '@xgen/feature-canvas-core';

// Sidebar panels
import { AddNodePanel } from '@xgen/feature-canvas-sidebar-nodes';
import { TemplatePanel } from '@xgen/feature-canvas-sidebar-templates';
import { WorkflowPanel } from '@xgen/feature-canvas-sidebar-workflows';
import { DeploymentModal } from '@xgen/feature-canvas-deploy';

import styles from './CanvasPage.module.scss';

// ── Types ──────────────────────────────────────────────────────

interface CanvasPageProps extends RouteComponentProps {
    onNavigate?: (sectionId: string) => void;
    sidebarCollapsed?: boolean;
}

interface NodeModalState {
    isOpen: boolean;
    nodeId: string;
    paramId: string;
    paramName: string;
    currentValue: string;
}

interface NodeDetailModalState {
    isOpen: boolean;
    nodeId: string;
    nodeDataId: string;
    nodeName: string;
}

// ── Storage helpers ────────────────────────────────────────────

const STORAGE_KEYS = {
    WORKFLOW_STATE: 'canvas_workflow_state',
    WORKFLOW_NAME: 'canvas_workflow_name',
    WORKFLOW_ID: 'canvas_workflowId',
} as const;

function getStoredState(key: string): any {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function setStoredState(key: string, value: any): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded — silent */ }
}

function generateWorkflowId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function validateWorkflowName(name: string): string {
    if (!name || typeof name !== 'string') return 'Workflow';
    return name.trim().replace(/[<>:"/\\|?*]/g, '_') || 'Workflow';
}

// ── Component ──────────────────────────────────────────────────

const CanvasPage: React.FC<CanvasPageProps> = ({ onNavigate, sidebarCollapsed }) => {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    // ── Refs ──
    const canvasRef = useRef<CanvasRef>(null);
    const menuRef = useRef<HTMLElement>(null);
    const directPanelRef = useRef<HTMLElement>(null);
    const latestCanvasStateRef = useRef<any>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const uiUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isRestorationComplete = useRef(false);
    const pendingWorkflowLoadRef = useRef<{ workflowData: any; workflowName: string; workflowId: string } | null>(null);
    const draggingNodeDataRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Node specs ──
    const { nodes: nodeCategories, flatNodeSpecs, isLoading: nodesLoading, error: nodesError, isInitialized: nodesInitialized, refreshNodes } = useNodes();

    // ── Core state ──
    const [canvasMode, setCanvasMode] = useState<CanvasMode>('edit');
    const [workflowId, setWorkflowId] = useState('None');
    const [workflowName, setWorkflowName] = useState('Workflow');
    const [isExecuting, setIsExecuting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [loadingCanvas, setLoadingCanvas] = useState(true);
    const [isCreatingNewWorkflow, setIsCreatingNewWorkflow] = useState(false);

    // ── Auth / ownership state ──
    const [isOwner, setIsOwner] = useState(true);
    const [workflowOriginUserId, setWorkflowOriginUserId] = useState<string | null>(null);

    // ── Deploy state ──
    const [showDeploymentModal, setShowDeploymentModal] = useState(false);
    const [workflowDetailData, setWorkflowDetailData] = useState<any>(null);

    // ── Canvas state tracking ──
    const [currentCanvasState, setCurrentCanvasState] = useState<any>(null);
    const [zoomPercent, setZoomPercent] = useState(100);

    // ── Panel states ──
    const [directPanel, setDirectPanel] = useState<MenuView | null>(null);
    const [bottomPanelExpanded, setBottomPanelExpanded] = useState(false);
    const [activeSidePanel, setActiveSidePanel] = useState<string | null>(null);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [isAutoWorkflowOpen, setIsAutoWorkflowOpen] = useState(false);

    // ── Execution state ──
    const [executionOutput, setExecutionOutput] = useState<any>(null);
    const [executionLogs, setExecutionLogs] = useState<any[]>([]);
    const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());

    // ── Modal states ──
    const [nodeModalState, setNodeModalState] = useState<NodeModalState>({
        isOpen: false, nodeId: '', paramId: '', paramName: '', currentValue: '',
    });
    const [nodeDetailModalState, setNodeDetailModalState] = useState<NodeDetailModalState>({
        isOpen: false, nodeId: '', nodeDataId: '', nodeName: '',
    });
    const [documentDropModal, setDocumentDropModal] = useState<{
        isOpen: boolean; file: File; dropX: number; dropY: number;
        targetNodeId?: string; defaultCollectionName?: string;
    } | null>(null);

    // ── Plugin context ──
    const pluginContext: CanvasPluginContext = useMemo(() => ({
        canvasRef: canvasRef as React.RefObject<any>,
        canvasMode,
        workflowId,
        workflowName,
        isExecuting,
        isSaving,
    }), [canvasMode, workflowId, workflowName, isExecuting, isSaving]);

    // ── Registered plugins ──
    const plugins = useMemo(() => FeatureRegistry.getCanvasPagePlugins(), []);

    const headerPlugin = useMemo(
        () => plugins.find((p) => p.headerComponent),
        [plugins],
    );
    const sidePanels = useMemo(
        () => plugins.flatMap((p) => p.sidePanels ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [plugins],
    );
    const bottomPanels = useMemo(
        () => plugins.flatMap((p) => p.bottomPanels ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [plugins],
    );
    const overlays = useMemo(
        () => plugins.flatMap((p) => p.overlays ?? []),
        [plugins],
    );
    const modals = useMemo(
        () => plugins.flatMap((p) => p.modals ?? []),
        [plugins],
    );

    // ── Initialization ──
    useEffect(() => {
        const timer = setTimeout(() => setLoadingCanvas(false), 100);
        return () => clearTimeout(timer);
    }, []);

    // ── Set node specs on canvas when ready ──
    useEffect(() => {
        if (nodesInitialized && flatNodeSpecs.length > 0 && canvasRef.current) {
            canvasRef.current.setAvailableNodeSpecs(flatNodeSpecs as any);
        }
    }, [nodesInitialized, flatNodeSpecs]);

    // ── Restore workflowId from session on mount ──
    useEffect(() => {
        const loadParam = searchParams?.get('load');
        if (!loadParam) {
            const savedId = getStoredState(STORAGE_KEYS.WORKFLOW_ID);
            if (savedId && savedId !== 'None') setWorkflowId(savedId);
            const savedName = getStoredState(STORAGE_KEYS.WORKFLOW_NAME);
            if (savedName) setWorkflowName(savedName);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Persist workflowId to session ──
    useEffect(() => {
        setStoredState(STORAGE_KEYS.WORKFLOW_ID, workflowId);
    }, [workflowId]);

    // ── URL-based workflow load ──
    useEffect(() => {
        const loadParam = searchParams?.get('load');
        if (!loadParam) {
            setIsCanvasReady(true);
            return;
        }
        const workflowIdToLoad = decodeURIComponent(loadParam);
        const userId = searchParams?.get('user_id') ?? undefined;

        // Determine ownership
        if (userId && user?.user_id != null && String(userId) !== String(user.user_id)) {
            setIsOwner(false);
            setWorkflowOriginUserId(userId);
        } else {
            setIsOwner(true);
            setWorkflowOriginUserId(null);
        }

        const loadFromServer = async () => {
            try {
                const result = await apiLoadWorkflow(workflowIdToLoad, userId);
                const loadedName = result.workflow_name || 'Untitled';
                setWorkflowName(loadedName);
                setStoredState(STORAGE_KEYS.WORKFLOW_NAME, loadedName);
                setWorkflowId(workflowIdToLoad);

                if (canvasRef.current) {
                    canvasRef.current.loadCanvasState(result.content || result as any);
                } else {
                    pendingWorkflowLoadRef.current = {
                        workflowData: result.content || result,
                        workflowName: loadedName,
                        workflowId: workflowIdToLoad,
                    };
                }
            } catch (error) {
                console.error('Failed to load workflow from URL:', error);
            } finally {
                setLoadingCanvas(false);
                setIsCanvasReady(true);
            }
        };
        loadFromServer();
    }, [searchParams]);

    // ── Deferred workflow load (if canvas wasn't ready) ──
    useEffect(() => {
        if (loadingCanvas || !canvasRef.current || !pendingWorkflowLoadRef.current) return;
        const pending = pendingWorkflowLoadRef.current;
        pendingWorkflowLoadRef.current = null;
        canvasRef.current.loadCanvasState(pending.workflowData);
    }, [loadingCanvas]);

    // ── Restore canvas state from session storage ──
    useEffect(() => {
        if (!isCanvasReady || !canvasRef.current || !nodesInitialized) return;
        const loadParam = searchParams?.get('load');
        if (loadParam) {
            isRestorationComplete.current = true;
            return;
        }
        const savedState = getStoredState(STORAGE_KEYS.WORKFLOW_STATE);
        if (savedState && canvasRef.current) {
            try {
                canvasRef.current.loadCanvasState(savedState);
            } catch (error) {
                console.warn('Failed to restore workflow state:', error);
            }
        }
        isRestorationComplete.current = true;
    }, [isCanvasReady, nodesInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── beforeunload — flush state to storage ──
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (latestCanvasStateRef.current) {
                setStoredState(STORAGE_KEYS.WORKFLOW_STATE, latestCanvasStateRef.current);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            if (uiUpdateTimerRef.current) clearTimeout(uiUpdateTimerRef.current);
            if (latestCanvasStateRef.current) {
                setStoredState(STORAGE_KEYS.WORKFLOW_STATE, latestCanvasStateRef.current);
            }
        };
    }, []);

    // ── Canvas event handlers ──
    const handleCanvasStateChange = useCallback((state: any) => {
        latestCanvasStateRef.current = state;
        if (!isRestorationComplete.current) return;

        // Debounced UI update
        if (uiUpdateTimerRef.current) clearTimeout(uiUpdateTimerRef.current);
        uiUpdateTimerRef.current = setTimeout(() => {
            setCurrentCanvasState(state);
            if (state?.view?.scale != null) {
                setZoomPercent(Math.round(state.view.scale * 100));
            }
            uiUpdateTimerRef.current = null;
        }, 300);

        // Debounced storage save
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            setStoredState(STORAGE_KEYS.WORKFLOW_STATE, state);
            saveTimerRef.current = null;
        }, 1000);
    }, []);

    const handleModeChange = useCallback((mode: CanvasMode) => {
        if (isExecuting) return;
        setCanvasMode(mode);
    }, [isExecuting]);

    // ── Zoom handlers ──
    const handleZoomIn = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas && typeof (canvas as any).zoomIn === 'function') {
            (canvas as any).zoomIn();
        }
    }, []);

    const handleZoomOut = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas && typeof (canvas as any).zoomOut === 'function') {
            (canvas as any).zoomOut();
        }
    }, []);

    // ── Save handler ──
    const handleSave = useCallback(async () => {
        if (isSaving || !canvasRef.current) return;
        setIsSaving(true);
        try {
            const canvasState = canvasRef.current.getCanvasState();
            const name = validateWorkflowName(workflowName);
            let currentId = workflowId;
            if (!currentId || currentId === 'None') {
                currentId = generateWorkflowId();
                setWorkflowId(currentId);
            }

            if (!canvasState.nodes || canvasState.nodes.length === 0) {
                console.warn('Cannot save empty workflow');
                setIsSaving(false);
                return;
            }

            const content = { ...canvasState, workflow_id: currentId, workflow_name: name };
            await apiSaveWorkflow(name, content, currentId, workflowOriginUserId || undefined);
            setStoredState(STORAGE_KEYS.WORKFLOW_NAME, name);
        } catch (error) {
            console.error('Failed to save workflow:', error);
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, workflowId, workflowName, workflowOriginUserId]);

    // ── Side panel toggle ──
    const handleSidePanelToggle = useCallback((panelId: string) => {
        setActiveSidePanel((prev) => (prev === panelId ? null : panelId));
    }, []);

    const handleNewWorkflow = useCallback(async () => {
        if (isCreatingNewWorkflow) return;
        setIsCreatingNewWorkflow(true);

        try {
            const hasCurrentWork = canvasRef.current &&
                (canvasRef.current.getCanvasState().nodes.length > 0 || canvasRef.current.getCanvasState().edges.length > 0);

            if (hasCurrentWork && !window.confirm(t('canvas.confirmNewWorkflow', 'Start a new workflow? Unsaved changes may be lost.'))) {
                return;
            }

            let newName = 'Workflow';
            try {
                const existing = await apiListWorkflows();
                let index = 1;
                while (existing.includes(newName)) {
                    index += 1;
                    newName = `Workflow ${index}`;
                }
            } catch {
                // Keep default name on API failure
            }

            const newId = generateWorkflowId();
            setWorkflowId(newId);
            setWorkflowName(newName);
            setStoredState(STORAGE_KEYS.WORKFLOW_ID, newId);
            setStoredState(STORAGE_KEYS.WORKFLOW_NAME, newName);
            setStoredState(STORAGE_KEYS.WORKFLOW_STATE, null);
            isRestorationComplete.current = true;

            // Reset ownership
            setIsOwner(true);
            setWorkflowOriginUserId(null);

            if (canvasRef.current) {
                const centeredView = canvasRef.current.getCenteredView();
                canvasRef.current.loadWorkflow({ nodes: [], edges: [], memos: [], view: centeredView });
            }
        } finally {
            setIsCreatingNewWorkflow(false);
        }
    }, [t, isCreatingNewWorkflow]);

    const handleExport = useCallback(() => {
        if (!canvasRef.current) return;
        const canvasState = canvasRef.current.getCanvasState();
        const name = validateWorkflowName(workflowName);
        const exportData = {
            workflow_name: name,
            workflow_id: workflowId !== 'None' ? workflowId : generateWorkflowId(),
            view: canvasState.view || { x: 0, y: 0, scale: 1 },
            nodes: canvasState.nodes || [],
            edges: canvasState.edges || [],
            memos: canvasState.memos || [],
        };
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${name}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [workflowId, workflowName]);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const importedName = validateWorkflowName(parsed.workflow_name || file.name.replace(/\.json$/i, ''));
            const newId = generateWorkflowId();
            const nextState = {
                ...parsed,
                workflow_id: newId,
                workflow_name: importedName,
            };
            if (canvasRef.current) {
                canvasRef.current.loadCanvasState(nextState);
            }
            setWorkflowId(newId);
            setWorkflowName(importedName);
            setStoredState(STORAGE_KEYS.WORKFLOW_ID, newId);
            setStoredState(STORAGE_KEYS.WORKFLOW_NAME, importedName);
            setStoredState(STORAGE_KEYS.WORKFLOW_STATE, nextState);
        } catch (error) {
            console.error('Failed to import workflow:', error);
        } finally {
            e.target.value = '';
        }
    }, []);

    // ── Empty state actions ──
    const handleEmptyAddStartNode = useCallback(() => {
        setDirectPanel('addNodes');
    }, []);

    const handleEmptyTemplateStart = useCallback(() => {
        setDirectPanel('template');
    }, []);

    const handleEmptyAICreate = useCallback(() => {
        setIsAutoWorkflowOpen(true);
    }, []);

    // ── Header action handlers ──
    const handleAddNodeClick = useCallback(() => {
        setDirectPanel((prev) => prev === 'addNodes' ? null : 'addNodes');
    }, []);

    const handleTemplateStart = useCallback(() => {
        setDirectPanel((prev) => prev === 'template' ? null : 'template');
    }, []);

    const handleAutoWorkflowClick = useCallback(() => {
        setIsAutoWorkflowOpen(true);
    }, []);

    const handleImportWorkflow = useCallback(() => {
        setDirectPanel((prev) => prev === 'workflow' ? null : 'workflow');
    }, []);

    const handleFileInputClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleWorkflowNameChange = useCallback((name: string) => {
        setWorkflowName(name);
        setStoredState(STORAGE_KEYS.WORKFLOW_NAME, name);
    }, []);

    const handleDuplicate = useCallback(async () => {
        if (!canvasRef.current) return;
        try {
            const sourceUserId = isOwner
                ? (user?.user_id != null ? String(user.user_id) : undefined)
                : (workflowOriginUserId || undefined);

            const checkResult = await checkWorkflowExistence(workflowName);
            if (checkResult.exists && workflowId !== 'None') {
                // Workflow exists in DB — duplicate directly
                const result = await apiDuplicateWorkflow(workflowId, sourceUserId);
                if (result?.workflow_id) {
                    const currentUserId = user?.user_id != null ? String(user.user_id) : undefined;
                    const loadedData = await apiLoadWorkflow(result.workflow_id, currentUserId);
                    if (loadedData && canvasRef.current) {
                        const loadName = result.workflow_name || loadedData.workflow_name || `${workflowName} (copy)`;
                        const loadContent = loadedData.content || loadedData;
                        canvasRef.current.loadCanvasState(loadContent as any);
                        setWorkflowName(loadName);
                        setWorkflowId(result.workflow_id);
                        setStoredState(STORAGE_KEYS.WORKFLOW_NAME, loadName);
                        setStoredState(STORAGE_KEYS.WORKFLOW_ID, result.workflow_id);
                        // Now we own the copy
                        setIsOwner(true);
                        setWorkflowOriginUserId(null);
                    }
                }
            } else {
                // Workflow not saved to DB yet — ask to save first
                const userConfirmed = window.confirm(
                    t('canvas.saveBeforeCopy', '워크플로우를 복사하려면 먼저 저장해야 합니다. 저장하시겠습니까?'),
                );
                if (!userConfirmed) return;

                // Save first
                const canvasState = canvasRef.current.getCanvasState();
                let currentId = workflowId;
                if (!currentId || currentId === 'None') {
                    currentId = generateWorkflowId();
                    setWorkflowId(currentId);
                }
                const name = validateWorkflowName(workflowName);
                const content = { ...canvasState, workflow_id: currentId, workflow_name: name };
                await apiSaveWorkflow(name, content, currentId, workflowOriginUserId || undefined);

                // Then duplicate
                const result = await apiDuplicateWorkflow(currentId, sourceUserId);
                if (result?.workflow_id) {
                    const currentUserId = user?.user_id != null ? String(user.user_id) : undefined;
                    const loadedData = await apiLoadWorkflow(result.workflow_id, currentUserId);
                    if (loadedData && canvasRef.current) {
                        const loadName = result.workflow_name || loadedData.workflow_name || `${name} (copy)`;
                        const loadContent = loadedData.content || loadedData;
                        canvasRef.current.loadCanvasState(loadContent as any);
                        setWorkflowName(loadName);
                        setWorkflowId(result.workflow_id);
                        setStoredState(STORAGE_KEYS.WORKFLOW_NAME, loadName);
                        setStoredState(STORAGE_KEYS.WORKFLOW_ID, result.workflow_id);
                        setIsOwner(true);
                        setWorkflowOriginUserId(null);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to duplicate workflow:', error);
        }
    }, [workflowName, workflowId, workflowOriginUserId, isOwner, user, t]);

    // ── Node modal handlers ──
    const handleOpenNodeModal = useCallback((nodeId: string, paramId: string, paramName: string, currentValue: string) => {
        setNodeModalState({ isOpen: true, nodeId, paramId, paramName, currentValue });
    }, []);

    const handleCloseNodeModal = useCallback(() => {
        setNodeModalState({ isOpen: false, nodeId: '', paramId: '', paramName: '', currentValue: '' });
    }, []);

    const handleSaveNodeModal = useCallback((value: string) => {
        if (canvasRef.current && nodeModalState.nodeId && nodeModalState.paramId) {
            (canvasRef.current as any).updateNodeParameter?.(
                nodeModalState.nodeId,
                nodeModalState.paramId,
                value,
            );
        }
        handleCloseNodeModal();
    }, [nodeModalState, handleCloseNodeModal]);

    // ── Node detail modal handlers ──
    const handleOpenNodeDetailModal = useCallback((nodeId: string, nodeDataId: string, nodeName: string) => {
        setNodeDetailModalState({ isOpen: true, nodeId, nodeDataId, nodeName });
    }, []);

    const handleCloseNodeDetailModal = useCallback(() => {
        setNodeDetailModalState({ isOpen: false, nodeId: '', nodeDataId: '', nodeName: '' });
    }, []);

    // ── Workflow load handler ──
    const handleLoadWorkflow = useCallback((workflowData: any, name?: string, id?: string) => {
        if (canvasRef.current) {
            canvasRef.current.loadWorkflow(workflowData);
        }
        if (name) {
            setWorkflowName(name);
            setStoredState(STORAGE_KEYS.WORKFLOW_NAME, name);
        }
        if (id) {
            setWorkflowId(id);
            setStoredState(STORAGE_KEYS.WORKFLOW_ID, id);
        }
    }, []);

    // ── Execution handlers ──
    const handleClearOutput = useCallback(() => setExecutionOutput(null), []);
    const handleClearLogs = useCallback(() => setExecutionLogs([]), []);

    // ── Sidebar node panel handlers ──
    const handleAddNodeToCenter = useCallback((nodeData: any) => {
        if (!canvasRef.current) return;
        const view = canvasRef.current.getView();
        // Add node to center of visible area
        const centerX = (window.innerWidth / 2 - view.x) / view.scale;
        const centerY = (window.innerHeight / 2 - view.y) / view.scale;
        canvasRef.current.addNode({
            id: `${nodeData.id}-${Date.now()}`,
            data: nodeData,
            position: { x: centerX, y: centerY },
            isExpanded: true,
        } as any);
    }, []);

    const handleSidebarDragStart = useCallback((nodeData: any) => {
        draggingNodeDataRef.current = nodeData;
    }, []);

    const handleSidebarDragEnd = useCallback(() => {
        draggingNodeDataRef.current = null;
    }, []);

    // ── Drag and drop handlers ──
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const hasFiles = e.dataTransfer.types.includes('Files');
        const hasJson = e.dataTransfer.types.includes('application/json');
        if (hasFiles || hasJson) {
            e.dataTransfer.dropEffect = 'copy';
        }
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.name.toLowerCase().endsWith('.json')) {
                try {
                    const text = await file.text();
                    const parsed = JSON.parse(text);
                    const importedName = validateWorkflowName(parsed.workflow_name || file.name.replace(/\.json$/i, ''));
                    const newId = generateWorkflowId();
                    const nextState = {
                        ...parsed,
                        workflow_id: newId,
                        workflow_name: importedName,
                    };
                    if (canvasRef.current) {
                        canvasRef.current.loadCanvasState(nextState);
                    }
                    setWorkflowId(newId);
                    setWorkflowName(importedName);
                    setStoredState(STORAGE_KEYS.WORKFLOW_ID, newId);
                    setStoredState(STORAGE_KEYS.WORKFLOW_NAME, importedName);
                    setStoredState(STORAGE_KEYS.WORKFLOW_STATE, nextState);
                    return;
                } catch (error) {
                    console.error('Failed to import dropped workflow:', error);
                    return;
                }
            }

            setDocumentDropModal({
                isOpen: true,
                file,
                dropX: e.clientX,
                dropY: e.clientY,
            });
            return;
        }

        try {
            const jsonData = e.dataTransfer.getData('application/json');
            const textData = e.dataTransfer.getData('text/plain');
            const raw = jsonData || textData;
            if (!raw || !canvasRef.current) return;
            const nodeData = JSON.parse(raw);
            if (nodeData && nodeData.id) {
                const rect = e.currentTarget.getBoundingClientRect();
                const view = canvasRef.current.getView();
                const position = {
                    x: (e.clientX - rect.left - view.x) / view.scale,
                    y: (e.clientY - rect.top - view.y) / view.scale,
                };
                canvasRef.current.addNode({
                    id: `${nodeData.id}-${Date.now()}`,
                    data: nodeData,
                    position,
                    isExpanded: true,
                } as any);
            }
        } catch (error) {
            console.error('Failed to drop node:', error);
        }
    }, []);

    // ── Wrapped panel components for SideMenu ──
    const AddNodePanelWrapped = useMemo(() => {
        const Wrapped: React.FC<{ onBack: () => void }> = ({ onBack }) => (
            <AddNodePanel
                onBack={onBack}
                nodeSpecs={nodeCategories}
                nodesLoading={nodesLoading}
                nodesError={nodesError ?? null}
                onRefreshNodes={refreshNodes}
                onAddNodeToCenter={handleAddNodeToCenter}
                onSidebarDragStart={handleSidebarDragStart}
                onSidebarDragEnd={handleSidebarDragEnd}
            />
        );
        Wrapped.displayName = 'AddNodePanelWrapped';
        return Wrapped;
    }, [nodeCategories, nodesLoading, nodesError, refreshNodes, handleAddNodeToCenter, handleSidebarDragStart, handleSidebarDragEnd]);

    const TemplatePanelWrapped = useMemo(() => {
        const Wrapped: React.FC<{ onBack: () => void }> = ({ onBack }) => (
            <TemplatePanel
                onBack={onBack}
                onLoadWorkflow={handleLoadWorkflow}
                fetchTemplates={apiListWorkflowsDetail}
                createNewWorkflowId={generateWorkflowId}
                hasCurrentWorkflow={() => {
                    if (!canvasRef.current) return false;
                    const state = canvasRef.current.getCanvasState();
                    return (state.nodes?.length ?? 0) > 0;
                }}
            />
        );
        Wrapped.displayName = 'TemplatePanelWrapped';
        return Wrapped;
    }, [handleLoadWorkflow]);

    const WorkflowPanelWrapped = useMemo(() => {
        const Wrapped: React.FC<{ onBack: () => void }> = ({ onBack }) => (
            <WorkflowPanel
                onBack={onBack}
                onLoad={handleFileInputClick}
                onExport={handleExport}
                onLoadWorkflow={handleLoadWorkflow}
                fetchWorkflowsDetail={apiListWorkflowsDetail}
                loadWorkflowById={async (wfId: string, userId: number) => {
                    const result = await apiLoadWorkflow(wfId, userId);
                    return result.content || result;
                }}
                deleteWorkflowById={apiDeleteWorkflow}
                hasCurrentWorkflow={() => {
                    if (!canvasRef.current) return false;
                    const state = canvasRef.current.getCanvasState();
                    return (state.nodes?.length ?? 0) > 0;
                }}
            />
        );
        Wrapped.displayName = 'WorkflowPanelWrapped';
        return Wrapped;
    }, [handleFileInputClick, handleExport, handleLoadWorkflow]);

    // ── Deploy handler ──
    const handleDeploy = useCallback(() => {
        if (!canvasRef.current) return;
        const canvasState = canvasRef.current.getCanvasState();
        setWorkflowDetailData(canvasState);
        setShowDeploymentModal(true);
    }, []);

    // ── Active side panel component ──
    const ActiveSidePanelComponent = useMemo(() => {
        if (!activeSidePanel) return null;
        const panel = sidePanels.find((p) => p.id === activeSidePanel);
        return panel?.component ?? null;
    }, [activeSidePanel, sidePanels]);

    // ── Keyboard shortcuts (Ctrl+S) ──
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    // ── Backspace prevention ──
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === 'Backspace' &&
                e.target instanceof HTMLElement &&
                e.target.tagName !== 'INPUT' &&
                e.target.tagName !== 'SELECT' &&
                e.target.tagName !== 'TEXTAREA' &&
                !e.target.isContentEditable
            ) {
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ── Loading state ──
    if (loadingCanvas) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p className={styles.loadingText}>{t('canvas.loading', 'Canvas를 불러오는 중...')}</p>
            </div>
        );
    }

    // ── Header component ──
    const HeaderComponent = headerPlugin?.headerComponent;

    // ── Check for empty canvas ──
    const isCanvasEmpty = currentCanvasState != null &&
        (!currentCanvasState.nodes || currentCanvasState.nodes.length === 0);

    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            {HeaderComponent && (
                <HeaderComponent
                    {...pluginContext}
                    onSave={handleSave}
                    onNewWorkflow={handleNewWorkflow}
                    onDeploy={handleDeploy}
                    onDuplicate={handleDuplicate}
                    onTemplateStart={handleTemplateStart}
                    onAddNodeClick={handleAddNodeClick}
                    onAutoWorkflowClick={handleAutoWorkflowClick}
                    onImportWorkflow={handleImportWorkflow}
                    onWorkflowNameChange={handleWorkflowNameChange}
                    isOwner={isOwner}
                    renameWorkflow={apiRenameWorkflow}
                    checkWorkflowExistence={checkWorkflowExistence}
                    listWorkflows={apiListWorkflows}
                    sidebarLayout={{ isOpen: !sidebarCollapsed }}
                />
            )}

            {/* Main content area */}
            <main className={styles.mainContent}>
                {/* Edit / Run floating toggle */}
                <EditRunFloating
                    mode={canvasMode}
                    onModeChange={handleModeChange}
                    disabled={isExecuting}
                />

                {/* Canvas area */}
                <div
                    className={styles.canvasWrapper}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <Canvas
                        ref={canvasRef}
                        onStateChange={handleCanvasStateChange}
                        onOpenNodeModal={handleOpenNodeModal}
                        onViewDetails={handleOpenNodeDetailModal}
                    />

                    {/* Empty state overlay */}
                    {isCanvasEmpty && (
                        <CanvasEmptyState
                            onAddStartNode={handleEmptyAddStartNode}
                            onTemplateStart={handleEmptyTemplateStart}
                            onAICreate={handleEmptyAICreate}
                        />
                    )}

                    {/* Zoom controls */}
                    <div
                        className={styles.zoomControls}
                        style={{ bottom: bottomPanelExpanded ? 312 : 54 }}
                    >
                        <Zoombox
                            inline
                            onZoomIn={handleZoomIn}
                            onZoomOut={handleZoomOut}
                        />
                        <ZoomPercent value={zoomPercent} />
                    </div>
                </div>

                {/* Side panel (plugin-based) */}
                {ActiveSidePanelComponent && (
                    <aside className={styles.sidePanel}>
                        <ActiveSidePanelComponent
                            {...pluginContext}
                            nodeSpecs={nodeCategories}
                            nodesLoading={nodesLoading}
                            nodesError={nodesError}
                            onRefreshNodes={refreshNodes}
                            onAddNodeToCenter={handleAddNodeToCenter}
                            onSidebarDragStart={handleSidebarDragStart}
                            onSidebarDragEnd={handleSidebarDragEnd}
                            onClose={() => setActiveSidePanel(null)}
                            onLoadWorkflow={handleLoadWorkflow}
                        />
                    </aside>
                )}

                {/* Direct panel (from SideMenu navigation) */}
                {directPanel && (
                    <SideMenu
                        menuRef={menuRef}
                        initialView={directPanel}
                        AddNodePanel={AddNodePanelWrapped}
                        TemplatePanel={TemplatePanelWrapped}
                        WorkflowPanel={WorkflowPanelWrapped}
                    />
                )}

                {/* Bottom panels */}
                {bottomPanels.length > 0 && (
                    <div className={styles.bottomPanel}>
                        {bottomPanels.map((panel) => {
                            const PanelComponent = panel.component;
                            return (
                                <PanelComponent
                                    key={panel.id}
                                    {...pluginContext}
                                    isExpanded={bottomPanelExpanded}
                                    onToggleExpand={() => setBottomPanelExpanded((prev) => !prev)}
                                />
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Overlays (AutoWorkflow sidebar, History panel, etc.) */}
            {overlays.map((overlay) => {
                const OverlayComponent = overlay.component;
                const isOpen =
                    overlay.id === 'auto-workflow-sidebar' ? isAutoWorkflowOpen :
                    overlay.id === 'history-panel' ? isHistoryPanelOpen :
                    false;
                const onClose =
                    overlay.id === 'auto-workflow-sidebar' ? () => setIsAutoWorkflowOpen(false) :
                    overlay.id === 'history-panel' ? () => setIsHistoryPanelOpen(false) :
                    () => {};
                const extraProps: Record<string, unknown> = {};
                if (overlay.id === 'auto-workflow-sidebar') {
                    extraProps.onLoadWorkflow = handleLoadWorkflow;
                    extraProps.getCanvasState = () => canvasRef.current?.getCanvasState();
                }
                return (
                    <OverlayComponent
                        key={overlay.id}
                        {...pluginContext}
                        isOpen={isOpen}
                        onClose={onClose}
                        {...extraProps}
                    />
                );
            })}

            {/* Modals */}
            {modals.map((modal) => {
                const ModalComponent = modal.component;
                let isOpen = false;
                let data: unknown;
                let onClose = () => {};

                if (modal.id === 'node-detail-modal') {
                    isOpen = nodeDetailModalState.isOpen;
                    data = nodeDetailModalState;
                    onClose = handleCloseNodeDetailModal;
                } else if (modal.id === 'document-drop-modal') {
                    isOpen = documentDropModal?.isOpen ?? false;
                    data = documentDropModal;
                    onClose = () => setDocumentDropModal(null);
                }

                if (!isOpen) return null;

                return (
                    <ModalComponent
                        key={modal.id}
                        {...pluginContext}
                        isOpen={isOpen}
                        data={data}
                        onClose={onClose}
                    />
                );
            })}

            {/* Deploy Modal */}
            <DeploymentModal
                isOpen={showDeploymentModal}
                onClose={() => setShowDeploymentModal(false)}
                workflow={{ id: workflowId, name: workflowName, user_id: workflowOriginUserId || user?.user_id }}
                workflowDetail={workflowDetailData}
            />

            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
        </div>
    );
};

// ── Feature Module Export ───────────────────────────────────────

export const canvasEditorFeature: MainFeatureModule = {
    id: 'canvas-editor',
    name: 'Canvas Editor',
    sidebarSection: 'workflow',
    sidebarItems: [],
    routes: {
        'canvas-editor': CanvasPage,
    },
    requiresAuth: true,
};

export { CanvasPage };
export default canvasEditorFeature;
