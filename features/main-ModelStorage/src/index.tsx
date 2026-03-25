'use client';

import React, { useState } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, SearchInput, FilterTabs, EmptyState, CardGrid } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ModelStatus = 'active' | 'archived' | 'draft';
type ModelFramework = 'pytorch' | 'tensorflow' | 'onnx' | 'transformers';

interface StoredModel {
  id: string;
  name: string;
  version: string;
  framework: ModelFramework;
  status: ModelStatus;
  size: number; // in bytes
  accuracy: number;
  downloads: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  description: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const DownloadIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V10M8 10L5 7M8 10L11 7M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DeployIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 14L14 8L8 2M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ModelIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 10V22M12 14L16 16L20 14M12 18L16 16L20 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: { padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 700, color: '#1F2937' },
  controls: { display: 'flex', gap: '16px', marginBottom: '24px' },
  searchWrapper: { flex: 1, maxWidth: '400px' },
  modelCard: { background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', transition: 'box-shadow 0.2s ease' },
  modelHeader: { padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' },
  modelIcon: { width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modelInfo: { flex: 1, minWidth: 0 },
  modelTitle: { fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  modelMeta: { fontSize: '13px', color: '#6B7280', display: 'flex', gap: '8px', alignItems: 'center' },
  versionBadge: { padding: '2px 8px', background: 'rgba(48, 94, 235, 0.1)', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#305EEB' },
  statusBadge: { marginLeft: 'auto', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 500 },
  modelBody: { padding: '0 20px 20px' },
  modelDesc: { fontSize: '13px', color: '#6B7280', lineHeight: 1.6, marginBottom: '16px' },
  tags: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '16px' },
  tag: { padding: '4px 10px', background: '#F3F4F6', borderRadius: '6px', fontSize: '11px', color: '#6B7280' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px', background: '#F9FAFB', borderRadius: '12px' },
  statItem: { textAlign: 'center' as const },
  statValue: { fontSize: '18px', fontWeight: 700, color: '#1F2937' },
  statLabel: { fontSize: '11px', color: '#9CA3AF' },
  modelFooter: { padding: '16px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modelDate: { fontSize: '11px', color: '#9CA3AF' },
  modelActions: { display: 'flex', gap: '8px' },
};

const frameworkColors: Record<ModelFramework, string> = {
  pytorch: '#EE4C2C',
  tensorflow: '#FF6F00',
  onnx: '#005CED',
  transformers: '#FFD21E',
};

const statusStyles: Record<ModelStatus, { bg: string; color: string }> = {
  active: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16A34A' },
  archived: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' },
  draft: { bg: 'rgba(251, 191, 36, 0.1)', color: '#D97706' },
};

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const mockModels: StoredModel[] = [
  {
    id: 'model-001',
    name: 'Customer Intent Classifier',
    version: 'v2.1.0',
    framework: 'transformers',
    status: 'active',
    size: 456000000,
    accuracy: 0.943,
    downloads: 234,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    tags: ['nlp', 'classification', 'bert', 'production'],
    description: 'BERT 기반 고객 의도 분류 모델. 12개 카테고리로 고객 질의를 자동 분류합니다.',
  },
  {
    id: 'model-002',
    name: 'Document Parser',
    version: 'v1.8.5',
    framework: 'pytorch',
    status: 'active',
    size: 890000000,
    accuracy: 0.912,
    downloads: 156,
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-14T10:15:00Z',
    tags: ['nlp', 'ner', 'document-ai'],
    description: '문서에서 주요 엔티티와 구조를 추출하는 모델입니다.',
  },
  {
    id: 'model-003',
    name: 'Image Classifier v3',
    version: 'v3.0.0',
    framework: 'onnx',
    status: 'draft',
    size: 245000000,
    accuracy: 0.0,
    downloads: 0,
    createdAt: '2024-01-15T16:00:00Z',
    updatedAt: '2024-01-15T16:00:00Z',
    tags: ['vision', 'classification', 'resnet'],
    description: '제품 이미지 분류를 위한 ResNet 기반 모델 (훈련 중)',
  },
  {
    id: 'model-004',
    name: 'Sentiment Analyzer',
    version: 'v2.0.0',
    framework: 'tensorflow',
    status: 'archived',
    size: 320000000,
    accuracy: 0.885,
    downloads: 89,
    createdAt: '2023-12-01T09:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    tags: ['nlp', 'sentiment', 'lstm'],
    description: '리뷰 텍스트의 감정을 분석하는 LSTM 기반 모델 (deprecated)',
  },
];

// ─────────────────────────────────────────────────────────────
// Model Storage Page
// ─────────────────────────────────────────────────────────────

interface ModelStoragePageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const ModelStoragePage: React.FC<ModelStoragePageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t('modelStorage.tabs.all') },
    { id: 'active', label: t('modelStorage.tabs.active') },
    { id: 'draft', label: t('modelStorage.tabs.draft') },
    { id: 'archived', label: t('modelStorage.tabs.archived') },
  ];

  const filteredModels = mockModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = activeTab === 'all' || model.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const formatSize = (bytes: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
    return `${(bytes / 1e3).toFixed(0)} KB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <ContentArea title={t('modelStorage.title')}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('modelStorage.title')}</h1>
          <Button variant="primary">{t('modelStorage.uploadModel')}</Button>
        </div>

        <div style={styles.controls}>
          <div style={styles.searchWrapper}>
            <SearchInput
              placeholder={t('modelStorage.searchPlaceholder')}
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

        {filteredModels.length === 0 ? (
          <EmptyState
            title={t('modelStorage.empty.title')}
            description={t('modelStorage.empty.description')}
          />
        ) : (
          <CardGrid columns={2}>
            {filteredModels.map(model => (
              <div key={model.id} style={styles.modelCard}>
                <div style={styles.modelHeader}>
                  <div
                    style={{
                      ...styles.modelIcon,
                      background: `rgba(${frameworkColors[model.framework]}, 0.1)`.replace('#', ''),
                      backgroundColor: `${frameworkColors[model.framework]}15`,
                      color: frameworkColors[model.framework],
                    }}
                  >
                    <ModelIcon />
                  </div>
                  <div style={styles.modelInfo}>
                    <h3 style={styles.modelTitle}>{model.name}</h3>
                    <div style={styles.modelMeta}>
                      <span style={styles.versionBadge}>{model.version}</span>
                      <span>{model.framework}</span>
                    </div>
                  </div>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: statusStyles[model.status].bg,
                      color: statusStyles[model.status].color,
                    }}
                  >
                    {model.status}
                  </span>
                </div>

                <div style={styles.modelBody}>
                  <p style={styles.modelDesc}>{model.description}</p>

                  <div style={styles.tags}>
                    {model.tags.map(tag => (
                      <span key={tag} style={styles.tag}>{tag}</span>
                    ))}
                  </div>

                  <div style={styles.statsRow}>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{formatSize(model.size)}</div>
                      <div style={styles.statLabel}>{t('modelStorage.size')}</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>
                        {model.accuracy > 0 ? `${(model.accuracy * 100).toFixed(1)}%` : '-'}
                      </div>
                      <div style={styles.statLabel}>{t('modelStorage.accuracy')}</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{model.downloads}</div>
                      <div style={styles.statLabel}>{t('modelStorage.downloads')}</div>
                    </div>
                  </div>
                </div>

                <div style={styles.modelFooter}>
                  <span style={styles.modelDate}>
                    {t('modelStorage.updated')}: {formatDate(model.updatedAt)}
                  </span>
                  <div style={styles.modelActions}>
                    {model.status === 'active' && (
                      <>
                        <Button variant="outline" size="sm">
                          <DownloadIcon />
                        </Button>
                        <Button variant="primary" size="sm">
                          <DeployIcon />
                          {t('modelStorage.deploy')}
                        </Button>
                      </>
                    )}
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

export const mainModelStorageFeature: MainFeatureModule = {
  id: 'main-ModelStorage',
  name: 'Model Storage',
  sidebarSection: 'model',
  sidebarItems: [
    {
      id: 'model-storage',
      titleKey: 'sidebar.model.storage.title',
      descriptionKey: 'sidebar.model.storage.description',
    },
  ],
  routes: {
    'model-storage': ModelStoragePage,
  },
  requiresAuth: true,
};

export default mainModelStorageFeature;
