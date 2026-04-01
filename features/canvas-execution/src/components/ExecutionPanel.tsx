import React, { useState, useCallback } from 'react';
import { LuPlay, LuTrash2, LuCircleX, LuChevronUp, LuChevronDown, LuCopy, LuCheck } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import {
    type OutputRendererProps,
    type ExecutionPanelProps,
    hasError,
    hasOutputs,
    isStreamingOutput,
} from '../types';
import styles from '../styles/execution-panel.module.scss';

const OutputRenderer: React.FC<OutputRendererProps> = ({ output }) => {
    const { t } = useTranslation();

    if (!output) {
        return <div className={styles.placeholder}>{t('canvas.executionPanel.placeholder', 'Run workflow to see results')}</div>;
    }
    if (hasError(output)) {
        return (
            <div className={`${styles.resultContainer} ${styles.error}`}>
                <div className={styles.status}>
                    <LuCircleX />
                    <span>{t('canvas.executionPanel.executionFailed', 'Execution failed')}</span>
                </div>
                <div className={styles.message}>{output.error}</div>
            </div>
        );
    }
    if (isStreamingOutput(output)) {
        return (
            <div className={`${styles.resultContainer} ${styles.success}`}>
                <div className={styles.outputDataSection}>
                    <pre className={styles.outputContent}>{output.stream}</pre>
                </div>
            </div>
        );
    }
    if (hasOutputs(output)) {
        return (
            <div className={`${styles.resultContainer} ${styles.success}`}>
                <div className={styles.outputDataSection}>
                    <pre className={styles.outputContent}>{JSON.stringify(output.outputs, null, 2)}</pre>
                </div>
            </div>
        );
    }
    return <div className={styles.placeholder}>{t('canvas.executionPanel.unexpectedFormat', 'Unexpected output format')}</div>;
};

const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ onExecute, onClear, output, isLoading }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const getOutputText = useCallback((): string => {
        if (!output) return '';
        if (hasError(output)) return `Error: ${output.error}`;
        if (isStreamingOutput(output)) return output.stream;
        if (hasOutputs(output)) return JSON.stringify(output.outputs, null, 2);
        return '';
    }, [output]);

    const handleCopy = useCallback(async (): Promise<void> => {
        const text = getOutputText();
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [getOutputText]);

    const hasOutput = output && (hasError(output) || isStreamingOutput(output) || hasOutputs(output));

    return (
        <div className={`${styles.executionPanel} ${!isExpanded ? styles.collapsed : ''}`}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <button onClick={() => setIsExpanded(!isExpanded)} className={styles.toggleButton} type="button"
                        title={isExpanded ? 'Collapse Panel' : 'Expand Panel'}>
                        {isExpanded ? <LuChevronUp /> : <LuChevronDown />}
                    </button>
                    <h4>{t('canvas.executionPanel.title', 'Execution')}</h4>
                </div>
                <div className={styles.actions} style={{ display: isExpanded ? 'flex' : 'none' }}>
                    <button onClick={onClear} className={`${styles.actionButton} ${styles.iconOnlyButton}`}
                        title={t('canvas.executionPanel.clearOutput', 'Clear')} disabled={isLoading || !hasOutput} type="button">
                        <LuTrash2 />
                    </button>
                    <button onClick={handleCopy} className={`${styles.actionButton} ${styles.iconOnlyButton} ${isCopied ? styles.copied : ''}`}
                        title={isCopied ? t('canvas.executionPanel.copied', 'Copied') : t('canvas.executionPanel.copyOutput', 'Copy')}
                        disabled={isLoading || !hasOutput} type="button">
                        {isCopied ? <LuCheck /> : <LuCopy />}
                    </button>
                    <button onClick={onExecute} className={`${styles.actionButton} ${styles.runButton}`}
                        title={t('canvas.executionPanel.runWorkflow', 'Run')} disabled={isLoading} type="button">
                        {isLoading ? (
                            <div className={styles.loader} />
                        ) : (
                            <>
                                <LuPlay />
                                <span>{t('canvas.executionPanel.saveAndRun', 'Save & Run')}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className={styles.outputContainer}>
                    <pre>
                        <OutputRenderer output={output} />
                    </pre>
                </div>
            )}
        </div>
    );
};

export { OutputRenderer };
export default ExecutionPanel;
