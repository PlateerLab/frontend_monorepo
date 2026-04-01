import './locales';
import React, { useState, useEffect } from 'react';
import { LuArrowLeft, LuRefreshCw } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import type { CanvasPagePlugin } from '@xgen/types';
import { WorkflowPanelActionButtons } from './components/WorkflowPanelActionButtons';
import { WorkflowPanelList } from './components/WorkflowPanelList';
import styles from './styles/workflow-panel.module.scss';
import sideMenuStyles from './styles/side-menu.module.scss';

// ── Types ──────────────────────────────────────────────────────

export interface WorkflowItem {
    id: number;
    workflow_name: string;
    workflow_id: string;
    user_id: number;
    username?: string;
    node_count: number;
    updated_at: string;
}

export interface WorkflowPanelProps {
    onBack: () => void;
    onLoad: () => void;
    onExport: () => void;
    onLoadWorkflow: (workflowData: any, workflowName: string, workflowId: string) => void;
    /** Fetch workflow list — injected API */
    fetchWorkflowsDetail?: () => Promise<any[]>;
    /** Load a specific workflow — injected API */
    loadWorkflowById?: (workflowId: string, userId: number) => Promise<any>;
    /** Delete a workflow — injected API */
    deleteWorkflowById?: (workflowId: string) => Promise<void>;
    /** Check if canvas has existing data */
    hasCurrentWorkflow?: () => boolean;
    /** Toast helpers — injected */
    showSuccess?: (msg: string) => void;
    showError?: (msg: string) => void;
    showWarningConfirm?: (opts: { title: string; message: string; onConfirm: () => void; confirmText: string; cancelText: string }) => void;
    showDeleteConfirm?: (name: string, onConfirm: () => void) => void;
}

// ── Component ──────────────────────────────────────────────────

const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
    onBack,
    onLoad,
    onExport,
    onLoadWorkflow,
    fetchWorkflowsDetail,
    loadWorkflowById,
    deleteWorkflowById,
    hasCurrentWorkflow,
    showSuccess,
    showError,
    showWarningConfirm,
    showDeleteConfirm,
}) => {
    const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const { t } = useTranslation();

    const fetchWorkflows = async (): Promise<void> => {
        if (!fetchWorkflowsDetail) return;
        setIsLoading(true);
        setError(null);
        try {
            const workflowDetailList = await fetchWorkflowsDetail();
            const transformed: WorkflowItem[] = workflowDetailList.map((detail: any) => ({
                id: detail.id,
                workflow_name: detail.workflow_name,
                workflow_id: detail.workflow_id,
                user_id: detail.user_id,
                username: detail.username || detail.full_name,
                node_count: detail.node_count || 0,
                updated_at: detail.updated_at,
            }));
            setWorkflows(transformed);
            setIsInitialized(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isInitialized) {
            fetchWorkflows();
        }
    }, []);

    const handleRefresh = (): void => {
        fetchWorkflows();
        showSuccess?.(t('canvas.workflowPanel.refreshSuccess', 'Refreshed'));
    };

    const handleLoadWorkflowClick = async (workflow: WorkflowItem): Promise<void> => {
        const hasExisting = hasCurrentWorkflow?.() ?? false;
        if (hasExisting && showWarningConfirm) {
            showWarningConfirm({
                title: t('canvas.messages.workflowLoadTitle', 'Load Workflow'),
                message: t('canvas.messages.workflowLoadMessage', 'Replace current workflow?'),
                onConfirm: async () => performLoadWorkflow(workflow),
                confirmText: t('canvas.workflowPanel.load', 'Load'),
                cancelText: t('canvas.header.cancel', 'Cancel'),
            });
        } else {
            await performLoadWorkflow(workflow);
        }
    };

    const performLoadWorkflow = async (workflow: WorkflowItem): Promise<void> => {
        if (!loadWorkflowById) return;
        try {
            const workflowData = await loadWorkflowById(workflow.workflow_id, workflow.user_id);
            onLoadWorkflow(workflowData, workflow.workflow_name, workflow.workflow_id);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            showError?.(`${t('canvas.messages.workflowLoadFailed', 'Load failed')}: ${errorMessage}`);
        }
    };

    const handleDeleteWorkflow = async (workflow: WorkflowItem): Promise<void> => {
        const performDelete = async () => {
            if (!deleteWorkflowById) return;
            try {
                await deleteWorkflowById(workflow.workflow_id);
                await fetchWorkflows();
                showSuccess?.(t('canvas.messages.deleteSuccess', 'Deleted successfully'));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
                showError?.(`${t('canvas.messages.deleteFailed', 'Delete failed')}: ${errorMessage}`);
            }
        };

        if (showDeleteConfirm) {
            showDeleteConfirm(workflow.workflow_name, performDelete);
        } else {
            await performDelete();
        }
    };

    return (
        <div className={styles.workflowPanel}>
            <div className={sideMenuStyles.header}>
                <button onClick={onBack} className={sideMenuStyles.backButton} type="button">
                    <LuArrowLeft />
                </button>
                <h3>{t('canvas.workflowPanel.title', 'Workflows')}</h3>
                <button
                    onClick={handleRefresh}
                    className={`${sideMenuStyles.refreshButton} ${isLoading ? sideMenuStyles.loading : ''}`}
                    disabled={isLoading}
                    title={t('canvas.workflowPanel.refreshTooltip', 'Refresh')}
                    type="button"
                >
                    <LuRefreshCw />
                </button>
            </div>

            <WorkflowPanelActionButtons
                onLoad={onLoad}
                onExport={onExport}
                loadLabel={t('canvas.workflowPanel.loadFromLocal', 'Load from Local')}
                exportLabel={t('canvas.workflowPanel.exportToLocal', 'Export to Local')}
            />

            <WorkflowPanelList
                workflows={workflows}
                isLoading={isLoading}
                error={error}
                onRefresh={handleRefresh}
                onLoadWorkflow={handleLoadWorkflowClick}
                onDeleteWorkflow={handleDeleteWorkflow}
                labels={{
                    title: t('canvas.workflowPanel.savedWorkflows', 'Saved Workflows'),
                    loading: t('canvas.workflowPanel.loading', 'Loading...'),
                    tryAgain: t('canvas.workflowPanel.tryAgain', 'Try Again'),
                    noWorkflows: t('canvas.workflowPanel.noWorkflows', 'No workflows found'),
                    noWorkflowsHint: t('canvas.workflowPanel.noWorkflowsHint', 'Save a workflow to see it here'),
                    load: t('canvas.workflowPanel.load', 'Load'),
                }}
            />
        </div>
    );
};

// ── Plugin Export ───────────────────────────────────────────────

export const canvasSidebarWorkflowsPlugin: CanvasPagePlugin = {
    id: 'canvas-sidebar-workflows',
    name: 'Canvas Sidebar Workflows',
    sidePanels: [
        {
            id: 'workflow-panel',
            position: 'left',
            component: WorkflowPanel as any,
        },
    ],
};

export { WorkflowPanel, WorkflowPanelActionButtons, WorkflowPanelList };
export default WorkflowPanel;
