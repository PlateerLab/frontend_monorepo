import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
import styles from '../styles/CanvasAddNodesPopup.module.scss';
import type { NodeData } from '@xgen/canvas-types';
import { useTranslation } from '@xgen/i18n';
import { getLocalizedNodeName } from './Node/utils/nodeUtils';

// ── Category types (mirrors api-client NodeCategory/NodeFunction) ──

export interface NodeFunction {
    functionId: string;
    functionName: string;
    nodes?: NodeData[];
}

export interface NodeCategory {
    categoryId: string;
    categoryName: string;
    functions: NodeFunction[];
}

// ── Props ──

export interface NodeSelectorPopupProps {
    isOpen: boolean;
    title: string;
    nodes: NodeData[];
    /** Optional grouped categories — when provided, renders tabs + accordion groups */
    categories?: NodeCategory[];
    onSelectNode: (nodeData: NodeData) => void;
    onClose: () => void;
}

// ── Accordion group (collapsed by default) ──

const AccordionGroup: React.FC<{
    title: string;
    functionId?: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}> = ({ title, functionId, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className={styles.accordionGroup}>
            <button
                type="button"
                className={styles.accordionHeader}
                data-accordion-group={functionId || title}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{title}</span>
                <span
                    className={styles.accordionIcon}
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                    ▾
                </span>
            </button>
            {isOpen && <div className={styles.accordionContent}>{children}</div>}
        </div>
    );
};

// ── Description tooltip (hover on ? icon) ──

const DescTooltip: React.FC<{ description: string }> = ({ description }) => {
    return (
        <span
            className={styles.tooltipWrapper}
            onClick={(e) => e.stopPropagation()}
        >
            <span className={styles.tooltipIcon}>?</span>
            <span className={styles.tooltipContent}>{description}</span>
        </span>
    );
};

// ── Main component ──

const NodeSelectorPopupComponent: React.FC<NodeSelectorPopupProps> = ({
    isOpen,
    title,
    nodes,
    categories,
    onSelectNode,
    onClose,
}) => {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const { locale, t } = useTranslation();

    useEffect(() => {
        if (isOpen) setQuery('');
    }, [isOpen]);

    // Set initial tab when categories are provided
    useEffect(() => {
        if (categories && categories.length > 0 && !activeTab) {
            setActiveTab(categories[0].categoryId);
        }
    }, [categories, activeTab]);

    // Reset active tab when popup closes
    useEffect(() => {
        if (!isOpen) setActiveTab(null);
    }, [isOpen]);

    const handleTabClick = useCallback((categoryId: string) => {
        setActiveTab(categoryId);
    }, []);

    // Block wheel events from propagating to the canvas (prevents zoom hijack)
    const stopWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
    }, []);

    // ── Flat mode filtering ──
    const filteredNodes = useMemo(() => {
        if (categories) return []; // not used in category mode
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) return nodes;
        return nodes.filter(node => {
            const name = (node.nodeName || '').toLowerCase();
            const nameKo = ((node as any).nodeNameKo || '').toLowerCase();
            const id = node.id.toLowerCase();
            return name.includes(trimmed) || nameKo.includes(trimmed) || id.includes(trimmed);
        });
    }, [nodes, query, categories]);

    // ── Category mode filtering ──
    const activeCategory = categories?.find(c => c.categoryId === activeTab) ?? null;

    const filteredFunctions = useMemo(() => {
        if (!activeCategory) return [];
        const trimmed = query.trim().toLowerCase();
        const functions = activeCategory.functions ?? [];
        if (!trimmed) return functions;

        return functions
            .map(func => {
                const matchedNodes = (func.nodes ?? []).filter(node => {
                    const name = (node.nodeName || '').toLowerCase();
                    const nameKo = ((node as any).nodeNameKo || '').toLowerCase();
                    const id = node.id.toLowerCase();
                    const desc = ((node as any).description || '').toLowerCase();
                    return name.includes(trimmed) || nameKo.includes(trimmed) || id.includes(trimmed) || desc.includes(trimmed);
                });
                const funcName = (func.functionName || '').toLowerCase();
                if (funcName.includes(trimmed)) {
                    return { ...func, nodes: func.nodes ?? [] };
                }
                return { ...func, nodes: matchedNodes };
            })
            .filter(func => (func.nodes ?? []).length > 0);
    }, [activeCategory, query]);

    // Count total matching nodes for display
    const totalNodeCount = categories
        ? categories.reduce((sum, cat) => sum + (cat.functions?.reduce((s, f) => s + (f.nodes?.length ?? 0), 0) ?? 0), 0)
        : nodes.length;

    const displayedCount = categories
        ? filteredFunctions.reduce((sum, f) => sum + (f.nodes?.length ?? 0), 0)
        : filteredNodes.length;

    if (!isOpen || (totalNodeCount === 0)) return null;

    const useCategoryMode = categories && categories.length > 0;

    return (
        <div
            className={styles.overlay}
            data-node-selector-overlay="true"
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={stopWheel}
        >
            <div className={styles.popup} data-add-nodes-popup="true" onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div>
                        <div className={styles.title}>{title}</div>
                        <div className={styles.subtitle}>
                            {useCategoryMode
                                ? `${displayedCount} of ${totalNodeCount}`
                                : `${filteredNodes.length} of ${nodes.length}`
                            }
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

                {/* Category tabs */}
                {useCategoryMode && (
                    <div className={styles.tabBar}>
                        {categories.map(cat => (
                            <button
                                key={cat.categoryId}
                                type="button"
                                className={`${styles.tabItem} ${activeTab === cat.categoryId ? styles.tabItemActive : ''}`}
                                data-tab-item={cat.categoryId}
                                onClick={() => handleTabClick(cat.categoryId)}
                            >
                                {cat.categoryName}
                            </button>
                        ))}
                    </div>
                )}

                <div className={styles.list}>
                    {useCategoryMode ? (
                        /* Grouped category mode */
                        filteredFunctions.length === 0 ? (
                            <div className={styles.empty}>{t('canvas.noNodesFound')}</div>
                        ) : (
                            filteredFunctions.map(func => (
                                <AccordionGroup key={func.functionId} title={func.functionName} functionId={func.functionId} defaultOpen={filteredFunctions.length === 1}>
                                    {func.nodes?.map(node => {
                                        const desc = locale === 'ko' && node.description_ko
                                            ? node.description_ko
                                            : node.description || '';
                                        return (
                                            <button
                                                key={node.id}
                                                type="button"
                                                className={styles.item}
                                                data-node-item={node.id}
                                                onClick={() => onSelectNode(node)}
                                            >
                                                <span className={styles.itemName}>
                                                    {getLocalizedNodeName(node.nodeName, (node as any).nodeNameKo, locale)}
                                                </span>
                                                <span className={styles.itemId}>{node.id}</span>
                                                {desc && <DescTooltip description={desc} />}
                                            </button>
                                        );
                                    })}
                                </AccordionGroup>
                            ))
                        )
                    ) : (
                        /* Flat list mode (original) */
                        filteredNodes.length === 0 ? (
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
                                        {getLocalizedNodeName(node.nodeName, (node as any).nodeNameKo, locale)}
                                    </span>
                                    <span className={styles.itemId}>{node.id}</span>
                                </button>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export const NodeSelectorPopup = memo(NodeSelectorPopupComponent);
