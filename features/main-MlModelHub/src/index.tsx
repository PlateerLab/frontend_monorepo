'use client';

import React, { useState } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, SearchInput, FilterTabs, EmptyState, CardGrid } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ModelCategory = 'classification' | 'regression' | 'clustering' | 'nlp' | 'vision' | 'timeseries';
type ModelFramework = 'sklearn' | 'xgboost' | 'lightgbm' | 'pytorch' | 'tensorflow';

interface HubModel {
  id: string;
  name: string;
  description: string;
  category: ModelCategory;
  framework: ModelFramework;
  version: string;
  author: string;
  downloads: number;
  stars: number;
  lastUpdated: string;
  tags: string[];
  metrics: {
    primary: { name: string; value: number };
    secondary?: { name: string; value: number };
  };
  previewCode?: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const StarIcon: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill={filled ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
    <path d="M7 1L8.854 4.854L13 5.382L10 8.382L10.708 12.5L7 10.5L3.292 12.5L4 8.382L1 5.382L5.146 4.854L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 1.5V9.5M7 9.5L4 6.5M7 9.5L10 6.5M1.5 11H12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: { padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 700, color: '#1F2937' },
  controls: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' as const },
  searchWrapper: { flex: 1, minWidth: '300px', maxWidth: '400px' },
  modelCard: { background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const },
  cardHeader: { padding: '20px', borderBottom: '1px solid #F3F4F6' },
  cardTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  cardTitle: { fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: 0 },
  categoryBadge: { padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 },
  cardDescription: { fontSize: '13px', color: '#6B7280', lineHeight: 1.5, marginBottom: '12px' },
  cardMeta: { display: 'flex', gap: '16px', fontSize: '12px', color: '#9CA3AF' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  cardBody: { padding: '16px 20px', flex: 1 },
  tags: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '12px' },
  tag: { padding: '3px 8px', background: '#F3F4F6', borderRadius: '4px', fontSize: '11px', color: '#6B7280' },
  metricsBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', marginRight: '8px' },
  metricLabel: { fontSize: '11px', color: '#6366F1' },
  metricValue: { fontSize: '13px', fontWeight: 700, color: '#6366F1' },
  cardFooter: { padding: '16px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  frameworkBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500 },
  cardActions: { display: 'flex', gap: '8px' },
};

const categoryStyles: Record<ModelCategory, { bg: string; color: string }> = {
  classification: { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' },
  regression: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16A34A' },
  clustering: { bg: 'rgba(168, 85, 247, 0.1)', color: '#A855F7' },
  nlp: { bg: 'rgba(14, 165, 233, 0.1)', color: '#0EA5E9' },
  vision: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' },
  timeseries: { bg: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' },
};

const frameworkStyles: Record<ModelFramework, { bg: string; color: string }> = {
  sklearn: { bg: 'rgba(241, 102, 67, 0.1)', color: '#F16643' },
  xgboost: { bg: 'rgba(0, 148, 204, 0.1)', color: '#0094CC' },
  lightgbm: { bg: 'rgba(108, 117, 125, 0.1)', color: '#6C757D' },
  pytorch: { bg: 'rgba(238, 76, 44, 0.1)', color: '#EE4C2C' },
  tensorflow: { bg: 'rgba(255, 111, 0, 0.1)', color: '#FF6F00' },
};

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const mockHubModels: HubModel[] = [
  {
    id: 'hub-001',
    name: 'XGBoost Classifier',
    description: '고성능 그래디언트 부스팅 분류기. 대용량 데이터셋에 최적화되어 있으며, 다양한 하이퍼파라미터 튜닝 옵션을 제공합니다.',
    category: 'classification',
    framework: 'xgboost',
    version: 'v1.7.6',
    author: 'xgen-team',
    downloads: 15234,
    stars: 423,
    lastUpdated: '2024-01-10',
    tags: ['gradient-boosting', 'ensemble', 'tabular'],
    metrics: { primary: { name: 'Accuracy', value: 0.956 } },
  },
  {
    id: 'hub-002',
    name: 'LightGBM Regressor',
    description: '빠른 훈련 속도와 낮은 메모리 사용량이 특징인 회귀 모델. 대규모 데이터셋 처리에 적합합니다.',
    category: 'regression',
    framework: 'lightgbm',
    version: 'v4.1.0',
    author: 'ml-contributors',
    downloads: 8921,
    stars: 287,
    lastUpdated: '2024-01-08',
    tags: ['fast-training', 'low-memory', 'tabular'],
    metrics: { primary: { name: 'R² Score', value: 0.923 }, secondary: { name: 'MAE', value: 0.045 } },
  },
  {
    id: 'hub-003',
    name: 'K-Means Clustering',
    description: '클러스터링을 위한 최적화된 K-Means 구현. 미니배치 학습과 자동 K 선택을 지원합니다.',
    category: 'clustering',
    framework: 'sklearn',
    version: 'v1.2.0',
    author: 'xgen-team',
    downloads: 5432,
    stars: 156,
    lastUpdated: '2024-01-05',
    tags: ['unsupervised', 'clustering', 'mini-batch'],
    metrics: { primary: { name: 'Silhouette', value: 0.78 } },
  },
  {
    id: 'hub-004',
    name: 'BERT NER Tagger',
    description: 'BERT 기반 개체명 인식 모델. 한국어와 영어를 모두 지원하며, 커스텀 엔티티 학습이 가능합니다.',
    category: 'nlp',
    framework: 'pytorch',
    version: 'v2.0.0',
    author: 'nlp-team',
    downloads: 12567,
    stars: 534,
    lastUpdated: '2024-01-12',
    tags: ['ner', 'bert', 'multilingual', 'korean'],
    metrics: { primary: { name: 'F1 Score', value: 0.912 } },
  },
  {
    id: 'hub-005',
    name: 'ResNet Image Classifier',
    description: 'ImageNet 사전훈련된 ResNet-50 모델. 전이학습을 통해 다양한 이미지 분류 태스크에 활용 가능합니다.',
    category: 'vision',
    framework: 'pytorch',
    version: 'v1.0.0',
    author: 'vision-team',
    downloads: 7845,
    stars: 312,
    lastUpdated: '2024-01-03',
    tags: ['resnet', 'pretrained', 'transfer-learning'],
    metrics: { primary: { name: 'Top-5 Acc', value: 0.961 } },
  },
  {
    id: 'hub-006',
    name: 'ARIMA Forecaster',
    description: '시계열 예측을 위한 자동화된 ARIMA 모델. Auto ARIMA 기능으로 최적 파라미터를 자동 탐색합니다.',
    category: 'timeseries',
    framework: 'sklearn',
    version: 'v2.1.0',
    author: 'ts-team',
    downloads: 3421,
    stars: 98,
    lastUpdated: '2024-01-07',
    tags: ['time-series', 'forecasting', 'auto-arima'],
    metrics: { primary: { name: 'MAPE', value: 0.045 } },
  },
];

// ─────────────────────────────────────────────────────────────
// ML Model Hub Page
// ─────────────────────────────────────────────────────────────

interface MlModelHubPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const MlModelHubPage: React.FC<MlModelHubPageProps> = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t('mlHub.tabs.all') },
    { id: 'classification', label: t('mlHub.tabs.classification') },
    { id: 'regression', label: t('mlHub.tabs.regression') },
    { id: 'nlp', label: t('mlHub.tabs.nlp') },
    { id: 'vision', label: t('mlHub.tabs.vision') },
  ];

  const filteredModels = mockHubModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = activeTab === 'all' || model.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <ContentArea title={t('mlHub.title')}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('mlHub.title')}</h1>
          <Button variant="primary">{t('mlHub.publishModel')}</Button>
        </div>

