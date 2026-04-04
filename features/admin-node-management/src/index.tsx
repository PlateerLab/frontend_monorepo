'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, StatusBadge, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiRefreshCw } from '@xgen/icons';
import { getNodes } from './api/node-api';
import type { NodeCategory, FlatNode } from './types';
import NodeTableView from './components/node-table-view';
import NodeTreeView from './components/node-tree-view';

type ViewMode = 'table' | 'tree';

const AdminNodeManagementPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const prefix = 'admin.workflowManagement.nodeManagement';

  const [categories, setCategories] = useState<NodeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Tree expand state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(
    new Set(),
  );

  // Auto-expand all tree nodes on data load
  const expandAll = useCallback((data: NodeCategory[]) => {
    const catIds = new Set<string>();
    const fnKeys = new Set<string>();
    for (const cat of data) {
      catIds.add(cat.categoryId);
      for (const fn of cat.functions) {
        fnKeys.add(`${cat.categoryId}::${fn.functionId}`);
      }
    }
    setExpandedCategories(catIds);
    setExpandedFunctions(fnKeys);
  }, []);

  const fetchNodes = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        const data = await getNodes();
        setCategories(data);
        expandAll(data);
      } catch {
        const msg = isRefresh
          ? t(`${prefix}.refreshError`)
          : t(`${prefix}.loadError`);
        if (isRefresh) {
          toast.error(msg);
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t, toast, expandAll, prefix],
  );

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  // Flatten categories into FlatNode array
  const allFlatNodes = useMemo<FlatNode[]>(() => {
    const result: FlatNode[] = [];
    for (const cat of categories) {
      for (const fn of cat.functions) {
        for (const node of fn.nodes) {
          result.push({
            ...node,
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            functionId: fn.functionId,
            functionName: fn.functionName,
          });
        }
      }
    }
    return result;
  }, [categories]);

  // Search filter
  const filteredFlatNodes = useMemo(() => {
    if (!search.trim()) return allFlatNodes;
    const q = search.toLowerCase().trim();
    return allFlatNodes.filter(
      (node) =>
        node.categoryName.toLowerCase().includes(q) ||
        node.functionName.toLowerCase().includes(q) ||
        node.nodeName.toLowerCase().includes(q) ||
        node.description.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q) ||
        node.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [allFlatNodes, search]);

  // Filtered categories for tree view
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase().trim();
    return categories
      .map((cat) => ({
        ...cat,
        functions: cat.functions
          .map((fn) => ({
            ...fn,
            nodes: fn.nodes.filter(
              (node) =>
                cat.categoryName.toLowerCase().includes(q) ||
                fn.functionName.toLowerCase().includes(q) ||
                node.nodeName.toLowerCase().includes(q) ||
                node.description.toLowerCase().includes(q) ||
                node.id.toLowerCase().includes(q) ||
                node.tags.some((tag) => tag.toLowerCase().includes(q)),
            ),
          }))
          .filter((fn) => fn.nodes.length > 0),
      }))
      .filter((cat) => cat.functions.length > 0);
  }, [categories, search]);

  const totalNodes = allFlatNodes.length;
  const displayedNodes = filteredFlatNodes.length;

  const handleToggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleToggleFunction = useCallback((functionKey: string) => {
    setExpandedFunctions((prev) => {
      const next = new Set(prev);
      if (next.has(functionKey)) {
        next.delete(functionKey);
      } else {
        next.add(functionKey);
      }
      return next;
    });
  }, []);

  // Loading state
  if (loading) {
    return (
      <ContentArea
        title={t(`${prefix}.title`)}
        description={t(`${prefix}.subtitle`)}
      >
        <div className="flex items-center justify-center p-16">
          <div className="flex flex-col items-center gap-3">
            <FiRefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t(`${prefix}.loading`)}
            </p>
          </div>
        </div>
      </ContentArea>
    );
  }

  // Error state
  if (error) {
    return (
      <ContentArea
        title={t(`${prefix}.title`)}
        description={t(`${prefix}.subtitle`)}
      >
        <div className="flex items-center justify-center p-16">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchNodes()}>
              {t(`${prefix}.retry`)}
            </Button>
          </div>
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea
      title={t(`${prefix}.title`)}
      description={t(`${prefix}.subtitle`)}
    >
      {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-foreground text-background'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setViewMode('table')}
              >
                {t(`${prefix}.tableView`)}
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'tree'
                    ? 'bg-foreground text-background'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setViewMode('tree')}
              >
                {t(`${prefix}.treeView`)}
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(`${prefix}.searchPlaceholder`)}
              className="h-9 w-64 rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            <span className="text-sm text-muted-foreground">
              {t(`${prefix}.totalNodes`)}: {totalNodes}
              {search.trim() && ` / ${t(`${prefix}.displayed`)}: ${displayedNodes}`}
            </span>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={
                <FiRefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
                />
              }
              disabled={refreshing}
              onClick={() => fetchNodes(true)}
            >
              {t(`${prefix}.refresh`)}
            </Button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          filteredFlatNodes.length > 0 ? (
            <NodeTableView nodes={filteredFlatNodes} />
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-border p-12">
              <p className="text-sm text-muted-foreground">
                {t(`${prefix}.noSearchResults`)}
              </p>
            </div>
          )
        ) : filteredCategories.length > 0 ? (
          <NodeTreeView
            categories={filteredCategories}
            expandedCategories={expandedCategories}
            expandedFunctions={expandedFunctions}
            onToggleCategory={handleToggleCategory}
            onToggleFunction={handleToggleFunction}
          />
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-border p-12">
            <p className="text-sm text-muted-foreground">
              {t(`${prefix}.noSearchResults`)}
            </p>
          </div>
        )}
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-node-management',
  name: 'AdminNodeManagementPage',
  adminSection: 'admin-workflow',
  routes: {
    'admin-node-management': AdminNodeManagementPage,
  },
};

export default feature;
