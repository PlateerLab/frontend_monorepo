import React, { useState, useMemo, useEffect, memo } from 'react';
import styles from '../styles/CanvasAddNodesPopup.module.scss';
import type { NodeData } from '@xgen/canvas-types';
import { useTranslation } from '@xgen/i18n';
import { getLocalizedNodeName } from './Node/utils/nodeUtils';

export interface NodeSelectorPopupProps {
    isOpen: boolean;
    title: string;
    nodes: NodeData[];
    onSelectNode: (nodeData: NodeData) => void;
    onClose: () => void;
}

const NodeSelectorPopupComponent: React.FC<NodeSelectorPopupProps> = ({
    isOpen,
    title,
    nodes,
    onSelectNode,
    onClose,
}) => {
    const [query, setQuery] = useState('');
    const { locale, t } = useTranslation();

    useEffect(() => {
        if (isOpen) setQuery('');
    }, [isOpen]);

    const filteredNodes = useMemo(() => {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) return nodes;
        return nodes.filter(node => {
            const name = (node.nodeName || '').toLowerCase();
            const nameKo = (node.nodeNameKo || '').toLowerCase();
            const id = node.id.toLowerCase();
            return name.includes(trimmed) || nameKo.includes(trimmed) || id.includes(trimmed);
        });
    }, [nodes, query]);

    if (!isOpen || nodes.length === 0) return null;

    return (
        <div className={styles.overlay} onClick={onClose} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div>
                        <div className={styles.title}>{title}</div>
                        <div className={styles.subtitle}>
                            {filteredNodes.length} of {nodes.length}
                        </div>
                    </div>
                    <button type="button" className={styles.closeButton} onClick={onClose}>
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

export const NodeSelectorPopup = memo(NodeSelectorPopupComponent);
