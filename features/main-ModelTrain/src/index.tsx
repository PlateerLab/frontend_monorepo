'use client';

import React, { useState } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, SearchInput, FilterTabs, EmptyState, CardGrid } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import type { TrainingJob, TrainingStatus, ModelType } from './types';

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const PlayIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2L14 8L4 14V2Z" fill="currentColor"/>
  </svg>
);

const StopIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="10" height="10" rx="1" fill="currentColor"/>
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
  jobCard: { background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' },
  jobHeader: { padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  jobTitle: { fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: 0 },
  jobMeta: { display: 'flex', gap: '12px', alignItems: 'center' },
  statusBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 },
  jobBody: { padding: '20px 24px' },
  progressSection: { marginBottom: '20px' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  progressText: { fontSize: '14px', color: '#6B7280' },
  progressBar: { height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #305EEB 0%, #6366F1 100%)', borderRadius: '4px', transition: 'width 0.3s ease' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' },
  metricItem: { textAlign: 'center' as const },
  metricValue: { fontSize: '20px', fontWeight: 700, color: '#305EEB' },
  metricLabel: { fontSize: '12px', color: '#6B7280' },
  configGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  configItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F9FAFB', borderRadius: '8px' },
  configLabel: { fontSize: '12px', color: '#6B7280' },
  configValue: { fontSize: '12px', fontWeight: 500, color: '#1F2937' },
  jobFooter: { padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  jobDate: { fontSize: '12px', color: '#9CA3AF' },
  jobActions: { display: 'flex', gap: '8px' },
  modelTag: { padding: '2px 8px', background: 'rgba(48, 94, 235, 0.1)', borderRadius: '4px', fontSize: '12px', color: '#305EEB' },
};

const statusStyles: Record<TrainingStatus, { bg: string; color: string }> = {
  pending: { bg: 'rgba(251, 191, 36, 0.1)', color: '#D97706' },
  running: { bg: 'rgba(48, 94, 235, 0.1)', color: '#305EEB' },
  completed: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16A34A' },
  failed: { bg: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' },
  cancelled: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' },
};

// ─────────────────────────────────────────────────────────────
// Model Train Page
// ─────────────────────────────────────────────────────────────

interface ModelTrainPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

// Mock data
const mockJobs: TrainingJob[] = [
  {
    id: 'job-001',
    name: 'Customer Intent Classifier v2',
    baseModel: 'bert-base-uncased',
    modelType: 'nlp',
    status: 'running',
    progress: 67,
    epochs: 10,
    currentEpoch: 7,
    learningRate: 0.0001,
    batchSize: 32,
    dataset: 'customer-intents-v2',
    createdAt: '2024-01-15T10:00:00Z',
    startedAt: '2024-01-15T10:05:00Z',
    metrics: { loss: 0.234, accuracy: 0.923, precision: 0.918, recall: 0.927, f1Score: 0.922 },
  },
  {
    id: 'job-002',
    name: 'Document Classifier',
    baseModel: 'roberta-large',
    modelType: 'nlp',
    status: 'completed',
    progress: 100,
    epochs: 15,
    currentEpoch: 15,
    learningRate: 0.00005,
    batchSize: 16,
    dataset: 'documents-labeled',
    createdAt: '2024-01-14T08:00:00Z',
    startedAt: '2024-01-14T08:10:00Z',
    completedAt: '2024-01-14T14:30:00Z',
    metrics: { loss: 0.156, accuracy: 0.956, precision: 0.952, recall: 0.959, f1Score: 0.955 },
  },
  {
    id: 'job-003',
    name: 'Image Recognition Model',
    baseModel: 'resnet-50',
    modelType: 'vision',
    status: 'pending',
    progress: 0,
    epochs: 20,
    currentEpoch: 0,
    learningRate: 0.001,
    batchSize: 64,
    dataset: 'product-images',
    createdAt: '2024-01-15T14:00:00Z',
  },
  {
    id: 'job-004',
    name: 'Sentiment Analysis v1',
    baseModel: 'distilbert-base',
    modelType: 'nlp',
    status: 'failed',
    progress: 45,
    epochs: 10,
    currentEpoch: 5,
    learningRate: 0.0002,
    batchSize: 32,
    dataset: 'sentiment-reviews',
    createdAt: '2024-01-13T09:00:00Z',
    startedAt: '2024-01-13T09:05:00Z',
    metrics: { loss: 0.89, accuracy: 0.65 },
  },
];

const ModelTrainPage: React.FC<ModelTrainPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t('modelTrain.tabs.all') },
    { id: 'running', label: t('modelTrain.tabs.running') },
    { id: 'completed', label: t('modelTrain.tabs.completed') },
    { id: 'failed', label: t('modelTrain.tabs.failed') },
  ];

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.baseModel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || job.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusText = (status: TrainingStatus) => {
    const statusMap: Record<TrainingStatus, string> = {
      pending: t('modelTrain.status.pending'),
      running: t('modelTrain.status.running'),
      completed: t('modelTrain.status.completed'),
      failed: t('modelTrain.status.failed'),
      cancelled: t('modelTrain.status.cancelled'),
    };
    return statusMap[status];
  };

  return (
    <ContentArea title={t('modelTrain.title')}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('modelTrain.title')}</h1>
          <Button variant="primary">
            <PlusIcon />
            {t('modelTrain.newTraining')}
          </Button>
        </div>

        <div style={styles.controls}>
          <div style={styles.searchWrapper}>
            <SearchInput
              placeholder={t('modelTrain.searchPlaceholder')}
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

        {filteredJobs.length === 0 ? (
          <EmptyState
            title={t('modelTrain.empty.title')}
            description={t('modelTrain.empty.description')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredJobs.map(job => (
              <div key={job.id} style={styles.jobCard}>
                <div style={styles.jobHeader}>
                  <div>
                    <h3 style={styles.jobTitle}>{job.name}</h3>
                  </div>
                  <div style={styles.jobMeta}>
                    <span style={styles.modelTag}>{job.baseModel}</span>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: statusStyles[job.status].bg,
                        color: statusStyles[job.status].color,
                      }}
                    >
                      {getStatusText(job.status)}
                    </span>
                  </div>
                </div>

                <div style={styles.jobBody}>
                  <div style={styles.progressSection}>
                    <div style={styles.progressLabel}>
                      <span style={styles.progressText}>
                        Epoch {job.currentEpoch}/{job.epochs}
                      </span>
                      <span style={styles.progressText}>{job.progress}%</span>
                    </div>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${job.progress}%` }} />
                    </div>
                  </div>

                  {job.metrics && (
                    <div style={styles.metricsGrid}>
                      <div style={styles.metricItem}>
                        <div style={styles.metricValue}>{job.metrics.loss.toFixed(3)}</div>
                        <div style={styles.metricLabel}>Loss</div>
                      </div>
                      <div style={styles.metricItem}>
                        <div style={styles.metricValue}>{(job.metrics.accuracy * 100).toFixed(1)}%</div>
                        <div style={styles.metricLabel}>Accuracy</div>
                      </div>
                      {job.metrics.precision && (
                        <div style={styles.metricItem}>
                          <div style={styles.metricValue}>{(job.metrics.precision * 100).toFixed(1)}%</div>
                          <div style={styles.metricLabel}>Precision</div>
                        </div>
                      )}
                      {job.metrics.f1Score && (
                        <div style={styles.metricItem}>
                          <div style={styles.metricValue}>{(job.metrics.f1Score * 100).toFixed(1)}%</div>
                          <div style={styles.metricLabel}>F1 Score</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={styles.configGrid}>
                    <div style={styles.configItem}>
                      <span style={styles.configLabel}>Learning Rate</span>
                      <span style={styles.configValue}>{job.learningRate}</span>
                    </div>
                    <div style={styles.configItem}>
                      <span style={styles.configLabel}>Batch Size</span>
                      <span style={styles.configValue}>{job.batchSize}</span>
                    </div>
                    <div style={styles.configItem}>
                      <span style={styles.configLabel}>Dataset</span>
                      <span style={styles.configValue}>{job.dataset}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.jobFooter}>
                  <span style={styles.jobDate}>
                    {t('modelTrain.createdAt')}: {formatDate(job.createdAt)}
                  </span>
                  <div style={styles.jobActions}>
                    {job.status === 'running' && (
                      <Button variant="outline" size="sm">
                        <StopIcon />
                        {t('modelTrain.stop')}
                      </Button>
                    )}
                    {job.status === 'pending' && (
                      <Button variant="primary" size="sm">
                        <PlayIcon />
                        {t('modelTrain.start')}
                      </Button>
                    )}
                    {job.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        {t('modelTrain.viewResults')}
                      </Button>
                    )}
                    {job.status === 'failed' && (
                      <Button variant="outline" size="sm">
                        {t('modelTrain.retry')}
                      </Button>
                    )}
                  </div>
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

export const mainModelTrainFeature: MainFeatureModule = {
  id: 'main-ModelTrain',
  name: 'Model Training',
  sidebarSection: 'model',
  sidebarItems: [
    {
      id: 'model-train',
      titleKey: 'sidebar.model.train.title',
      descriptionKey: 'sidebar.model.train.description',
    },
  ],
  routes: {
    'model-train': ModelTrainPage,
  },
  requiresAuth: true,
};

export default mainModelTrainFeature;
