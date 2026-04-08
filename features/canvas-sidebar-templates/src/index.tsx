import './locales';
import React, { useState, useEffect } from 'react';
import { LuArrowLeft, LuLayoutTemplate, LuCopy } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import type { CanvasPagePlugin } from '@xgen/types';
import type { Template } from './components/MiniCanvas';
import styles from './styles/agentflow-panel.module.scss';
import sideMenuStyles from './styles/side-menu.module.scss';

// ── Types ──────────────────────────────────────────────────────

interface Agentflow {
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
    onLoadAgentflow: (workflowData: any, workflowName: string, workflowId: string) => void;
    /** Fetch templates from API — injected to avoid direct API import */
    fetchTemplates?: () => Promise<Agentflow[]>;
    /** Create new workflow ID — injected utility */
    createNewAgentflowId?: () => string;
    /** Toast helpers — injected */
    showWarningConfirm?: (opts: { title: string; message: string; onConfirm: () => void; confirmText: string; cancelText: string }) => void;
    showSuccess?: (msg: string) => void;
    showError?: (msg: string) => void;
    /** Check if canvas has existing data */
    hasCurrentAgentflow?: () => boolean;
}

// ── Component ──────────────────────────────────────────────────

const TemplatePanel: React.FC<TemplatePanelProps> = ({
    onBack,
    onLoadAgentflow,
    fetchTemplates,
    createNewAgentflowId,
    showWarningConfirm,
    showSuccess,
    showError,
    hasCurrentAgentflow,
}) => {
    const { t } = useTranslation();
    const [workflows, setAgentflows] = useState<Agentflow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadTemplates = async (): Promise<void> => {
            try {
                setIsLoading(true);
                if (fetchTemplates) {
                    const workflowList = await fetchTemplates();
                    const templates = workflowList.filter((w) => w.is_template === true);
                    setAgentflows(templates);
                }
            } catch {
                setAgentflows([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadTemplates();
    }, [fetchTemplates]);

    const performLoadTemplate = (workflow: Agentflow): void => {
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

            const newAgentflowId = createNewAgentflowId?.() ?? crypto.randomUUID();

            setTimeout(() => {
                onLoadAgentflow(workflowData, workflow.workflow_upload_name, newAgentflowId);
                showSuccess?.(`${t('canvas.toasts.templateLoadSuccess', 'Template loaded')}: "${workflow.workflow_upload_name}"`);
                onBack();
            }, 100);
        } catch {
            showError?.(t('canvas.toasts.templateLoadError', 'Error loading template'));
        }
    };

    const handleCopyAgentflow = (workflow: Agentflow): void => {
        const hasExistingWork = hasCurrentAgentflow?.() ?? false;

        if (hasExistingWork && showWarningConfirm) {
            showWarningConfirm({
                title: t('canvas.messages.workflowLoadTitle', 'Load Agentflow'),
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
            <div className={styles.agentflowPanel}>
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
        <div className={styles.agentflowPanel}>
            <div className={sideMenuStyles.header}>
                <button onClick={onBack} className={sideMenuStyles.backButton} type="button">
                    <LuArrowLeft />
                </button>
                <h3>{t('canvas.templatePanel.title', 'Templates')}</h3>
            </div>

            <div className={styles.agentflowList}>
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
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCopyAgentflow(workflow); }}
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
export type { Template, Agentflow };
export { default as MiniCanvas } from './components/MiniCanvas';
export { default as TemplatePreview } from './components/TemplatePreview';
export default TemplatePanel;
