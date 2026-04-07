'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { AdminFeatureModule, RouteComponentProps, ResourceCardProps, CardBadge, CardMetaItem } from '@xgen/types';
import { ContentArea, Button, SearchInput, FilterTabs, ResourceCardGrid } from '@xgen/ui';
import type { FilterTab } from '@xgen/ui';
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

  // 카테고리 탭 (FilterTabs 용)
  const categoryTabs: FilterTab[] = useMemo(() => CATEGORY_IDS.map((id: typeof CATEGORY_IDS[number]) => ({
    key: id,
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

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'info' => {
    const map: Record<string, 'success' | 'warning' | 'info'> = {
      '우수': 'success', '양호': 'warning', '일반': 'info',
    };
    return map[status] ?? 'info';
  };

  const getStatusText = (status: string): string => {
    const map: Record<string, string> = {
      '우수': t('admin.pages.mcpMarket.card.status.excellent', 'Excellent'),
      '양호': t('admin.pages.mcpMarket.card.status.good', 'Good'),
      '일반': t('admin.pages.mcpMarket.card.status.normal', 'Normal'),
    };
    return map[status] ?? status;
  };

  // ResourceCardGrid 용 아이템 매핑
  const cardItems: ResourceCardProps<MCPItem>[] = useMemo(() =>
    filtered.map((item: MCPItem) => {
      const badges: CardBadge[] = [];
      if (item.status) {
        badges.push({ text: getStatusText(item.status), variant: getStatusBadgeVariant(item.status) });
      }

      const metadata: CardMetaItem[] = [
        { label: 'downloads', value: `${formatNumber(item.downloads)} downloads` },
        { label: 'stars', value: `${formatNumber(item.stars)} stars` },
      ];
      if (item.version) {
        metadata.push({ label: 'version', value: `v${item.version}` });
      }

      return {
        id: item.id,
        data: item,
        title: item.name,
        description: item.description,
        thumbnail: item.iconUrl
          ? { imageUrl: item.iconUrl }
          : { icon: <span className="text-sm font-bold">{item.name.charAt(0).toUpperCase()}</span>, backgroundColor: 'var(--color-primary)' },
        badges,
        metadata,
        onClick: (data: MCPItem) => setSelectedItem(data),
      };
    }),
  [filtered, t]);

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

  // 에러 상태
  if (error && !loading) {
    return (
      <ContentArea
        title={t('admin.pages.mcpMarket.title', 'MCP Market')}
        description={t('admin.pages.mcpMarket.description', 'Browse and install MCP tool servers')}
        headerActions={
          <Button variant="outline" size="sm" onClick={fetchMarketItems}>
            {t('admin.pages.mcpMarket.retry', 'Retry')}
          </Button>
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-xl text-red-600">!</div>
            <p className="text-sm font-medium text-red-700">{t('admin.pages.mcpMarket.loadError', 'Failed to load')}</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea
      title={t('admin.pages.mcpMarket.title', 'MCP Market')}
      description={t('admin.pages.mcpMarket.description', 'Browse and install MCP tool servers')}
      headerActions={
        <Button variant="outline" size="sm" onClick={fetchMarketItems} disabled={loading}>
          {t('common.refresh', 'Refresh')}
        </Button>
      }
      toolbar={
        <div className="flex items-center gap-3 w-full">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('admin.pages.mcpMarket.searchPlaceholder', 'Search tools by name, description...')}
          />
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
      }
      subToolbar={
        <FilterTabs
          tabs={categoryTabs}
          activeKey={category}
          onChange={setCategory}
          variant="pills"
        />
      }
      footer={
        <div className="text-xs text-muted-foreground">
          {t('admin.pages.mcpMarket.resultCount', { count: filtered.length.toLocaleString() })}
        </div>
      }
    >
      <ResourceCardGrid<MCPItem>
        items={cardItems}
        loading={loading}
        columns={3}
        emptyStateProps={{
          title: t('admin.pages.mcpMarket.empty.title', 'No tools found'),
          description: t('admin.pages.mcpMarket.empty.description', 'Try adjusting your search or filter'),
        }}
      />
    </ContentArea>
  );
};

const feature: AdminFeatureModule = {
  id: 'admin-mcp-market',
  name: 'AdminMcpMarketPage',
  adminSection: 'admin-mcp',
  sidebarItems: [
    { id: 'admin-mcp-market', titleKey: 'admin.sidebar.mcp.mcpMarket.title', descriptionKey: 'admin.sidebar.mcp.mcpMarket.description' },
  ],
  routes: {
    'admin-mcp-market': AdminMcpMarketPage,
  },
};

export default feature;
