'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import styles from '../styles/edit-run-floating.module.scss';

export type CanvasMode = 'edit' | 'run';

export interface EditRunFloatingProps {
    mode: CanvasMode;
    onModeChange: (mode: CanvasMode) => void;
    /** True while workflow is executing — disables both buttons */
    disabled?: boolean;
    /** Optional play icon component to render in the run button */
    PlayIcon?: React.ComponentType<{ className?: string }>;
}

const EditRunFloating: React.FC<EditRunFloatingProps> = ({ mode, onModeChange, disabled, PlayIcon }) => {
    const { t } = useTranslation();

    return (
        <div
            className={`${styles.wrapper} ${disabled ? styles.disabled : ''}`}
            role="group"
            aria-label={`${t('canvas.header.edit', 'Edit')} / ${t('canvas.header.run', 'Run')}`}
            aria-disabled={disabled}
        >
            <div className={styles.pill}>
                <button
                    type="button"
                    className={`${styles.segment} ${styles.edit} ${mode === 'edit' ? styles.active : ''}`}
                    onClick={() => !disabled && onModeChange('edit')}
                    aria-pressed={mode === 'edit'}
                    disabled={disabled}
                >
                    <span className={styles.segmentInner}>{t('canvas.header.edit', 'Edit')}</span>
                </button>
                <button
                    type="button"
                    className={`${styles.segment} ${styles.run} ${mode === 'run' ? styles.active : ''}`}
                    onClick={() => !disabled && onModeChange('run')}
                    aria-pressed={mode === 'run'}
                    disabled={disabled}
                >
                    <span className={styles.segmentInner}>
                        {t('canvas.header.run', 'Run')}
                        {PlayIcon && <PlayIcon className={styles.runIcon} />}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default EditRunFloating;
