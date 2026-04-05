import './locales';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@xgen/i18n';
import type { CanvasPagePlugin } from '@xgen/types';
import { Tabs, TabsList, TabsTrigger, SearchInput, Button } from '@xgen/ui';
import { LuX, LuRefreshCw } from '@xgen/icons';
import NodeList from './components/NodeList';
import DraggableNodeItem, { type NodeData } from './components/DraggableNodeItem';
import styles from './styles/side-menu.module.scss';

// ── Types ──────────────────────────────────────────────────────

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

export interface AddNodePanelProps {
    onBack?: () => void;
    nodeSpecs?: NodeCategory[];
    nodesLoading?: boolean;
    nodesError?: string | null;
    onRefreshNodes?: () => void;
    onAddNodeToCenter?: (nodeData: NodeData) => void;
    onSidebarDragStart?: (nodeData: NodeData) => void;
    onSidebarDragEnd?: () => void;
}

// ── Component ──────────────────────────────────────────────────

const AddNodePanel: React.FC<AddNodePanelProps> = ({
    onBack,
    nodeSpecs = [],
    nodesLoading = false,
    nodesError = null,
    onRefreshNodes,
    onAddNodeToCenter,
    onSidebarDragStart,
    onSidebarDragEnd,
}) => {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useTranslation();

    useEffect(() => {
        if (nodeSpecs.length > 0) {
            setActiveTab(nodeSpecs[0].categoryId);
        }
    }, [nodeSpecs]);

    const activeTabData = nodeSpecs.find((tab) => tab.categoryId === activeTab);
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredFunctions = useMemo(() => {
        const functions = activeTabData?.functions ?? [];
        if (!normalizedQuery) return functions;

        return functions
            .map((func) => {
                const matchedNodes = (func.nodes ?? []).filter((node) => {
                    const nodeName = String(node.nodeName ?? '').toLowerCase();
                    const nodeDesc = String((node as any).description ?? '').toLowerCase();
                    return nodeName.includes(normalizedQuery) || nodeDesc.includes(normalizedQuery);
                });

                const functionName = String(func.functionName ?? '').toLowerCase();
                if (functionName.includes(normalizedQuery)) {
                    return { ...func, nodes: func.nodes ?? [] };
                }

                return { ...func, nodes: matchedNodes };
            })
            .filter((func) => (func.nodes ?? []).length > 0);
    }, [activeTabData, normalizedQuery]);

    if (nodesLoading) {
        return (
            <>
                <div className={styles.header}>
                    <div className={styles.headerText}>
                        <h3>{t('canvas.addNodePanel.title', 'Add Node')}</h3>
                        <p className={styles.headerSubtitle}>
                            {t('canvas.addNodePanel.subtitle', 'Drag or double-click to add')}
                        </p>
                    </div>
                    {onBack && (
                        <div className={styles.headerActions}>
                            <Button variant="ghost" size="icon" onClick={onBack} title={t('common.close', 'Close')}>
                                <LuX className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
                <div className={styles.loadingContainer}>
                    {t('canvas.addNodePanel.loading', 'Loading nodes...')}
                </div>
            </>
        );
    }

    if (nodesError) {
        return (
            <div className={styles.addNodeInner}>
                <div className={styles.header}>
                    <div className={styles.headerText}>
                        <h3>{t('canvas.addNodePanel.title', 'Add Node')}</h3>
                        <p className={styles.headerSubtitle}>
                            {t('canvas.addNodePanel.subtitle', 'Drag or double-click to add')}
                        </p>
                    </div>
                    {onBack && (
                        <div className={styles.headerActions}>
                            <Button variant="ghost" size="icon" onClick={onBack} title={t('common.close', 'Close')}>
                                <LuX className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
                <div className={styles.errorContainer}>Error: {nodesError}</div>
            </div>
        );
    }

    return (
        <div className={styles.addNodeInner}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h3>{t('canvas.addNodePanel.title', 'Add Node')}</h3>
                    <p className={styles.headerSubtitle}>
                        {t('canvas.addNodePanel.subtitle', 'Drag or double-click to add')}
                    </p>
                </div>
                <div className={styles.headerActions}>
                    {onRefreshNodes && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRefreshNodes}
                            disabled={nodesLoading}
                            title={t('canvas.addNodePanel.refreshTooltip', 'Refresh node list')}
                        >
                            <LuRefreshCw className={`w-4 h-4 ${nodesLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} title={t('common.close', 'Close')}>
                            <LuX className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className={styles.addNodeBody}>
                <div className={styles.searchBar}>
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={t('canvas.addNodePanel.searchPlaceholder', 'Search nodes...')}
                        className={styles.searchInput}
                    />
                </div>

                <Tabs value={activeTab ?? ''} onValueChange={setActiveTab} className={styles.tabsAndList}>
                    <TabsList className={styles.tabs}>
                        {nodeSpecs.map((tab) => (
                            <TabsTrigger
                                key={tab.categoryId}
                                value={tab.categoryId}
                                className={styles.tab}
                            >
                                <span>{tab.categoryName}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className={styles.nodeList}>
                        {filteredFunctions.map((func) => (
                            <NodeList key={func.functionId} title={func.functionName}>
                                {func.nodes?.map((node) => (
                                    <DraggableNodeItem
                                        key={node.id}
                                        nodeData={node}
                                        onDoubleClick={onAddNodeToCenter}
                                        onSidebarDragStart={onSidebarDragStart}
                                        onSidebarDragEnd={onSidebarDragEnd}
                                    />
                                ))}
                            </NodeList>
                        ))}
                        {!filteredFunctions.length && (
                            <div className={styles.noResults}>
                                {t('canvas.addNodePanel.noResults', 'No matching nodes found')}
                            </div>
                        )}
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

// ── Plugin Export ───────────────────────────────────────────────

export const canvasSidebarNodesPlugin: CanvasPagePlugin = {
    id: 'canvas-sidebar-nodes',
    name: 'Canvas Sidebar Nodes',
    sidePanels: [
        {
            id: 'add-node-panel',
            position: 'left',
            component: AddNodePanel as any,
        },
    ],
};

export { AddNodePanel, NodeList, DraggableNodeItem };
export type { NodeData };
export default AddNodePanel;
