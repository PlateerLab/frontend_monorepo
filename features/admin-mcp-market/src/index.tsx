'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps } from '@xgen/types';
import { ContentArea, Button, SearchInput, StatusBadge } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import {
  getMCPMarketList,
  transformMCPItemResponse,
  type MCPItem,
  type MCPMarketListResponse,
} from '@xgen/api-client';
import MCPDetailSection from './MCPDetailSection';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const CATEGORY_IDS = [
  'all', 'dev-tools', 'productivity', 'ai',
  'data-analysis', 'business', 'media', 'integration', 'other',
] as const;

type SortBy = 'downloads' | 'stars' | 'name' | 'updated';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const AdminMcpMarketPage: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<MCPItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortBy>('downloads');
  const [selectedItem, setSelectedItem] = useState<MCPItem | null>(null);

  const fetchMarketItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: MCPMarketListResponse = await getMCPMarketList();
      if (response.success && response.items) {
        setItems(response.items.map(transformMCPItemResponse));
      } else {
        setError(t('admin.pages.mcpMarket.loadError', 'Failed to load MCP market items'));
      }
    } catch (err) {
      console.error('Failed to fetch MCP market items:', err);
      setError(err instanceof Error ? err.message : t('admin.pages.mcpMarket.loadError', 'Failed to load MCP market items'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMarketItems();
  }, [fetchMarketItems]);

  // 카테고리별 아이템 수
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach((i: MCPItem) => { counts[i.category] = (counts[i.category] || 0) + 1; });
    return counts;
  }, [items]);

  // 카테고리 목록 (i18n)
  const categories = useMemo(() => CATEGORY_IDS.map((id: typeof CATEGORY_IDS[number]) => ({
    id,
    label: t(`admin.pages.mcpMarket.categories.${id === 'all' ? 'all' : id === 'dev-tools' ? 'devTools' : id === 'data-analysis' ? 'dataAnalysis' : id}`, id),
    count: categoryCounts[id] ?? 0,
  })), [t, categoryCounts]);

  // 필터링 및 정렬
  const filtered = useMemo(() => {
    let result = items;
    if (category !== 'all') result = result.filter((i: MCPItem) => i.category === category);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((i: MCPItem) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.author.toLowerCase().includes(q)
      );
    }
    const sorted = [...result];
    switch (sortBy) {
      case 'downloads': sorted.sort((a, b) => b.downloads - a.downloads); break;
      case 'stars': sorted.sort((a, b) => b.stars - a.stars); break;
      case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'updated': sorted.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()); break;
    }
    return sorted;
  }, [items, search, category, sortBy]);

  const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const getStatusText = (status: string): string => {
    const map: Record<string, { label: string; badge: 'success' | 'warning' | 'info' }> = {
      '우수': { label: t('admin.pages.mcpMarket.card.status.excellent', 'Excellent'), badge: 'success' },
      '양호': { label: t('admin.pages.mcpMarket.card.status.good', 'Good'), badge: 'warning' },
      '일반': { label: t('admin.pages.mcpMarket.card.status.normal', 'Normal'), badge: 'info' },
    };
    return map[status]?.label ?? status;
  };

  const getStatusBadge = (status: string): 'success' | 'warning' | 'info' => {
    const map: Record<string, 'success' | 'warning' | 'info'> = {
      '우수': 'success', '양호': 'warning', '일반': 'info',
    };
    return map[status] ?? 'info';
  };

  // 상세 뷰가 선택된 경우 상세 섹션 렌더링
  if (selectedItem) {
    return (
      <ContentArea
        title={t('admin.pages.mcpMarket.title', 'MCP Market')}
        description={t('admin.pages.mcpMarket.description', 'Browse and install MCP tool servers')}
      >
        <MCPDetailSection item={selectedItem} onBack={() => setSelectedItem(null)} />
      </ContentArea>
    );
  }

  // 로딩 상태
  if (loading) {
    return (
      <ContentArea
        title={t('admin.pages.mcpMarket.title', 'MCP Market')}
        description={t('admin.pages.mcpMarket.description', 'Browse and install MCP tool servers')}
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">{t('admin.pages.mcpMarket.loading', 'Loading MCP market...')}</p>
          </div>
        </div>
      </ContentArea>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <ContentArea
        title={t('admin.pages.mcpMarket.title', 'MCP Market')}
        description={t('admin.pages.mcpMarket.description', 'Browse and install MCP tool servers')}
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-xl text-red-600">!</div>
            <p className="text-sm font-medium text-red-700">{t('admin.pages.mcpMarket.loadError', 'Failed to load')}</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchMarketItems}>
              {t('admin.pages.mcpMarket.retry', 'Retry')}
            </Button>
          </div>
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea
      title={t('admin.pages.mcpMarket.title', 'MCP Market')}
      description={t('admin.pages.mcpMarket.description', 'Browse and install MCP tool servers')}
    >
      {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="w-80">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('admin.pages.mcpMarket.searchPlaceholder', 'Search tools by name, description...')}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('common.sortBy', 'Sort by')}:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="downloads">{t('admin.pages.mcpMarket.sort.downloads', 'Downloads')}</option>
              <option value="stars">{t('admin.pages.mcpMarket.sort.stars', 'Stars')}</option>
              <option value="updated">{t('admin.pages.mcpMarket.sort.updated', 'Updated')}</option>
              <option value="name">{t('admin.pages.mcpMarket.sort.name', 'Name')}</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat: { id: string; label: string; count: number }) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                category === cat.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              {cat.label}
              <span className="ml-1 opacity-60">({cat.count.toLocaleString()})</span>
            </button>
          ))}
        </div>

        {/* Result count */}
        <div className="text-xs text-muted-foreground">
          {t('admin.pages.mcpMarket.resultCount', { count: filtered.length.toLocaleString() })}
        </div>

        {/* Card Grid */}
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <div className="text-center">
              <p className="text-sm font-medium">{t('admin.pages.mcpMarket.empty.title', 'No tools found')}</p>
              <p className="text-xs mt-1">{t('admin.pages.mcpMarket.empty.description', 'Try adjusting your search or filter')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item: MCPItem) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden">
                      {item.iconUrl ? (
                        <img src={item.iconUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        item.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.author}</p>
                    </div>
                  </div>
                  {item.status && (
                    <StatusBadge status={getStatusBadge(item.status)}>
                      {getStatusText(item.status)}
                    </StatusBadge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-4 mt-auto">
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(item.downloads)} downloads
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(item.stars)} stars
                  </span>
                  {item.version && (
                    <span className="text-xs text-muted-foreground ml-auto">v{item.version}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-mcp-market',
  name: 'AdminMcpMarketPage',
  adminSection: 'admin-mcp',
  routes: {
    'admin-mcp-market': AdminMcpMarketPage,
  },
};

export default feature;
