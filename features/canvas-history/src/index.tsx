import './locales';
import React from 'react';
import { FaTrashAlt } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import type { CanvasPagePlugin } from '@xgen/types';
import styles from './styles/history-panel.module.scss';

// ── Types ──────────────────────────────────────────────────────

export type HistoryActionType =
    | 'NODE_MOVE'
    | 'NODE_CREATE'
    | 'NODE_DELETE'
    | 'EDGE_CREATE'
    | 'EDGE_DELETE'
    | 'EDGE_UPDATE'
    | 'MULTI_ACTION';

export interface HistoryEntry {
    id: string;
    actionType: HistoryActionType;
    description: string;
    timestamp: Date;
    canvasState?: any;
    details: Record<string, any>;
}

export interface HistoryPanelProps {
    history: HistoryEntry[];
    currentHistoryIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onClearHistory?: () => void;
    onJumpToHistoryIndex?: (index: number) => void;
    canUndo: boolean;
    canRedo: boolean;
    /** Toast wrapper for clear-history confirmation */
    showClearConfirm?: (onConfirm: () => void) => void;
}

// ── Constants ──────────────────────────────────────────────────

const ACTION_TYPE_COLORS: Record<HistoryActionType, string> = {
    NODE_MOVE: '#3B82F6',
    NODE_CREATE: '#10B981',
    NODE_DELETE: '#EF4444',
    EDGE_CREATE: '#8B5CF6',
    EDGE_DELETE: '#F59E0B',
    EDGE_UPDATE: '#EC4899',
    MULTI_ACTION: '#F97316',
};

// ── Component ──────────────────────────────────────────────────

const HistoryPanel: React.FC<HistoryPanelProps> = ({
    history,
    currentHistoryIndex,
    isOpen,
    onClose,
    onClearHistory,
    onJumpToHistoryIndex,
    showClearConfirm,
}) => {
    const { t } = useTranslation();

    const formatTimestamp = (timestamp: Date) =>
        timestamp.toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

    const getActionLabel = (actionType: HistoryActionType): string => {
        const key = `canvas.history.action.${actionType}` as const;
        const fallbackMap: Record<HistoryActionType, string> = {
            NODE_MOVE: '이동',
            NODE_CREATE: '생성',
            NODE_DELETE: '삭제',
            EDGE_CREATE: '연결',
            EDGE_DELETE: '연결해제',
            EDGE_UPDATE: '연결수정',
            MULTI_ACTION: '통합작업',
        };
        return t(key, fallbackMap[actionType]);
    };

    if (!isOpen) return null;

    return (
        <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
            <div className={styles.header}>
                <h2 className={styles.title}>{t('canvas.history.title', '작업 히스토리')}</h2>
                <div className={styles.headerControls}>
                    <span className={styles.count}>
                        {t('canvas.history.count', { current: history.length, max: 50 }, `총 ${history.length}개 / 50개`)}
                    </span>
                    {onClearHistory && (
                        <button
                            className={styles.clearButton}
                            onClick={() => {
                                if (history.length > 0) {
                                    if (showClearConfirm) {
                                        showClearConfirm(() => onClearHistory());
                                    } else {
                                        onClearHistory();
                                    }
                                }
                            }}
                            disabled={history.length === 0}
                            type="button"
                        >
                            <FaTrashAlt />
                        </button>
                    )}
                    <button className={styles.closeButton} onClick={onClose} type="button">
                        ×
                    </button>
                </div>
            </div>

            <div className={styles.historyList}>
                {history.length === 0 ? (
                    <div className={styles.emptyState}>
                        {t('canvas.history.empty', '아직 기록된 작업이 없습니다.')}
                    </div>
                ) : (
                    <>
                        <div
                            className={`${styles.historyItem} ${styles.currentState} ${currentHistoryIndex === -1 ? styles.active : ''}`}
                            onClick={() => onJumpToHistoryIndex?.(-1)}
                        >
                            <div className={styles.itemHeader}>
                                <span className={styles.currentStateBadge}>
                                    {t('canvas.history.currentState', '현재 상태')}
                                </span>
                            </div>
                            <div className={styles.description}>
                                {t('canvas.history.latestState', '최신 작업 상태')}
                            </div>
                        </div>

                        {history.map((entry) => {
                            const actualIndex = history.indexOf(entry);
                            const isActive = currentHistoryIndex === actualIndex;
                            const isFuture = currentHistoryIndex !== -1 && actualIndex < currentHistoryIndex;
                            const isPast = currentHistoryIndex !== -1 && actualIndex >= currentHistoryIndex;

                            return (
                                <div
                                    key={entry.id}
                                    className={`${styles.historyItem} ${isActive ? styles.active : ''} ${isFuture ? styles.future : ''} ${isPast ? styles.past : ''}`}
                                    onClick={() => onJumpToHistoryIndex?.(actualIndex)}
                                >
                                    <div className={styles.itemHeader}>
                                        <span
                                            className={styles.actionBadge}
                                            style={{ backgroundColor: ACTION_TYPE_COLORS[entry.actionType] }}
                                        >
                                            {getActionLabel(entry.actionType)}
                                        </span>
                                        <span className={styles.timestamp}>
                                            {formatTimestamp(entry.timestamp)}
                                        </span>
                                    </div>
                                    <div className={styles.description}>{entry.description}</div>
                                    {Object.keys(entry.details).length > 0 && (
                                        <div className={styles.details}>
                                            {entry.actionType === 'MULTI_ACTION' && entry.details.actions ? (
                                                <div className={styles.multiActionDetails}>
                                                    {entry.details.actions.map((action: any, idx: number) => (
                                                        <span key={idx} className={styles.detailItem}>
                                                            {getActionLabel(action.actionType as HistoryActionType)}
                                                            {action.nodeId && ` Node ${action.nodeId}`}
                                                            {action.edgeId && ` Edge ${action.edgeId}`}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <>
                                                    {entry.details.nodeId && (
                                                        <span className={styles.detailItem}>
                                                            Node: {entry.details.nodeId}
                                                        </span>
                                                    )}
                                                    {entry.details.edgeId && (
                                                        <span className={styles.detailItem}>
                                                            Edge: {entry.details.edgeId}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};

// ── Plugin Export ───────────────────────────────────────────────

export const canvasHistoryPlugin: CanvasPagePlugin = {
    id: 'canvas-history',
    name: 'Canvas History',
    overlays: [
        {
            id: 'history-panel',
            component: HistoryPanel as any,
        },
    ],
};

export { HistoryPanel };
export default HistoryPanel;
