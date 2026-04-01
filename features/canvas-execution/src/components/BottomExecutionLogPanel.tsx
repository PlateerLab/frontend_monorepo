import React from 'react';
import { LuChevronUp, LuChevronDown, LuTrash2, LuCopy } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import {
    hasError,
    hasOutputs,
    isStreamingOutput,
    type ExecutionOutput,
    type BottomExecutionLogPanelProps,
} from '../types';
import DetailPanel from './DetailPanel';
import styles from '../styles/bottom-execution-log-panel.module.scss';

const ExecutionOutputRenderer: React.FC<{ output: ExecutionOutput }> = ({ output }) => {
    const { t } = useTranslation();
    if (!output) {
        return <div className={styles.placeholder}>{t('canvas.executionPanel.placeholder', 'Run workflow to see results')}</div>;
    }
    if (hasError(output)) {
        return (
            <div className={`${styles.resultContainer} ${styles.error}`}>
                <div className={styles.outputContent}>{output.error}</div>
            </div>
        );
    }
    if (isStreamingOutput(output)) {
        return (
            <div className={styles.resultContainer}>
                <pre className={styles.outputContent}>{output.stream}</pre>
            </div>
        );
    }
    if (hasOutputs(output)) {
        return (
            <div className={styles.resultContainer}>
                <pre className={styles.outputContent}>{JSON.stringify(output.outputs, null, 2)}</pre>
            </div>
        );
    }
    return <div className={styles.placeholder}>{t('canvas.executionPanel.unexpectedFormat', 'Unexpected format')}</div>;
};

const BottomExecutionLogPanel: React.FC<BottomExecutionLogPanelProps> = ({
    isExpanded,
    onToggleExpanded,
    onClearOutput,
    onCopyOutput,
    output,
    isLoading,
    workflowName,
    workflowId,
    userId,
    canvasState,
    logs = [],
    onClearLogs,
    activeNodes,
    onApplyLayout,
    fetchExecutionOrderByData,
    fetchExecutionOrder,
    LogViewerComponent,
}) => {
    const { t } = useTranslation();
    const rootClassName = `${styles.root} ${isExpanded ? styles.expanded : styles.collapsed}`;

    return (
        <div className={rootClassName}>
            <section className={styles.executionPane}>
                <div className={styles.executionHeader}>
                    <span className={styles.barTitle}>Execution</span>
                </div>
                {isExpanded && (
                    <div className={styles.executionContent}>
                        {isLoading ? <div className={styles.loader} /> : <ExecutionOutputRenderer output={output} />}
                    </div>
                )}
            </section>

            <section className={styles.logPane}>
                <div className={styles.logHeader}>
                    <span className={styles.barLogTitle}>{t('canvas.detailPanel.log', 'Log')}</span>
                    <div className={styles.barActions}>
                        <button type="button" className={styles.barActionBtn} onClick={onClearLogs}
                            title={t('canvas.executionPanel.clearOutput', 'Clear')}>
                            <LuTrash2 size={18} />
                        </button>
                        <span className={styles.barDivider} aria-hidden="true" />
                        <button type="button" className={styles.panelToggleBtn} onClick={onToggleExpanded}
                            title={isExpanded ? t('canvas.bottomPanel.collapse', 'Collapse') : t('canvas.bottomPanel.expand', 'Expand')}
                            aria-expanded={isExpanded}>
                            {isExpanded ? <LuChevronDown /> : <LuChevronUp />}
                        </button>
                        {onCopyOutput && (
                            <button type="button" className={styles.barActionBtn} onClick={onCopyOutput}
                                title={t('canvas.executionPanel.copyOutput', 'Copy')}>
                                <LuCopy size={18} />
                            </button>
                        )}
                    </div>
                </div>
                {isExpanded && (
                    <div className={styles.logContent}>
                        <DetailPanel
                            embedded
                            embeddedLayout="split"
                            workflowName={workflowName}
                            workflowId={workflowId}
                            userId={userId}
                            canvasState={canvasState}
                            logs={logs}
                            onClearLogs={onClearLogs}
                            activeNodes={activeNodes}
                            onApplyLayout={onApplyLayout}
                            fetchExecutionOrderByData={fetchExecutionOrderByData}
                            fetchExecutionOrder={fetchExecutionOrder}
                            LogViewerComponent={LogViewerComponent}
                        />
                    </div>
                )}
            </section>
        </div>
    );
};

export { ExecutionOutputRenderer };
export default BottomExecutionLogPanel;
