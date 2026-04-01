import React, { useMemo, useState, useEffect } from 'react';
import styles from '../styles/CanvasAddNodesPopup.module.scss';
import type { NodeData } from '@xgen/canvas-types';
import { useTranslation } from '@xgen/i18n';
import { getLocalizedNodeName } from './Node/utils/nodeUtils';

export interface CanvasAddNodesPopupProps {
    isOpen: boolean;
    position: { x: number; y: number };
    availableNodes: NodeData[];
    onSelectNode: (nodeData: NodeData) => void;
    onClose: () => void;
}

export const CanvasAddNodesPopup: React.FC<CanvasAddNodesPopupProps> = ({
    isOpen,
    position,
    availableNodes,
    onSelectNode,
    onClose
}) => {
    const [query, setQuery] = useState('');
    const { locale, t } = useTranslation();

    // Reset query when popup opens
    useEffect(() => {
        if (isOpen) {
            setQuery('');
        }
    }, [isOpen]);

    const filteredNodes = useMemo(() => {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) return availableNodes;

        return availableNodes.filter(node => {
            const name = (node.nodeName || '').toLowerCase();
            const nameKo = (node.nodeNameKo || '').toLowerCase();
            const id = node.id.toLowerCase();
            return name.includes(trimmed) || nameKo.includes(trimmed) || id.includes(trimmed);
        });
    }, [availableNodes, query]);

    if (!isOpen || availableNodes.length === 0) return null;

    return (
        <div
            className={styles.overlay}
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                className={styles.popup}
                data-add-nodes-popup="true"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <div>
                        <div className={styles.title}>{t('canvas.addNode')}</div>
                        <div className={styles.subtitle}>
                            {filteredNodes.length} of {availableNodes.length} nodes
                        </div>
                    </div>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>
                <div className={styles.search}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder={t('canvas.searchNodes')}
                        className={styles.searchInput}
                        autoFocus
                    />
                </div>
                <div className={styles.list}>
                    {filteredNodes.length === 0 ? (
                        <div className={styles.empty}>{t('canvas.noNodesFound')}</div>
                    ) : (
                        filteredNodes.map(node => (
                            <button
                                key={node.id}
                                type="button"
                                className={styles.item}
                                onClick={() => onSelectNode(node)}
                            >
                                <span className={styles.itemName}>
                                    {getLocalizedNodeName(node.nodeName, node.nodeNameKo, locale)}
                                </span>
                                <span className={styles.itemId}>{node.id}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
