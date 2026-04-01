import React from 'react';
import { LuFolderOpen, LuDownload } from '@xgen/icons';
import styles from '../styles/workflow-panel.module.scss';

interface WorkflowPanelActionButtonsProps {
    onLoad: () => void;
    onExport: () => void;
    loadLabel: string;
    exportLabel: string;
}

export const WorkflowPanelActionButtons: React.FC<WorkflowPanelActionButtonsProps> = ({
    onLoad,
    onExport,
    loadLabel,
    exportLabel,
}) => (
    <div className={styles.actionButtons}>
        <button onClick={onLoad} className={styles.actionButton} type="button">
            <LuFolderOpen />
            <span>{loadLabel}</span>
        </button>
        <button onClick={onExport} className={styles.actionButton} type="button">
            <LuDownload />
            <span>{exportLabel}</span>
        </button>
    </div>
);
