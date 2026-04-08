'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { RouteComponentProps, MainFeatureModule, CanvasPagePlugin, CanvasPluginContext } from '@xgen/types';
import { FeatureRegistry } from '@xgen/types';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { useToast } from '@xgen/ui';

// Canvas packages
import { Canvas } from '@xgen/canvas-engine';
import type { CanvasRef, CanvasHistoryState } from '@xgen/canvas-engine';

// API
import {
    useNodes,
    saveAgentflow as apiSaveAgentflow,
    loadAgentflow as apiLoadAgentflow,
    checkAgentflowExistence,
    listAgentflows as apiListAgentflows,
    listAgentflowsDetail as apiListAgentflowsDetail,
    renameAgentflow as apiRenameAgentflow,
    duplicateAgentflow as apiDuplicateAgentflow,
    deleteAgentflow as apiDeleteAgentflow,
    executeAgentflowStream,
    getAgentflowExecutionOrderByData,
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
import { AgentflowPanel } from '@xgen/feature-canvas-sidebar-agentflows';
import { DeploymentModal } from '@xgen/feature-canvas-deploy';
import { TutorialOverlay, TutorialPanel as TutorialPanelComponent } from '@xgen/feature-canvas-tutorial';
import type { TutorialData } from '@xgen/feature-canvas-tutorial';

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

function generateAgentflowId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function validateAgentflowName(name: string): string {
    if (!name || typeof name !== 'string') return 'Agentflow';
    return name.trim().replace(/[<>:"/\\|?*]/g, '_') || 'Agentflow';
}

// ── Component ──────────────────────────────────────────────────

const CanvasPage: React.FC<CanvasPageProps> = ({ onNavigate, sidebarCollapsed }) => {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { toast } = useToast();

    // ── Refs ──
    const canvasRef = useRef<CanvasRef>(null);
    const menuRef = useRef<HTMLElement>(null);
    const directPanelRef = useRef<HTMLElement>(null);
    const latestCanvasStateRef = useRef<any>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const uiUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const executionAbortRef = useRef<AbortController | null>(null);
    const isRestorationComplete = useRef(false);
    const pendingAgentflowLoadRef = useRef<{ workflowData: any; workflowName: string; workflowId: string } | null>(null);
    const draggingNodeDataRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Node specs ──
    const { nodes: nodeCategories, flatNodeSpecs, isLoading: nodesLoading, error: nodesError, isInitialized: nodesInitialized, refreshNodes } = useNodes();

    // ── Core state ──
    const [canvasMode, setCanvasMode] = useState<CanvasMode>('edit');
    const [workflowId, setAgentflowId] = useState('None');
    const [workflowName, setAgentflowName] = useState('Agentflow');
    const [isExecuting, setIsExecuting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [loadingCanvas, setLoadingCanvas] = useState(true);
    const [isCreatingNewAgentflow, setIsCreatingNewAgentflow] = useState(false);

    // ── Auth / ownership state ──
    const [isOwner, setIsOwner] = useState(true);
    const [workflowOriginUserId, setAgentflowOriginUserId] = useState<string | null>(null);

    // ── Deploy state ──
    const [showDeploymentModal, setShowDeploymentModal] = useState(false);
    const [workflowDetailData, setAgentflowDetailData] = useState<any>(null);

    // ── Canvas state tracking ──
    const [currentCanvasState, setCurrentCanvasState] = useState<any>(null);
    const [zoomPercent, setZoomPercent] = useState(100);

    // ── Panel states ──
    const [directPanel, setDirectPanel] = useState<MenuView | null>(null);
    const [bottomPanelExpanded, setBottomPanelExpanded] = useState(false);
    const [activeSidePanel, setActiveSidePanel] = useState<string | null>(null);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [isAutoAgentflowOpen, setIsAutoAgentflowOpen] = useState(false);
    const [historyState, setHistoryState] = useState<CanvasHistoryState>({
        history: [], currentHistoryIndex: -1, canUndo: false, canRedo: false,
    });

    // ── Execution state ──
    const [executionOutput, setExecutionOutput] = useState<any>(null);
    const [executionLogs, setExecutionLogs] = useState<any[]>([]);
    const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
    const [executionSource, setExecutionSource] = useState<'button' | 'chat' | null>(null);

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

    // ── Tutorial state ──
    const [tutorialData, setTutorialData] = useState<TutorialData | null>(null);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [isTutorialAnimating, setIsTutorialAnimating] = useState(false);

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
            if (savedId && savedId !== 'None') setAgentflowId(savedId);
            const savedName = getStoredState(STORAGE_KEYS.WORKFLOW_NAME);
            if (savedName) setAgentflowName(savedName);
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
            setAgentflowOriginUserId(userId);
        } else {
            setIsOwner(true);
            setAgentflowOriginUserId(null);
        }

        const loadFromServer = async () => {
            try {
                const result = await apiLoadAgentflow(workflowIdToLoad, userId);
                const loadedName = result.workflow_name || 'Untitled';
                setAgentflowName(loadedName);
                setStoredState(STORAGE_KEYS.WORKFLOW_NAME, loadedName);
                setAgentflowId(workflowIdToLoad);

                if (canvasRef.current) {
                    canvasRef.current.loadCanvasState(result.content || result as any);
                } else {
                    pendingAgentflowLoadRef.current = {
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
        if (loadingCanvas || !canvasRef.current || !pendingAgentflowLoadRef.current) return;
        const pending = pendingAgentflowLoadRef.current;
        pendingAgentflowLoadRef.current = null;
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
            if (executionAbortRef.current) executionAbortRef.current.abort();
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

    const handleExecuteRef = useRef<((inputText?: string) => Promise<void>) | undefined>(undefined);

    const handleModeChange = useCallback((mode: CanvasMode) => {
        if (isExecuting) return;
        setCanvasMode(mode);
        if (mode === 'run') {
            handleExecuteRef.current?.();
        }
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

        const canvasState = canvasRef.current.getCanvasState();
        if (!canvasState.nodes || canvasState.nodes.length === 0) {
            toast.warning(t('canvas.toast.emptyAgentflow'));
            setIsSaving(false);
            return;
        }

        try {
            const name = validateAgentflowName(workflowName);

            // Always check existence before saving
            const checkResult = await checkAgentflowExistence(name);
            if (checkResult.exists) {
                const overwrite = await toast.confirm({
                    title: t('canvas.toast.overwriteTitle'),
                    message: t('canvas.toast.overwriteMessage', { name }),
                    confirmText: t('canvas.toast.overwriteConfirm'),
                    cancelText: t('canvas.toast.cancel'),
                    variant: 'warning',
                    enableKeyboard: true,
                    keyboardHint: '💡 Enter → 덮어쓰기 | ESC → 취소',
                });
                if (!overwrite) {
                    setIsSaving(false);
                    return;
                }
            }

            let currentId = workflowId;
            if (!currentId || currentId === 'None') {
                currentId = generateAgentflowId();
                setAgentflowId(currentId);
            }

            const loadingId = toast.loading(t('canvas.toast.saving'));
            const content = { ...canvasState, workflow_id: currentId, workflow_name: name };
            await apiSaveAgentflow(name, content, currentId, workflowOriginUserId || undefined);
            setStoredState(STORAGE_KEYS.WORKFLOW_NAME, name);

            toast.update(loadingId, 'success', t('canvas.toast.saveSuccess'));
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            toast.error(`${t('canvas.toast.saveFailed')}: ${errMsg}`);
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, workflowId, workflowName, workflowOriginUserId, toast, t]);

    // ── Side panel toggle ──
    const handleSidePanelToggle = useCallback((panelId: string) => {
        setActiveSidePanel((prev) => (prev === panelId ? null : panelId));
    }, []);

    const handleNewAgentflow = useCallback(async () => {
        if (isCreatingNewAgentflow) return;

        const hasCurrentWork = canvasRef.current &&
            (canvasRef.current.getCanvasState().nodes.length > 0 || canvasRef.current.getCanvasState().edges.length > 0);

        if (hasCurrentWork) {
            const confirmed = await toast.confirm({
                title: t('canvas.toast.newAgentflowTitle'),
                message: t('canvas.toast.newAgentflowMessage'),
                confirmText: t('canvas.toast.newAgentflowConfirm'),
                cancelText: t('canvas.toast.cancel'),
                variant: 'warning',
                enableKeyboard: true,
                keyboardHint: '💡 Enter키를 누르면 계속됩니다 | ESC로 취소',
            });
            if (!confirmed) return;
        }

        setIsCreatingNewAgentflow(true);
        try {
            let newName = 'Agentflow';
            try {
                const existing = await apiListAgentflows();
                let index = 1;
                while (existing.includes(newName)) {
                    index += 1;
                    newName = `Agentflow ${index}`;
                }
            } catch {
                // Keep default name on API failure
            }

            const newId = generateAgentflowId();
            setAgentflowId(newId);
            setAgentflowName(newName);
            setStoredState(STORAGE_KEYS.WORKFLOW_ID, newId);
            setStoredState(STORAGE_KEYS.WORKFLOW_NAME, newName);
            setStoredState(STORAGE_KEYS.WORKFLOW_STATE, null);
            isRestorationComplete.current = true;

            // Reset ownership
            setIsOwner(true);
            setAgentflowOriginUserId(null);

            if (canvasRef.current) {
                const centeredView = canvasRef.current.getCenteredView();
                canvasRef.current.loadAgentflow({ nodes: [], edges: [], memos: [], view: centeredView });
            }

            toast.success(t('canvas.toast.newAgentflowCreated'));
        } finally {
            setIsCreatingNewAgentflow(false);
        }
    }, [t, isCreatingNewAgentflow, toast]);

    const handleExport = useCallback(() => {
        if (!canvasRef.current) return;
        try {
            const canvasState = canvasRef.current.getCanvasState();
            const name = validateAgentflowName(workflowName);
            const exportData = {
                workflow_name: name,
                workflow_id: workflowId !== 'None' ? workflowId : generateAgentflowId(),
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
            toast.success(t('canvas.toast.exportSuccess'));
        } catch (error) {
            toast.error(t('canvas.toast.exportFailed'));
        }
    }, [workflowId, workflowName, toast, t]);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const importedName = validateAgentflowName(parsed.workflow_name || file.name.replace(/\.json$/i, ''));
            const newId = generateAgentflowId();
            const nextState = {
                ...parsed,
                workflow_id: newId,
                workflow_name: importedName,
            };
            if (canvasRef.current) {
                canvasRef.current.loadCanvasState(nextState);
            }
            setAgentflowId(newId);
            setAgentflowName(importedName);
            setStoredState(STORAGE_KEYS.WORKFLOW_ID, newId);
            setStoredState(STORAGE_KEYS.WORKFLOW_NAME, importedName);
            setStoredState(STORAGE_KEYS.WORKFLOW_STATE, nextState);
            toast.success(t('canvas.toast.importSuccess', { name: importedName }));
        } catch (error) {
            toast.error(t('canvas.toast.importFailed'));
        } finally {
            e.target.value = '';
        }
    }, [toast, t]);

    // ── Empty state actions ──
    const handleEmptyAddStartNode = useCallback(() => {
        setDirectPanel('addNodes');
    }, []);

    const handleEmptyTemplateStart = useCallback(() => {
        setDirectPanel('template');
    }, []);

    // ── Header action handlers ──
    const handleAddNodeClick = useCallback(() => {
        setDirectPanel((prev) => prev === 'addNodes' ? null : 'addNodes');
    }, []);

    const handleTemplateStart = useCallback(() => {
        setDirectPanel((prev) => prev === 'template' ? null : 'template');
    }, []);

    const handleAutoAgentflowClick = useCallback(() => {
        setIsAutoAgentflowOpen(true);
    }, []);

    const handleHistoryClick = useCallback(() => {
        setIsHistoryPanelOpen((prev) => !prev);
    }, []);

    const handleHistoryChange = useCallback((state: CanvasHistoryState) => {
        setHistoryState(state);
    }, []);

    const handleImportAgentflow = useCallback(() => {
        setDirectPanel((prev) => prev === 'workflow' ? null : 'workflow');
    }, []);

    const handleFileInputClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleAgentflowNameChange = useCallback((name: string) => {
        setAgentflowName(name);
        setStoredState(STORAGE_KEYS.WORKFLOW_NAME, name);
    }, []);

    const handleDuplicate = useCallback(async () => {
        if (!canvasRef.current) return;

        const sourceUserId = isOwner
            ? (user?.user_id != null ? String(user.user_id) : undefined)
            : (workflowOriginUserId || undefined);

        try {
            const checkResult = await checkAgentflowExistence(workflowName);
            const isSavedInDB = checkResult.exists && workflowId !== 'None';

            if (!isSavedInDB) {
                // Agentflow not saved — must save before copying
                const userConfirmed = await toast.confirm({
                    title: t('canvas.toast.saveBeforeCopyTitle'),
                    message: t('canvas.toast.saveBeforeCopyMessage'),
                    confirmText: t('canvas.toast.saveAndCopy'),
                    cancelText: t('canvas.toast.cancel'),
                    variant: 'warning',
                    enableKeyboard: true,
                    keyboardHint: '💡 Enter → 저장 후 복사 | ESC → 취소',
                });
                if (!userConfirmed) return;

                const savingId = toast.loading(t('canvas.toast.savingAndDuplicating'));

                // Save first
                const canvasState = canvasRef.current.getCanvasState();
                let currentId = workflowId;
                if (!currentId || currentId === 'None') {
                    currentId = generateAgentflowId();
                    setAgentflowId(currentId);
                }
                const name = validateAgentflowName(workflowName);
                const content = { ...canvasState, workflow_id: currentId, workflow_name: name };
                await apiSaveAgentflow(name, content, currentId, workflowOriginUserId || undefined);

                // Then duplicate
                const result = await apiDuplicateAgentflow(currentId, sourceUserId);
                if (result?.workflow_id) {
                    const currentUserId = user?.user_id != null ? String(user.user_id) : undefined;
                    const loadedData = await apiLoadAgentflow(result.workflow_id, currentUserId);
                    if (loadedData && canvasRef.current) {
                        const loadName = result.workflow_name || loadedData.workflow_name || `${name} (copy)`;
                        const loadContent = loadedData.content || loadedData;
                        canvasRef.current.loadCanvasState(loadContent as any);
                        setAgentflowName(loadName);
                        setAgentflowId(result.workflow_id);
                        setStoredState(STORAGE_KEYS.WORKFLOW_NAME, loadName);
                        setStoredState(STORAGE_KEYS.WORKFLOW_ID, result.workflow_id);
                        setIsOwner(true);
                        setAgentflowOriginUserId(null);
                    }
                }
                toast.update(savingId, 'success', t('canvas.toast.duplicateSuccess'));
            } else {
                // Agentflow already saved — confirm before duplicating
                const userConfirmed = await toast.confirm({
                    title: t('canvas.toast.duplicateConfirmTitle'),
                    message: t('canvas.toast.duplicateConfirmMessage', { name: workflowName }),
                    confirmText: t('canvas.toast.duplicateConfirmButton'),
                    cancelText: t('canvas.toast.cancel'),
                    variant: 'info',
                    enableKeyboard: true,
                    keyboardHint: '💡 Enter → 복사 | ESC → 취소',
                });
                if (!userConfirmed) return;

                const loadingId = toast.loading(t('canvas.toast.duplicating'));
                const result = await apiDuplicateAgentflow(workflowId, sourceUserId);
                if (result?.workflow_id) {
                    const currentUserId = user?.user_id != null ? String(user.user_id) : undefined;
                    const loadedData = await apiLoadAgentflow(result.workflow_id, currentUserId);
                    if (loadedData && canvasRef.current) {
                        const loadName = result.workflow_name || loadedData.workflow_name || `${workflowName} (copy)`;
                        const loadContent = loadedData.content || loadedData;
                        canvasRef.current.loadCanvasState(loadContent as any);
                        setAgentflowName(loadName);
                        setAgentflowId(result.workflow_id);
                        setStoredState(STORAGE_KEYS.WORKFLOW_NAME, loadName);
                        setStoredState(STORAGE_KEYS.WORKFLOW_ID, result.workflow_id);
                        setIsOwner(true);
                        setAgentflowOriginUserId(null);
                    }
                }
                toast.update(loadingId, 'success', t('canvas.toast.duplicateSuccess'));
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            toast.error(`${t('canvas.toast.duplicateFailed')}: ${errMsg}`);
        }
    }, [workflowName, workflowId, workflowOriginUserId, isOwner, user, t, toast]);

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

    // ── Agentflow load handler ──
    const handleLoadAgentflow = useCallback((workflowData: any, name?: string, id?: string) => {
        if (canvasRef.current) {
            canvasRef.current.loadAgentflow(workflowData);
        }
        if (name) {
            setAgentflowName(name);
            setStoredState(STORAGE_KEYS.WORKFLOW_NAME, name);
        }
        if (id) {
            setAgentflowId(id);
            setStoredState(STORAGE_KEYS.WORKFLOW_ID, id);
        }
    }, []);

    // ── Execution handlers ──
    const handleExecute = useCallback(async (inputText?: string) => {
        if (!canvasRef.current) {
            toast.error(t('canvas.toast.canvasNotReady'));
            return;
        }

        // Validate canvas
        const validationResult = (canvasRef.current as any).validateAndPrepareExecution?.();
        if (validationResult?.error) {
            toast.error(validationResult.error);
            return;
        }

        setIsExecuting(true);
        setExecutionOutput(null);
        setExecutionSource(inputText ? 'chat' : 'button');
        setBottomPanelExpanded(true);
        setExecutionLogs([]);
        setActiveNodes(new Set());

        const loadingId = toast.loading(t('canvas.toast.executionRunning'));

        try {
            const canvasState = canvasRef.current.getCanvasState();
            const name = validateAgentflowName(workflowName);

            if (!canvasState.nodes || canvasState.nodes.length === 0) {
                throw new Error(t('canvas.toast.emptyAgentflow'));
            }

            // Ensure we have a valid workflow ID
            let currentId = workflowId;
            if (!currentId || currentId === 'None') {
                currentId = generateAgentflowId();
                setAgentflowId(currentId);
                setStoredState(STORAGE_KEYS.WORKFLOW_ID, currentId);
            }

            // Save before executing
            const content = { ...canvasState, workflow_id: currentId, workflow_name: name };
            await apiSaveAgentflow(name, content, currentId, workflowOriginUserId || undefined);

            // Abort previous execution if any
            if (executionAbortRef.current) {
                executionAbortRef.current.abort();
            }
            const abortController = new AbortController();
            executionAbortRef.current = abortController;

            let accumulatedOutput = '';
            let hasReceivedData = false;

            toast.update(loadingId, 'info', t('canvas.toast.executionRunning'));

            await executeAgentflowStream({
                workflowName: name,
                workflowId: currentId,
                inputData: inputText ? { input: inputText } : undefined,
                user_id: workflowOriginUserId || user?.user_id || undefined,
                signal: abortController.signal,
                onData: (chunk) => {
                    hasReceivedData = true;
                    const chunkStr = typeof chunk === 'string' ? chunk : JSON.stringify(chunk, null, 2);
                    accumulatedOutput += chunkStr;
                    setExecutionOutput({ stream: accumulatedOutput });
                },
                onLog: (log) => {
                    setExecutionLogs((prev) => [...prev, log]);
                },
                onTool: (toolData) => {
                    setExecutionLogs((prev) => [...prev, toolData]);
                },
                onNodeStatus: (nodeId, status) => {
                    if (status === 'started') {
                        setActiveNodes((prev) => {
                            const newSet = new Set(prev);
                            newSet.add(nodeId);
                            return newSet;
                        });
                    } else if (status === 'completed' || status === 'error') {
                        setTimeout(() => {
                            setActiveNodes((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(nodeId);
                                return newSet;
                            });
                        }, 100);
                    }
                },
                onEnd: () => {
                    setActiveNodes(new Set());
                    setCanvasMode('edit');
                    if (!hasReceivedData && accumulatedOutput === '') {
                        setExecutionOutput({ stream: t('canvas.toast.executionCompleted') });
                    }
                    toast.update(loadingId, 'success', t('canvas.toast.executionSuccess'));
                },
                onError: (err) => { throw err; },
            });
        } catch (error: any) {
            if (error?.name === 'AbortError') return;
            const errMsg = error instanceof Error ? error.message : String(error);
            setExecutionOutput({ error: errMsg });
            toast.update(loadingId, 'error', `${t('canvas.toast.executionFailed')}: ${errMsg}`);
            setCanvasMode('edit');
        } finally {
            setIsExecuting(false);
            executionAbortRef.current = null;
        }
    }, [workflowId, workflowName, workflowOriginUserId, user, toast, t]);

    // Keep ref in sync for handleModeChange
    handleExecuteRef.current = handleExecute;

    const handleExecuteWithInput = useCallback(async (inputText?: string) => {
        await handleExecute(inputText);
    }, [handleExecute]);

    const handleStopExecution = useCallback(() => {
        if (executionAbortRef.current) {
            executionAbortRef.current.abort();
            executionAbortRef.current = null;
            setIsExecuting(false);
            setActiveNodes(new Set());
            setCanvasMode('edit');
            toast.warning(t('canvas.toast.executionStopped'));
        }
    }, [toast, t]);

    const handleClearOutput = useCallback(() => setExecutionOutput(null), []);
    const handleClearLogs = useCallback(() => setExecutionLogs([]), []);

    // ── Tutorial handlers ──
    const tutorialDelay = useCallback((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)), []);

    const handleStartTutorial = useCallback(async (tutorial: TutorialData) => {
        if (!canvasRef.current) return;

        // Clear canvas and set tutorial's view so nodes are visible
        const tutorialView = tutorial.view || canvasRef.current.getCenteredView();
        canvasRef.current.loadAgentflow({ nodes: [], edges: [], memos: [], view: tutorialView });

        // Set tutorial state
        setTutorialData(tutorial);
        setTutorialStep(0);
        setIsTutorialAnimating(false);

        // Close side menu
        setDirectPanel(null);

        toast.info(t('canvas.tutorial.started', { name: tutorial.tutorial_name }));
    }, [toast, t]);

    const handleTutorialNext = useCallback(async () => {
        if (!tutorialData || !canvasRef.current || isTutorialAnimating) return;

        const steps = tutorialData.tutorial_steps;
        const currentStepData = steps[tutorialStep];

        if (!currentStepData) return;

        setIsTutorialAnimating(true);

        try {
            // Add nodes one by one with delay
            for (const node of currentStepData.nodes) {
                canvasRef.current.addNode(node);
                await tutorialDelay(500);
            }

            // Add edges one by one with delay
            for (const edge of currentStepData.edges) {
                canvasRef.current.addEdge(edge);
                await tutorialDelay(350);
            }

            // Advance to next step or complete
            if (tutorialStep >= steps.length - 1) {
                // Tutorial complete
                setTutorialData(null);
                setTutorialStep(0);
                toast.success(t('canvas.tutorial.completed', '튜토리얼을 완료했습니다!'));
            } else {
                setTutorialStep((prev) => prev + 1);
            }
        } finally {
            setIsTutorialAnimating(false);
        }
    }, [tutorialData, tutorialStep, isTutorialAnimating, tutorialDelay, toast, t]);

    const handleTutorialExit = useCallback(() => {
        setTutorialData(null);
        setTutorialStep(0);
        setIsTutorialAnimating(false);
        toast.info(t('canvas.tutorial.exited', '튜토리얼을 종료했습니다.'));
    }, [toast, t]);

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

    const handleStartAgent = useCallback(() => {
        const agentNode = flatNodeSpecs.find((n: any) => n.id === 'agents/xgen');
        if (agentNode) {
            handleAddNodeToCenter(agentNode);
        } else {
            setDirectPanel('addNodes');
        }
    }, [flatNodeSpecs, handleAddNodeToCenter]);

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
                    const importedName = validateAgentflowName(parsed.workflow_name || file.name.replace(/\.json$/i, ''));
                    const newId = generateAgentflowId();
                    const nextState = {
                        ...parsed,
                        workflow_id: newId,
                        workflow_name: importedName,
                    };
                    if (canvasRef.current) {
                        canvasRef.current.loadCanvasState(nextState);
                    }
                    setAgentflowId(newId);
                    setAgentflowName(importedName);
                    setStoredState(STORAGE_KEYS.WORKFLOW_ID, newId);
                    setStoredState(STORAGE_KEYS.WORKFLOW_NAME, importedName);
                    setStoredState(STORAGE_KEYS.WORKFLOW_STATE, nextState);
                    return;
                } catch (error) {
                    toast.error(t('canvas.toast.importDropFailed'));
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
                setDirectPanel(null);
            }
        } catch (error) {
            toast.error(t('canvas.toast.dropNodeFailed'));
        }
    }, [toast, t]);

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
                onLoadAgentflow={handleLoadAgentflow}
                fetchTemplates={apiListAgentflowsDetail}
                createNewAgentflowId={generateAgentflowId}
                hasCurrentAgentflow={() => {
                    if (!canvasRef.current) return false;
                    const state = canvasRef.current.getCanvasState();
                    return (state.nodes?.length ?? 0) > 0;
                }}
            />
        );
        Wrapped.displayName = 'TemplatePanelWrapped';
        return Wrapped;
    }, [handleLoadAgentflow]);

    const AgentflowPanelWrapped = useMemo(() => {
        const Wrapped: React.FC<{ onBack: () => void }> = ({ onBack }) => (
            <AgentflowPanel
                onBack={onBack}
                onLoad={handleFileInputClick}
                onExport={handleExport}
                onLoadAgentflow={handleLoadAgentflow}
                fetchAgentflowsDetail={apiListAgentflowsDetail}
                loadAgentflowById={async (wfId: string, userId: number) => {
                    const result = await apiLoadAgentflow(wfId, userId);
                    return result.content || result;
                }}
                deleteAgentflowById={apiDeleteAgentflow}
                hasCurrentAgentflow={() => {
                    if (!canvasRef.current) return false;
                    const state = canvasRef.current.getCanvasState();
                    return (state.nodes?.length ?? 0) > 0;
                }}
            />
        );
        Wrapped.displayName = 'AgentflowPanelWrapped';
        return Wrapped;
    }, [handleFileInputClick, handleExport, handleLoadAgentflow]);

    const TutorialPanelWrapped = useMemo(() => {
        const Wrapped: React.FC<{ onBack: () => void }> = ({ onBack }) => (
            <TutorialPanelComponent
                onBack={onBack}
                onSelectTutorial={handleStartTutorial}
            />
        );
        Wrapped.displayName = 'TutorialPanelWrapped';
        return Wrapped;
    }, [handleStartTutorial]);

    // ── Deploy handler ──
    const handleDeploy = useCallback(() => {
        if (!canvasRef.current) return;
        const canvasState = canvasRef.current.getCanvasState();
        setAgentflowDetailData(canvasState);
        setShowDeploymentModal(true);
    }, []);

    // ── Active side panel component ──
    const ActiveSidePanelComponent = useMemo(() => {
        if (!activeSidePanel) return null;
        const panel = sidePanels.find((p) => p.id === activeSidePanel);
        return panel?.component ?? null;
    }, [activeSidePanel, sidePanels]);

    // ── Keyboard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Y) ──
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            if (e.key === 's') {
                e.preventDefault();
                handleSave();
            } else if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                canvasRef.current?.undo();
            } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
                e.preventDefault();
                canvasRef.current?.redo();
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
                <p className={styles.loadingText}>{t('canvas.loading')}</p>
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
                    onNewAgentflow={handleNewAgentflow}
                    onDeploy={handleDeploy}
                    onDuplicate={handleDuplicate}
                    onTemplateStart={handleTemplateStart}
                    onAddNodeClick={handleAddNodeClick}
                    onAutoAgentflowClick={handleAutoAgentflowClick}
                    onHistoryClick={handleHistoryClick}
                    onImportAgentflow={handleImportAgentflow}
                    onAgentflowNameChange={handleAgentflowNameChange}
                    onTutorialClick={() => setDirectPanel((prev) => prev === 'tutorial' ? null : 'tutorial')}
                    isOwner={isOwner}
                    renameAgentflow={apiRenameAgentflow}
                    checkAgentflowExistence={checkAgentflowExistence}
                    listAgentflows={apiListAgentflows}
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
                        onHistoryChange={handleHistoryChange}
                    />

                    {/* Empty state overlay */}
                    {isCanvasEmpty && (
                        <CanvasEmptyState
                            onStartAgent={handleStartAgent}
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
                            onLoadAgentflow={handleLoadAgentflow}
                        />
                    </aside>
                )}

                {/* Direct panel (from SideMenu navigation) */}
                {directPanel && (
                    <SideMenu
                        menuRef={menuRef}
                        initialView={directPanel}
                        onClose={() => setDirectPanel(null)}
                        AddNodePanel={AddNodePanelWrapped}
                        TemplatePanel={TemplatePanelWrapped}
                        AgentflowPanel={AgentflowPanelWrapped}
                        TutorialPanel={TutorialPanelWrapped}
                    />
                )}

                {/* Bottom panels */}
                {bottomPanels.length > 0 && (
                    <div className={styles.bottomPanel}>
                        {bottomPanels.map((panel) => {
                            const PanelComponent = panel.component;
                            // Pass execution-specific props based on panel type
                            const executionProps: Record<string, unknown> = {};
                            if (panel.id === 'execution-panel') {
                                executionProps.onExecute = handleExecute;
                                executionProps.onClear = handleClearOutput;
                                executionProps.output = executionOutput;
                                executionProps.isLoading = isExecuting;
                            }
                            if (panel.id === 'bottom-execution-log') {
                                executionProps.output = executionOutput;
                                executionProps.isLoading = isExecuting;
                                executionProps.onClearOutput = handleClearOutput;
                                executionProps.onClearLogs = handleClearLogs;
                                executionProps.logs = executionLogs;
                                executionProps.activeNodes = activeNodes;
                                executionProps.canvasState = currentCanvasState;
                                executionProps.userId = workflowOriginUserId || (user?.user_id != null ? String(user.user_id) : null);
                                executionProps.onExecuteWithInput = handleExecuteWithInput;
                                executionProps.executionSource = executionSource;
                                executionProps.fetchExecutionOrderByData = getAgentflowExecutionOrderByData;
                                executionProps.onToggleExpanded = () => setBottomPanelExpanded((prev) => !prev);
                            }
                            if (panel.id === 'bottom-panel') {
                                executionProps.output = executionOutput;
                                executionProps.isLoading = isExecuting;
                                executionProps.logs = executionLogs;
                                executionProps.canvasState = currentCanvasState;
                                executionProps.userId = workflowOriginUserId || (user?.user_id != null ? String(user.user_id) : null);
                                executionProps.onExecuteWithInput = handleExecuteWithInput;
                                executionProps.executionSource = executionSource;
                                executionProps.fetchExecutionOrderByData = getAgentflowExecutionOrderByData;
                            }
                            return (
                                <PanelComponent
                                    key={panel.id}
                                    {...pluginContext}
                                    isExpanded={bottomPanelExpanded}
                                    onToggleExpand={() => setBottomPanelExpanded((prev) => !prev)}
                                    {...executionProps}
                                />
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Overlays (AutoAgentflow sidebar, History panel, etc.) */}
            {overlays.map((overlay) => {
                const OverlayComponent = overlay.component;
                const isOpen =
                    overlay.id === 'auto-workflow-sidebar' ? isAutoAgentflowOpen :
                    overlay.id === 'history-panel' ? isHistoryPanelOpen :
                    false;
                const onClose =
                    overlay.id === 'auto-workflow-sidebar' ? () => setIsAutoAgentflowOpen(false) :
                    overlay.id === 'history-panel' ? () => setIsHistoryPanelOpen(false) :
                    () => {};
                const extraProps: Record<string, unknown> = {};
                if (overlay.id === 'auto-workflow-sidebar') {
                    extraProps.onLoadAgentflow = handleLoadAgentflow;
                    extraProps.getCanvasState = () => canvasRef.current?.getCanvasState();
                }
                if (overlay.id === 'history-panel') {
                    extraProps.history = historyState.history;
                    extraProps.currentHistoryIndex = historyState.currentHistoryIndex;
                    extraProps.canUndo = historyState.canUndo;
                    extraProps.canRedo = historyState.canRedo;
                    extraProps.onJumpToHistoryIndex = (index: number) => canvasRef.current?.jumpToHistoryIndex(index);
                    extraProps.onClearHistory = () => canvasRef.current?.clearHistory();
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

            {/* Tutorial Overlay */}
            {tutorialData && (
                <TutorialOverlay
                    tutorialData={tutorialData}
                    currentStep={tutorialStep}
                    onNext={handleTutorialNext}
                    onExit={handleTutorialExit}
                    isAnimating={isTutorialAnimating}
                />
            )}

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
    sidebarSection: 'agentflow',
    sidebarItems: [],
    routes: {
        'canvas-editor': CanvasPage,
    },
    requiresAuth: true,
};

export { CanvasPage };
export default canvasEditorFeature;
