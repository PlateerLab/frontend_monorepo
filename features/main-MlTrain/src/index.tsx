'use client';

import React, { useState } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, SearchInput, FilterTabs, EmptyState, FormField } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ExperimentStatus = 'queued' | 'running' | 'completed' | 'failed';
type AlgorithmType = 'classification' | 'regression' | 'clustering' | 'anomaly' | 'timeseries';

interface MlExperiment {
  id: string;
  name: string;
  algorithm: string;
  algorithmType: AlgorithmType;
  status: ExperimentStatus;
  progress: number;
  dataset: string;
  parameters: Record<string, string | number>;
  metrics?: {
    accuracy?: number;
    mse?: number;
    mae?: number;
    r2Score?: number;
    silhouette?: number;
  };
  duration: number; // in seconds
  createdAt: string;
  completedAt?: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const PlayIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2L14 8L4 14V2Z" fill="currentColor"/>
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
  experimentsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
  expCard: { background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' },
  expHeader: { padding: '20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  expInfo: { flex: 1 },
  expTitle: { fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px' },
  expAlgorithm: { fontSize: '13px', color: '#6B7280' },
  statusBadge: { padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 500 },
  expBody: { padding: '20px' },
  progressSection: { marginBottom: '20px' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#6B7280' },
  progressBar: { height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #6366F1 0%, #A855F7 100%)', borderRadius: '3px', transition: 'width 0.3s ease' },
  paramsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' },
  paramItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#F9FAFB', borderRadius: '6px', fontSize: '12px' },
  paramLabel: { color: '#6B7280' },
  paramValue: { fontWeight: 500, color: '#1F2937' },
  metricsSection: { marginTop: '16px', padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px' },
  metricsTitle: { fontSize: '12px', fontWeight: 600, color: '#6366F1', marginBottom: '12px' },
  metricsRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const },
  metricItem: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '8px 16px', background: 'white', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' },
  metricValue: { fontSize: '18px', fontWeight: 700, color: '#6366F1' },
  metricLabel: { fontSize: '10px', color: '#9CA3AF', marginTop: '2px' },
  expFooter: { padding: '16px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  expDate: { fontSize: '11px', color: '#9CA3AF' },
  expActions: { display: 'flex', gap: '8px' },
  algorithmTag: { padding: '2px 8px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: '#A855F7' },
};

const statusStyles: Record<ExperimentStatus, { bg: string; color: string }> = {
  queued: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' },
  running: { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' },
  completed: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16A34A' },
  failed: { bg: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' },
};

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const mockExperiments: MlExperiment[] = [
  {
    id: 'exp-001',
    name: 'Customer Churn Prediction',
    algorithm: 'Random Forest',
    algorithmType: 'classification',
    status: 'completed',
    progress: 100,
    dataset: 'customer_churn_v2.csv',
    parameters: { n_estimators: 100, max_depth: 15, min_samples_split: 5 },
    metrics: { accuracy: 0.923, r2Score: 0.891 },
    duration: 1245,
    createdAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-15T10:20:45Z',
  },
  {
    id: 'exp-002',
    name: 'Sales Forecasting Q1',
    algorithm: 'XGBoost Regressor',
    algorithmType: 'regression',
    status: 'running',
    progress: 67,
    dataset: 'sales_history_2023.csv',
    parameters: { learning_rate: 0.1, n_estimators: 500, max_depth: 8 },
    duration: 2340,
    createdAt: '2024-01-15T14:00:00Z',
  },
  {
    id: 'exp-003',
    name: 'User Segmentation',
    algorithm: 'K-Means',
    algorithmType: 'clustering',
    status: 'completed',
    progress: 100,
    dataset: 'user_behavior.csv',
    parameters: { n_clusters: 5, max_iter: 300 },
    metrics: { silhouette: 0.72 },
    duration: 567,
    createdAt: '2024-01-14T16:00:00Z',
    completedAt: '2024-01-14T16:09:27Z',
  },
  {
    id: 'exp-004',
    name: 'Fraud Detection Model',
    algorithm: 'Isolation Forest',
    algorithmType: 'anomaly',
    status: 'queued',
    progress: 0,
    dataset: 'transactions_2024.csv',
    parameters: { contamination: 0.01, n_estimators: 150 },
    duration: 0,
    createdAt: '2024-01-15T16:30:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// ML Train Page
// ─────────────────────────────────────────────────────────────

interface MlTrainPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const MlTrainPage: React.FC<MlTrainPageProps> = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t('mlTrain.tabs.all') },
    { id: 'running', label: t('mlTrain.tabs.running') },
    { id: 'completed', label: t('mlTrain.tabs.completed') },
    { id: 'queued', label: t('mlTrain.tabs.queued') },
  ];

  const filteredExperiments = mockExperiments.filter(exp => {
    const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exp.algorithm.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || exp.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <ContentArea title={t('mlTrain.title')}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('mlTrain.title')}</h1>
          <Button variant="primary">
            <PlusIcon />
            {t('mlTrain.newExperiment')}
          </Button>
        </div>

        <div style={styles.controls}>
          <div style={styles.searchWrapper}>
            <SearchInput
              placeholder={t('mlTrain.searchPlaceholder')}
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

        {filteredExperiments.length === 0 ? (
          <EmptyState
            title={t('mlTrain.empty.title')}
            description={t('mlTrain.empty.description')}
          />
        ) : (
          <div style={styles.experimentsGrid}>
            {filteredExperiments.map(exp => (
              <div key={exp.id} style={styles.expCard}>
                <div style={styles.expHeader}>
                  <div style={styles.expInfo}>
                    <h3 style={styles.expTitle}>{exp.name}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={styles.expAlgorithm}>{exp.algorithm}</span>
                      <span style={styles.algorithmTag}>{exp.algorithmType}</span>
                    </div>
                  </div>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: statusStyles[exp.status].bg,
                      color: statusStyles[exp.status].color,
                    }}
                  >
                    {exp.status}
                  </span>
                </div>

                <div style={styles.expBody}>
                  {exp.status === 'running' && (
                    <div style={styles.progressSection}>
                      <div style={styles.progressLabel}>
                        <span>Training Progress</span>
                        <span>{exp.progress}%</span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${exp.progress}%` }} />
                      </div>
                    </div>
                  )}

                  <div style={styles.paramsGrid}>
                    {Object.entries(exp.parameters).slice(0, 4).map(([key, value]) => (
                      <div key={key} style={styles.paramItem}>
                        <span style={styles.paramLabel}>{key}</span>
                        <span style={styles.paramValue}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {exp.metrics && (
                    <div style={styles.metricsSection}>
                      <div style={styles.metricsTitle}>Results</div>
                      <div style={styles.metricsRow}>
                        {exp.metrics.accuracy && (
                          <div style={styles.metricItem}>
                            <span style={styles.metricValue}>{(exp.metrics.accuracy * 100).toFixed(1)}%</span>
                            <span style={styles.metricLabel}>Accuracy</span>
                          </div>
                        )}
                        {exp.metrics.r2Score && (
                          <div style={styles.metricItem}>
                            <span style={styles.metricValue}>{exp.metrics.r2Score.toFixed(3)}</span>
                            <span style={styles.metricLabel}>R² Score</span>
                          </div>
                        )}
                        {exp.metrics.silhouette && (
                          <div style={styles.metricItem}>
                            <span style={styles.metricValue}>{exp.metrics.silhouette.toFixed(2)}</span>
                            <span style={styles.metricLabel}>Silhouette</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.expFooter}>
                  <span style={styles.expDate}>
                    {formatDate(exp.createdAt)} • {formatDuration(exp.duration)}
                  </span>
                  <div style={styles.expActions}>
                    {exp.status === 'queued' && (
                      <Button variant="primary" size="sm">
                        <PlayIcon />
                        Start
                      </Button>
                    )}
                    {exp.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        View Results
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

export const mainMlTrainFeature: MainFeatureModule = {
  id: 'main-MlTrain',
  name: 'ML Training',
  sidebarSection: 'ml',
  sidebarItems: [
    {
      id: 'ml-train',
      titleKey: 'sidebar.ml.train.title',
      descriptionKey: 'sidebar.ml.train.description',
    },
  ],
  routes: {
    'ml-train': MlTrainPage,
  },
  requiresAuth: true,
};

export default mainMlTrainFeature;
