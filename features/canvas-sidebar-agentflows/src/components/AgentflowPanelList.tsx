import React from 'react';
import { LuRefreshCw } from '@xgen/icons';
import styles from '../styles/agentflow-panel.module.scss';

interface AgentflowListItem {
    id: number;
    workflow_name: string;
    workflow_id: string;
    user_id: number;
    username?: string;
    node_count: number;
    updated_at: string;
}

interface AgentflowPanelListLabels {
    title: string;
    loading: string;
    tryAgain: string;
    noAgentflows: string;
    noAgentflowsHint: string;
    load: string;
}

interface AgentflowPanelListProps {
    workflows: AgentflowListItem[];
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
    onLoadAgentflow: (workflow: AgentflowListItem) => void;
    onDeleteAgentflow: (workflow: AgentflowListItem) => void;
    labels: AgentflowPanelListLabels;
}

export const AgentflowPanelList: React.FC<AgentflowPanelListProps> = ({
    workflows,
    isLoading,
    error,
    onRefresh,
    onLoadAgentflow,
    onDeleteAgentflow,
    labels,
}) => (
    <div className={styles.agentflowList}>
        <div className={styles.listHeader}>
            <h3>{labels.title}</h3>
            <span className={styles.count}>{workflows.length}</span>
        </div>

        {isLoading ? (
            <div className={styles.loadingState}>
                <LuRefreshCw className={styles.spinIcon} />
                <span>{labels.loading}</span>
            </div>
        ) : error ? (
            <div className={styles.errorState}>
                <p>{error}</p>
                <button onClick={onRefresh} className={styles.retryButton} type="button">
                    {labels.tryAgain}
                </button>
            </div>
        ) : workflows.length === 0 ? (
            <div className={styles.emptyState}>
                <p>{labels.noAgentflows}</p>
                <p className={styles.hint}>{labels.noAgentflowsHint}</p>
            </div>
        ) : (
            <div className={styles.list}>
                {workflows.map((workflow) => (
                    <div key={workflow.id} className={styles.agentflowItem}>
                        <div className={styles.itemInfo}>
                            <span className={styles.itemName}>{workflow.workflow_name}</span>
                            {workflow.username && (
                                <span className={styles.itemUser}>{workflow.username}</span>
                            )}
                        </div>
                        <div className={styles.itemActions}>
                            <button
                                onClick={() => onLoadAgentflow(workflow)}
                                className={styles.loadButton}
                                type="button"
                            >
                                {labels.load}
                            </button>
                            <button
                                onClick={() => onDeleteAgentflow(workflow)}
                                className={styles.deleteButton}
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);
