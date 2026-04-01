import React from 'react';
import { useTranslation } from '@xgen/i18n';
import type { CanvasExecutionLogPanelProps } from '../types';
import styles from '../styles/canvas-execution-log-panel.module.scss';

const CanvasExecutionLogPanel: React.FC<CanvasExecutionLogPanelProps> = ({
    expanded,
    onToggleExpand,
    onClearLogs,
    onFullscreen,
    children,
}) => {
    const { t } = useTranslation();

    return (
        <div
            className={expanded ? `${styles.wrapper} ${styles.wrapperExpanded}` : styles.wrapper}
            role="region"
            aria-label={t('canvas.bottom.execution', 'Execution')}
        >
            <div className={styles.bar}>
                <div className={styles.execution}>
                    <span className={styles.executionLabel}>{t('canvas.bottom.execution', 'Execution')}</span>
                </div>
                <div className={styles.logArea}>
                    <span className={styles.logTitle}>{t('canvas.bottom.log', 'Log')}</span>
                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.btnClear}
                            onClick={onClearLogs}
                            aria-label={t('canvas.bottom.clear', 'Clear')}
                            title={t('canvas.bottom.clear', 'Clear')}
                        >
                            🗑
                        </button>
                        <span className={styles.divider} aria-hidden />
                        <button
                            type="button"
                            className={styles.iconButton}
                            aria-label={t('canvas.bottom.fullscreen', 'Fullscreen')}
                            title={t('canvas.bottom.fullscreen', 'Fullscreen')}
                            onClick={() => onFullscreen?.()}
                        >
                            ⛶
                        </button>
                        <button
                            type="button"
                            className={styles.iconButton}
                            aria-label={expanded ? t('canvas.bottom.collapse', 'Collapse') : t('canvas.bottom.expand', 'Expand')}
                            title={expanded ? t('canvas.bottom.collapse', 'Collapse') : t('canvas.bottom.expand', 'Expand')}
                            onClick={onToggleExpand}
                        >
                            {expanded ? '▼' : '▲'}
                        </button>
                    </div>
                </div>
            </div>
            <div className={expanded ? styles.content : styles.contentHidden}>{children}</div>
        </div>
    );
};

export default CanvasExecutionLogPanel;
