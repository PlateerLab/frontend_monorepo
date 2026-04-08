import './locales';
import React, { useState, useEffect } from 'react';
import { LuArrowLeft, LuRefreshCw } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import type { CanvasPagePlugin } from '@xgen/types';
import { AgentflowPanelActionButtons } from './components/AgentflowPanelActionButtons';
import { AgentflowPanelList } from './components/AgentflowPanelList';
import styles from './styles/agentflow-panel.module.scss';
import sideMenuStyles from './styles/side-menu.module.scss';

// ── Types ──────────────────────────────────────────────────────

export interface AgentflowItem {
    id: number;
    agentflow_name: string;
    agentflow_id: string;
    user_id: number;
    username?: string;
    node_count: number;
    updated_at: string;
}

export interface AgentflowPanelProps {
    onBack: () => void;
    onLoad: () => void;
    onExport: () => void;
    onLoadAgentflow: (agentflowData: any, agentflowName: string, agentflowId: string) => void;
    /** Fetch agentflow list — injected API */
    fetchAgentflowsDetail?: () => Promise<any[]>;
    /** Load a specific agentflow — injected API */
    loadAgentflowById?: (agentflowId: string, userId: number) => Promise<any>;
    /** Delete a agentflow — injected API */
    deleteAgentflowById?: (agentflowId: string) => Promise<void>;
    /** Check if canvas has existing data */
    hasCurrentAgentflow?: () => boolean;
    /** Toast helpers — injected */
    showSuccess?: (msg: string) => void;
    showError?: (msg: string) => void;
    showWarningConfirm?: (opts: { title: string; message: string; onConfirm: () => void; confirmText: string; cancelText: string }) => void;
    showDeleteConfirm?: (name: string, onConfirm: () => void) => void;
}

// ── Component ──────────────────────────────────────────────────

const AgentflowPanel: React.FC<AgentflowPanelProps> = ({
    onBack,
    onLoad,
    onExport,
    onLoadAgentflow,
    fetchAgentflowsDetail,
    loadAgentflowById,
    deleteAgentflowById,
    hasCurrentAgentflow,
    showSuccess,
    showError,
    showWarningConfirm,
    showDeleteConfirm,
}) => {
    const [agentflows, setAgentflows] = useState<AgentflowItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const { t } = useTranslation();

    const fetchAgentflows = async (): Promise<void> => {
        if (!fetchAgentflowsDetail) return;
        setIsLoading(true);
        setError(null);
        try {
            const agentflowDetailList = await fetchAgentflowsDetail();
            const transformed: AgentflowItem[] = agentflowDetailList.map((detail: any) => ({
                id: detail.id,
                agentflow_name: detail.agentflow_name,
                agentflow_id: detail.agentflow_id,
                user_id: detail.user_id,
                username: detail.username || detail.full_name,
                node_count: detail.node_count || 0,
                updated_at: detail.updated_at,
            }));
            setAgentflows(transformed);
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
            fetchAgentflows();
        }
    }, []);

    const handleRefresh = (): void => {
        fetchAgentflows();
        showSuccess?.(t('canvas.agentflowPanel.refreshSuccess', 'Refreshed'));
    };

    const handleLoadAgentflowClick = async (agentflow: AgentflowItem): Promise<void> => {
        const hasExisting = hasCurrentAgentflow?.() ?? false;
        if (hasExisting && showWarningConfirm) {
            showWarningConfirm({
                title: t('canvas.messages.agentflowLoadTitle', 'Load Agentflow'),
                message: t('canvas.messages.agentflowLoadMessage', 'Replace current agentflow?'),
                onConfirm: async () => performLoadAgentflow(agentflow),
                confirmText: t('canvas.agentflowPanel.load', 'Load'),
                cancelText: t('canvas.header.cancel', 'Cancel'),
            });
        } else {
            await performLoadAgentflow(agentflow);
        }
    };

    const performLoadAgentflow = async (agentflow: AgentflowItem): Promise<void> => {
        if (!loadAgentflowById) return;
        try {
            const agentflowData = await loadAgentflowById(agentflow.agentflow_id, agentflow.user_id);
            onLoadAgentflow(agentflowData, agentflow.agentflow_name, agentflow.agentflow_id);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            showError?.(`${t('canvas.messages.agentflowLoadFailed', 'Load failed')}: ${errorMessage}`);
        }
    };

    const handleDeleteAgentflow = async (agentflow: AgentflowItem): Promise<void> => {
        const performDelete = async () => {
            if (!deleteAgentflowById) return;
            try {
                await deleteAgentflowById(agentflow.agentflow_id);
                await fetchAgentflows();
                showSuccess?.(t('canvas.messages.deleteSuccess', 'Deleted successfully'));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
                showError?.(`${t('canvas.messages.deleteFailed', 'Delete failed')}: ${errorMessage}`);
            }
        };

        if (showDeleteConfirm) {
            showDeleteConfirm(agentflow.agentflow_name, performDelete);
        } else {
            await performDelete();
        }
    };

    return (
        <div className={styles.agentflowPanel}>
            <div className={sideMenuStyles.header}>
                <button onClick={onBack} className={sideMenuStyles.backButton} type="button">
                    <LuArrowLeft />
                </button>
                <h3>{t('canvas.agentflowPanel.title', 'Agentflows')}</h3>
                <button
                    onClick={handleRefresh}
                    className={`${sideMenuStyles.refreshButton} ${isLoading ? sideMenuStyles.loading : ''}`}
                    disabled={isLoading}
                    title={t('canvas.agentflowPanel.refreshTooltip', 'Refresh')}
                    type="button"
                >
                    <LuRefreshCw />
                </button>
            </div>

            <AgentflowPanelActionButtons
                onLoad={onLoad}
                onExport={onExport}
                loadLabel={t('canvas.agentflowPanel.loadFromLocal', 'Load from Local')}
                exportLabel={t('canvas.agentflowPanel.exportToLocal', 'Export to Local')}
            />

            <AgentflowPanelList
                agentflows={agentflows}
                isLoading={isLoading}
                error={error}
                onRefresh={handleRefresh}
                onLoadAgentflow={handleLoadAgentflowClick}
                onDeleteAgentflow={handleDeleteAgentflow}
                labels={{
                    title: t('canvas.agentflowPanel.savedAgentflows', 'Saved Agentflows'),
                    loading: t('canvas.agentflowPanel.loading', 'Loading...'),
                    tryAgain: t('canvas.agentflowPanel.tryAgain', 'Try Again'),
                    noAgentflows: t('canvas.agentflowPanel.noAgentflows', 'No agentflows found'),
                    noAgentflowsHint: t('canvas.agentflowPanel.noAgentflowsHint', 'Save a agentflow to see it here'),
                    load: t('canvas.agentflowPanel.load', 'Load'),
                }}
            />
        </div>
    );
};

// ── Plugin Export ───────────────────────────────────────────────

export const canvasSidebarAgentflowsPlugin: CanvasPagePlugin = {
    id: 'canvas-sidebar-agentflows',
    name: 'Canvas Sidebar Agentflows',
    sidePanels: [
        {
            id: 'agentflow-panel',
            position: 'left',
            component: AgentflowPanel as any,
        },
    ],
};

export { AgentflowPanel, AgentflowPanelActionButtons, AgentflowPanelList };
export default AgentflowPanel;
