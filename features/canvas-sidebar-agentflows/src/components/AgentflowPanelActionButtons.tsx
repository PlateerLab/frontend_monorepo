import React from 'react';
import { LuFolderOpen, LuDownload } from '@xgen/icons';
import styles from '../styles/agentflow-panel.module.scss';

interface AgentflowPanelActionButtonsProps {
    onLoad: () => void;
    onExport: () => void;
    loadLabel: string;
    exportLabel: string;
}

export const AgentflowPanelActionButtons: React.FC<AgentflowPanelActionButtonsProps> = ({
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
