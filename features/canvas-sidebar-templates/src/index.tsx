import './locales';
import React, { useState, useEffect } from 'react';
import { LuArrowLeft, LuLayoutTemplate, LuCopy } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import type { CanvasPagePlugin } from '@xgen/types';
import type { Template } from './components/MiniCanvas';
import styles from './styles/workflow-panel.module.scss';
import sideMenuStyles from './styles/side-menu.module.scss';

// ── Types ──────────────────────────────────────────────────────

interface Workflow {
    id: number;
    workflow_id: string;
    workflow_name: string;
    workflow_upload_name: string;
    description: string;
    node_count: number;
    tags?: string[] | null;
    is_template: boolean;
    workflow_data?: any;
    username?: string;
}

export interface TemplatePanelProps {
    onBack: () => void;
    onLoadWorkflow: (workflowData: any, workflowName: string, workflowId: string) => void;
    /** Fetch templates from API — injected to avoid direct API import */
    fetchTemplates?: () => Promise<Workflow[]>;
    /** Create new workflow ID — injected utility */
    createNewWorkflowId?: () => string;
    /** Toast helpers — injected */
    showWarningConfirm?: (opts: { title: string; message: string; onConfirm: () => void; confirmText: string; cancelText: string }) => void;
    showSuccess?: (msg: string) => void;
    showError?: (msg: string) => void;
    /** Check if canvas has existing data */
    hasCurrentWorkflow?: () => boolean;
}

// ── Component ──────────────────────────────────────────────────

const TemplatePanel: React.FC<TemplatePanelProps> = ({
    onBack,
    onLoadWorkflow,
    fetchTemplates,
    createNewWorkflowId,
    showWarningConfirm,
    showSuccess,
    showError,
    hasCurrentWorkflow,
}) => {
    const { t } = useTranslation();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadTemplates = async (): Promise<void> => {
            try {
                setIsLoading(true);
                if (fetchTemplates) {
                    const workflowList = await fetchTemplates();
                    const templates = workflowList.filter((w) => w.is_template === true);
                    setWorkflows(templates);
                }
            } catch {
                setWorkflows([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadTemplates();
    }, [fetchTemplates]);

    const performLoadTemplate = (workflow: Workflow): void => {
        try {
            if (!workflow.workflow_data) {
                showError?.(t('canvas.toasts.templateLoadFailed', 'Failed to load template'));
                return;
            }

            let workflowData = workflow.workflow_data;
            if (typeof workflowData === 'string') {
                try {
                    workflowData = JSON.parse(workflowData);
                } catch {
                    showError?.(t('canvas.toasts.templateParseFailed', 'Failed to parse template'));
                    return;
                }
            }

            const newWorkflowId = createNewWorkflowId?.() ?? crypto.randomUUID();

            setTimeout(() => {
                onLoadWorkflow(workflowData, workflow.workflow_upload_name, newWorkflowId);
                showSuccess?.(`${t('canvas.toasts.templateLoadSuccess', 'Template loaded')}: "${workflow.workflow_upload_name}"`);
                onBack();
            }, 100);
        } catch {
            showError?.(t('canvas.toasts.templateLoadError', 'Error loading template'));
        }
    };

    const handleCopyWorkflow = (workflow: Workflow): void => {
        const hasExistingWork = hasCurrentWorkflow?.() ?? false;

        if (hasExistingWork && showWarningConfirm) {
            showWarningConfirm({
                title: t('canvas.messages.workflowLoadTitle', 'Load Workflow'),
                message: t('canvas.messages.workflowLoadMessage', 'This will replace the current workflow. Continue?'),
                onConfirm: () => performLoadTemplate(workflow),
                confirmText: t('common.confirm', 'Confirm'),
                cancelText: t('common.cancel', 'Cancel'),
            });
        } else {
            performLoadTemplate(workflow);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.workflowPanel}>
                <div className={sideMenuStyles.header}>
                    <button onClick={onBack} className={sideMenuStyles.backButton} type="button">
                        <LuArrowLeft />
                    </button>
                    <h3>{t('canvas.templatePanel.title', 'Templates')}</h3>
                </div>
                <div className={styles.loadingState}>
                    <LuLayoutTemplate className={styles.spinIcon} />
                    <span>{t('canvas.templatePanel.loading', 'Loading templates...')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.workflowPanel}>
            <div className={sideMenuStyles.header}>
                <button onClick={onBack} className={sideMenuStyles.backButton} type="button">
                    <LuArrowLeft />
                </button>
                <h3>{t('canvas.templatePanel.title', 'Templates')}</h3>
            </div>

            <div className={styles.workflowList}>
                <div className={styles.listHeader}>
                    <h3>📁 {t('canvas.templatePanel.available', 'Available Templates')}</h3>
                    <span className={styles.count}>{workflows.length}</span>
                </div>

                <div className={styles.templateList}>
                    {workflows.map((workflow) => (
                        <div key={workflow.id} className={styles.templateItem}>
                            <div className={styles.templateHeader}>
                                <div className={styles.templateIcon}>
                                    <LuLayoutTemplate />
                                </div>
                                <div className={styles.templateInfo}>
                                    <h4 className={styles.templateName}>{workflow.workflow_upload_name}</h4>
                                    <p className={styles.templateDescription}>
                                        {workflow.description && workflow.description.length > 20
                                            ? `${workflow.description.substring(0, 20)}...`
                                            : workflow.description}
                                    </p>
                                    <div className={styles.templateMeta}>
                                        <div className={styles.templateTags}>
                                            {workflow.tags?.slice(0, 2).map((tag) => (
                                                <span key={tag} className={styles.templateCategory}>{tag}</span>
                                            ))}
                                            {workflow.tags && workflow.tags.length > 2 && (
                                                <span className={styles.templateCategory}>+{workflow.tags.length - 2}</span>
                                            )}
                                        </div>
                                        <span className={styles.templateNodes}>{workflow.node_count} nodes</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.templateActions}>
                                <button
                                    className={styles.templateActionButton}
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCopyWorkflow(workflow); }}
                                    title={t('canvas.templatePanel.preview', 'Preview Template')}
                                    type="button"
                                >
                                    <LuCopy />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Plugin Export ───────────────────────────────────────────────

export const canvasSidebarTemplatesPlugin: CanvasPagePlugin = {
    id: 'canvas-sidebar-templates',
    name: 'Canvas Sidebar Templates',
    sidePanels: [
        {
            id: 'template-panel',
            position: 'left',
            component: TemplatePanel as any,
        },
    ],
};

export { TemplatePanel };
export type { Template, Workflow };
export { default as MiniCanvas } from './components/MiniCanvas';
export { default as TemplatePreview } from './components/TemplatePreview';
export default TemplatePanel;
