'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, SearchInput, Button, EmptyState, FilterTabs } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ToolType = 'api' | 'function' | 'webhook' | 'database' | 'mcp';

export interface ToolItem {
  id: string;
  name: string;
  description?: string;
  type: ToolType;
  endpoint?: string;
  method?: string;
  parameters?: { name: string; type: string; required: boolean }[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const ToolIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 8L40 20L20 40H8V28L28 8ZM28 8L32 4L44 16L40 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ApiIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2.5L2.5 6.25V13.75L10 17.5L17.5 13.75V6.25L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 17.5V10M10 10L2.5 6.25M10 10L17.5 6.25" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const FunctionIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 7.5L2.5 10L5 12.5M15 7.5L17.5 10L15 12.5M11.667 3.333L8.333 16.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_TOOLS: ToolItem[] = [
  {
    id: 'tool-001',
    name: 'Search Documents',
    description: 'RAG 기반 문서 검색 API',
    type: 'api',
    endpoint: '/api/search',
    method: 'POST',
    parameters: [
      { name: 'query', type: 'string', required: true },
      { name: 'limit', type: 'number', required: false },
    ],
    usageCount: 1234,
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-25T14:00:00Z',
  },
  {
    id: 'tool-002',
    name: 'Send Email',
    description: '이메일 발송 기능',
    type: 'function',
    parameters: [
      { name: 'to', type: 'string', required: true },
      { name: 'subject', type: 'string', required: true },
      { name: 'body', type: 'string', required: true },
    ],
    usageCount: 567,
    createdAt: '2025-01-12T11:00:00Z',
    updatedAt: '2025-01-26T10:00:00Z',
  },
  {
    id: 'tool-003',
    name: 'Database Query',
    description: '데이터베이스 쿼리 실행',
    type: 'database',
    parameters: [
      { name: 'query', type: 'string', required: true },
    ],
    usageCount: 890,
    createdAt: '2025-01-08T09:00:00Z',
    updatedAt: '2025-01-28T08:00:00Z',
  },
  {
    id: 'tool-004',
    name: 'MCP Weather',
    description: 'MCP 프로토콜 기반 날씨 정보 조회',
    type: 'mcp',
    endpoint: 'mcp://weather',
    usageCount: 234,
    createdAt: '2025-01-20T15:00:00Z',
    updatedAt: '2025-01-27T12:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Tool Storage Page
// ─────────────────────────────────────────────────────────────

interface ToolStoragePageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const ToolStoragePage: React.FC<ToolStoragePageProps> = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const loadTools = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setTools(MOCK_TOOLS);
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      if (search && !tool.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter !== 'all' && tool.type !== filter) return false;
      return true;
    });
  }, [tools, search, filter]);

  const filterTabs = [
    { key: 'all', label: t('toolStorage.filter.all'), count: tools.length },
    { key: 'api', label: 'API', count: tools.filter(t => t.type === 'api').length },
    { key: 'function', label: 'Function', count: tools.filter(t => t.type === 'function').length },
    { key: 'mcp', label: 'MCP', count: tools.filter(t => t.type === 'mcp').length },
  ];

  const getTypeIcon = (type: ToolType) => {
    switch (type) {
      case 'api':
        return <ApiIcon />;
      case 'function':
        return <FunctionIcon />;
      default:
        return <ToolIcon />;
    }
  };

  return (
    <ContentArea
      title={t('toolStorage.title')}
      description={t('toolStorage.description')}
      headerActions={
        <Button>
          <PlusIcon />
          {t('toolStorage.createNew')}
        </Button>
      }
    >
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1">
            <FilterTabs
              tabs={filterTabs}
              activeKey={filter}
              onChange={setFilter}
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('toolStorage.searchPlaceholder')}
              size="sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredTools.length === 0 ? (
          <EmptyState
            icon={<ToolIcon />}
            title={t('toolStorage.empty.title')}
            description={t('toolStorage.empty.description')}
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {filteredTools.map(tool => (
              <div key={tool.id} className="flex flex-col p-5 bg-white border border-border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    {getTypeIcon(tool.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground mb-1">{tool.name}</h3>
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{tool.type}</span>
                  </div>
                </div>
                <p className="text-[13px] text-muted-foreground mb-3 leading-relaxed">{tool.description}</p>
                <div className="text-xs text-muted-foreground/60 flex gap-4 mt-auto">
                  <span>{tool.usageCount.toLocaleString()} uses</span>
                  {tool.parameters && (
                    <span>{tool.parameters.length} params</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainToolStorageFeature: MainFeatureModule = {
  id: 'main-ToolStorage',
  name: 'Tool Storage',
  sidebarSection: 'workflow',
  sidebarItems: [
    {
      id: 'tool-storage',
      titleKey: 'sidebar.workflow.tools.title',
      descriptionKey: 'sidebar.workflow.tools.description',
    },
  ],
  routes: {
    'tool-storage': ToolStoragePage,
  },
  requiresAuth: true,
};

export default mainToolStorageFeature;
