'use client';

import React, { useState } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, SearchInput, FilterTabs, EmptyState, CardGrid } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type DatasetType = 'tabular' | 'text' | 'image' | 'audio' | 'video';
type DatasetStatus = 'ready' | 'processing' | 'error' | 'archived';

interface Dataset {
  id: string;
  name: string;
  description: string;
  type: DatasetType;
  status: DatasetStatus;
  rows: number;
  columns: number;
  size: number; // in bytes
  format: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  owner: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const TableIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 9H21M3 15H21M9 9V21M15 9V21" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const DownloadIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V10M8 10L5 7M8 10L11 7M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UploadIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 14V6M8 6L5 9M8 6L11 9M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: { padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 700, color: '#1F2937' },
  headerActions: { display: 'flex', gap: '12px' },
  controls: { display: 'flex', gap: '16px', marginBottom: '24px' },
  searchWrapper: { flex: 1, maxWidth: '400px' },
  summaryCards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
  summaryCard: { padding: '20px', background: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB' },
  summaryValue: { fontSize: '28px', fontWeight: 700, color: '#10B981', marginBottom: '4px' },
  summaryLabel: { fontSize: '13px', color: '#6B7280' },
  datasetCard: { background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' },
  cardHeader: { padding: '20px', borderBottom: '1px solid #F3F4F6' },
  cardTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  cardTitle: { fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: 0 },
  typeBadge: { padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 },
  cardDescription: { fontSize: '13px', color: '#6B7280', lineHeight: 1.5, marginBottom: '12px' },
  cardMeta: { display: 'flex', gap: '16px', fontSize: '12px', color: '#9CA3AF' },
  cardBody: { padding: '16px 20px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' },
  statItem: { textAlign: 'center' as const },
  statValue: { fontSize: '16px', fontWeight: 600, color: '#1F2937' },
  statLabel: { fontSize: '10px', color: '#9CA3AF' },
  tags: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const },
  tag: { padding: '3px 8px', background: '#F3F4F6', borderRadius: '4px', fontSize: '11px', color: '#6B7280' },
  cardFooter: { padding: '16px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 500 },
  cardActions: { display: 'flex', gap: '8px' },
};

const typeColors: Record<DatasetType, { bg: string; color: string }> = {
  tabular: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' },
  text: { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' },
  image: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' },
  audio: { bg: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' },
  video: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' },
};

const statusStyles: Record<DatasetStatus, { bg: string; color: string }> = {
  ready: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16A34A' },
  processing: { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' },
  error: { bg: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' },
  archived: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' },
};

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const mockDatasets: Dataset[] = [
  {
    id: 'ds-001',
    name: 'Customer Transactions 2024',
    description: '2024년 1월부터 현재까지의 고객 거래 데이터. 구매 내역, 결제 정보, 고객 세그먼트 포함.',
    type: 'tabular',
    status: 'ready',
    rows: 2500000,
    columns: 45,
    size: 1200000000,
    format: 'parquet',
    tags: ['transactions', 'customer', 'financial'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
    owner: 'data-team',
  },
  {
    id: 'ds-002',
    name: 'Product Reviews Corpus',
    description: '제품 리뷰 텍스트 데이터셋. 감성 분석 및 NLP 모델 훈련에 활용.',
    type: 'text',
    status: 'ready',
    rows: 850000,
    columns: 8,
    size: 450000000,
    format: 'jsonl',
    tags: ['nlp', 'sentiment', 'reviews'],
    createdAt: '2023-12-15T00:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
    owner: 'nlp-team',
  },
  {
    id: 'ds-003',
    name: 'Product Images Dataset',
    description: '제품 이미지 데이터셋. 카테고리별 레이블링 완료.',
    type: 'image',
    status: 'processing',
    rows: 150000,
    columns: 0,
    size: 8500000000,
    format: 'jpeg/png',
    tags: ['vision', 'classification', 'products'],
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-15T16:00:00Z',
    owner: 'vision-team',
  },
  {
    id: 'ds-004',
    name: 'Customer Support Calls',
    description: '고객 지원 통화 녹음 데이터. 음성 인식 모델 훈련용.',
    type: 'audio',
    status: 'ready',
    rows: 25000,
    columns: 0,
    size: 12000000000,
    format: 'wav',
    tags: ['speech', 'support', 'audio'],
    createdAt: '2023-11-01T00:00:00Z',
    updatedAt: '2024-01-05T14:00:00Z',
    owner: 'speech-team',
  },
];

// ─────────────────────────────────────────────────────────────
// Data Storage Page
// ─────────────────────────────────────────────────────────────

interface DataStoragePageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const DataStoragePage: React.FC<DataStoragePageProps> = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t('dataStorage.tabs.all') },
    { id: 'tabular', label: t('dataStorage.tabs.tabular') },
    { id: 'text', label: t('dataStorage.tabs.text') },
    { id: 'image', label: t('dataStorage.tabs.image') },
    { id: 'audio', label: t('dataStorage.tabs.audio') },
  ];

  const filteredDatasets = mockDatasets.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dataset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = activeTab === 'all' || dataset.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const formatSize = (bytes: number) => {
    if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
    return `${(bytes / 1e3).toFixed(0)} KB`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  // Calculate summary stats
  const totalDatasets = mockDatasets.length;
  const totalSize = mockDatasets.reduce((sum, d) => sum + d.size, 0);
  const totalRows = mockDatasets.reduce((sum, d) => sum + d.rows, 0);
  const readyDatasets = mockDatasets.filter(d => d.status === 'ready').length;

  return (
    <ContentArea title={t('dataStorage.title')}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('dataStorage.title')}</h1>
          <div style={styles.headerActions}>
            <Button variant="outline">
              <DownloadIcon />
              {t('dataStorage.exportAll')}
            </Button>
            <Button variant="primary">
              <UploadIcon />
              {t('dataStorage.uploadDataset')}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryCards}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryValue}>{totalDatasets}</div>
            <div style={styles.summaryLabel}>{t('dataStorage.summary.datasets')}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryValue}>{formatSize(totalSize)}</div>
            <div style={styles.summaryLabel}>{t('dataStorage.summary.totalSize')}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryValue}>{formatNumber(totalRows)}</div>
            <div style={styles.summaryLabel}>{t('dataStorage.summary.totalRows')}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryValue, color: '#22C55E' }}>{readyDatasets}/{totalDatasets}</div>
            <div style={styles.summaryLabel}>{t('dataStorage.summary.ready')}</div>
          </div>
        </div>

        <div style={styles.controls}>
          <div style={styles.searchWrapper}>
            <SearchInput
              placeholder={t('dataStorage.searchPlaceholder')}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <FilterTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {filteredDatasets.length === 0 ? (
          <EmptyState
            title={t('dataStorage.empty.title')}
            description={t('dataStorage.empty.description')}
          />
        ) : (
          <CardGrid columns={2}>
            {filteredDatasets.map(dataset => (
              <div key={dataset.id} style={styles.datasetCard}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleRow}>
                    <h3 style={styles.cardTitle}>{dataset.name}</h3>
                    <span
                      style={{
                        ...styles.typeBadge,
                        background: typeColors[dataset.type].bg,
                        color: typeColors[dataset.type].color,
                      }}
                    >
                      {dataset.type}
                    </span>
                  </div>
                  <p style={styles.cardDescription}>{dataset.description}</p>
                  <div style={styles.cardMeta}>
                    <span>{dataset.format.toUpperCase()}</span>
                    <span>by {dataset.owner}</span>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.statsRow}>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{formatNumber(dataset.rows)}</div>
                      <div style={styles.statLabel}>{t('dataStorage.rows')}</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{dataset.columns || '-'}</div>
                      <div style={styles.statLabel}>{t('dataStorage.columns')}</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{formatSize(dataset.size)}</div>
                      <div style={styles.statLabel}>{t('dataStorage.size')}</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{dataset.format}</div>
                      <div style={styles.statLabel}>{t('dataStorage.format')}</div>
                    </div>
                  </div>
                  <div style={styles.tags}>
                    {dataset.tags.map(tag => (
                      <span key={tag} style={styles.tag}>{tag}</span>
                    ))}
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: statusStyles[dataset.status].bg,
                      color: statusStyles[dataset.status].color,
                    }}
                  >
                    {dataset.status}
                  </span>
                  <div style={styles.cardActions}>
                    <Button variant="outline" size="sm">{t('dataStorage.preview')}</Button>
                    <Button variant="primary" size="sm">
                      <DownloadIcon />
                      {t('dataStorage.download')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardGrid>
        )}
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainDataStorageFeature: MainFeatureModule = {
  id: 'main-DataStorage',
  name: 'Data Storage',
  sidebarSection: 'data',
  sidebarItems: [
    {
      id: 'data-storage',
      titleKey: 'sidebar.data.storage.title',
      descriptionKey: 'sidebar.data.storage.description',
    },
  ],
  routes: {
    'data-storage': DataStoragePage,
  },
  requiresAuth: true,
};

export default mainDataStorageFeature;