        <div style={styles.controls}>
          <div style={styles.searchWrapper}>
            <SearchInput
              placeholder={t('mlHub.searchPlaceholder')}
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
            title={t('mlHub.empty.title')}
            description={t('mlHub.empty.description')}
          />
        ) : (
          <CardGrid columns={2}>
            {filteredModels.map(model => (
              <div key={model.id} style={styles.modelCard}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleRow}>
                    <h3 style={styles.cardTitle}>{model.name}</h3>
                    <span
                      style={{
                        ...styles.categoryBadge,
                        background: categoryStyles[model.category].bg,
                        color: categoryStyles[model.category].color,
                      }}
                    >
                      {model.category}
                    </span>
                  </div>
                  <p style={styles.cardDescription}>{model.description}</p>
                  <div style={styles.cardMeta}>
                    <span style={styles.metaItem}>
                      <DownloadIcon />
                      {formatNumber(model.downloads)}
                    </span>
                    <span style={styles.metaItem}>
                      <StarIcon filled />
                      {formatNumber(model.stars)}
                    </span>
                    <span>by {model.author}</span>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.tags}>
                    {model.tags.map(tag => (
                      <span key={tag} style={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  <div>
                    <span style={styles.metricsBadge}>
                      <span style={styles.metricLabel}>{model.metrics.primary.name}</span>
                      <span style={styles.metricValue}>
                        {model.metrics.primary.value < 1
                          ? (model.metrics.primary.value * 100).toFixed(1) + '%'
                          : model.metrics.primary.value.toFixed(3)
                        }
                      </span>
                    </span>
                    {model.metrics.secondary && (
                      <span style={styles.metricsBadge}>
                        <span style={styles.metricLabel}>{model.metrics.secondary.name}</span>
                        <span style={styles.metricValue}>{model.metrics.secondary.value.toFixed(3)}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <span
                    style={{
                      ...styles.frameworkBadge,
                      background: frameworkStyles[model.framework].bg,
                      color: frameworkStyles[model.framework].color,
                    }}
                  >
                    {model.framework} {model.version}
                  </span>
                  <div style={styles.cardActions}>
                    <Button variant="outline" size="sm">{t('mlHub.viewDetails')}</Button>
                    <Button variant="primary" size="sm">
                      <DownloadIcon />
                      {t('mlHub.use')}
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

export const mainMlModelHubFeature: MainFeatureModule = {
  id: 'main-MlModelHub',
  name: 'ML Model Hub',
  sidebarSection: 'ml',
  sidebarItems: [
    {
      id: 'ml-model-hub',
      titleKey: 'sidebar.ml.hub.title',
      descriptionKey: 'sidebar.ml.hub.description',
    },
  ],
  routes: {
    'ml-model-hub': MlModelHubPage,
  },
  requiresAuth: true,
};

export default mainMlModelHubFeature;
