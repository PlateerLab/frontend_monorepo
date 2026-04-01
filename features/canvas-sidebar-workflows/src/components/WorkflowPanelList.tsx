import React from 'react';
import { LuRefreshCw } from '@xgen/icons';
import styles from '../styles/workflow-panel.module.scss';

interface WorkflowListItem {
    id: number;
    workflow_name: string;
    workflow_id: string;
    user_id: number;
    username?: string;
    node_count: number;
    updated_at: string;
}

interface WorkflowPanelListLabels {
    title: string;
    loading: string;
    tryAgain: string;
    noWorkflows: string;
    noWorkflowsHint: string;
    load: string;
}

interface WorkflowPanelListProps {
    workflows: WorkflowListItem[];
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
    onLoadWorkflow: (workflow: WorkflowListItem) => void;
    onDeleteWorkflow: (workflow: WorkflowListItem) => void;
    labels: WorkflowPanelListLabels;
}

export const WorkflowPanelList: React.FC<WorkflowPanelListProps> = ({
    workflows,
    isLoading,
    error,
    onRefresh,
    onLoadWorkflow,
    onDeleteWorkflow,
    labels,
}) => (
    <div className={styles.workflowList}>
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
                <p>{labels.noWorkflows}</p>
                <p className={styles.hint}>{labels.noWorkflowsHint}</p>
            </div>
        ) : (
            <div className={styles.list}>
                {workflows.map((workflow) => (
                    <div key={workflow.id} className={styles.workflowItem}>
                        <div className={styles.itemInfo}>
                            <span className={styles.itemName}>{workflow.workflow_name}</span>
                            {workflow.username && (
                                <span className={styles.itemUser}>{workflow.username}</span>
                            )}
                        </div>
                        <div className={styles.itemActions}>
                            <button
                                onClick={() => onLoadWorkflow(workflow)}
                                className={styles.loadButton}
                                type="button"
                            >
                                {labels.load}
                            </button>
                            <button
                                onClick={() => onDeleteWorkflow(workflow)}
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
