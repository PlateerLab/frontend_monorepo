'use client';

import React, { useState } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, SearchInput, FilterTabs, EmptyState, Card } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface EvaluationResult {
  id: string;
  modelName: string;
  modelVersion: string;
  dataset: string;
  status: 'running' | 'completed' | 'failed';
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc?: number;
  };
  confusionMatrix?: number[][];
  evaluatedAt: string;
  duration: number; // in seconds
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: { padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 700, color: '#1F2937' },
  controls: { display: 'flex', gap: '16px', marginBottom: '24px' },
  searchWrapper: { flex: 1, maxWidth: '400px' },
  evalCard: { background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', marginBottom: '20px' },
  evalHeader: { padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  evalInfo: { flex: 1 },
  evalTitle: { fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px' },
  evalMeta: { fontSize: '13px', color: '#6B7280' },
  statusBadge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 },
  evalBody: { padding: '24px' },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '24px' },
  metricCard: { padding: '20px', background: '#F9FAFB', borderRadius: '12px', textAlign: 'center' as const },
  metricValue: { fontSize: '28px', fontWeight: 700, color: '#305EEB', marginBottom: '4px' },
  metricLabel: { fontSize: '13px', color: '#6B7280', fontWeight: 500 },
  confusionSection: { marginTop: '24px' },
  sectionLabel: { fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '16px' },
  confusionMatrix: { display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: '4px' },
  confusionCell: { width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '14px', fontWeight: 600 },
  evalFooter: { padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  evalDate: { fontSize: '12px', color: '#9CA3AF' },
  evalActions: { display: 'flex', gap: '8px' },
  chartPlaceholder: { height: '200px', background: '#F9FAFB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '14px' },
};

const statusStyles: Record<string, { bg: string; color: string }> = {
  running: { bg: 'rgba(48, 94, 235, 0.1)', color: '#305EEB' },
  completed: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16A34A' },
  failed: { bg: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' },
};

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const mockEvaluations: EvaluationResult[] = [
  {
    id: 'eval-001',
    modelName: 'Customer Intent Classifier',
    modelVersion: 'v2.1.0',
    dataset: 'test-intents-2024',
    status: 'completed',
    metrics: { accuracy: 0.943, precision: 0.938, recall: 0.947, f1Score: 0.942, auc: 0.987 },
    confusionMatrix: [[450, 12, 8], [15, 520, 5], [10, 8, 472]],
    evaluatedAt: '2024-01-15T14:30:00Z',
    duration: 1823,
  },
  {
    id: 'eval-002',
    modelName: 'Document Classifier',
    modelVersion: 'v1.5.2',
    dataset: 'docs-validation-set',
    status: 'completed',
    metrics: { accuracy: 0.912, precision: 0.905, recall: 0.918, f1Score: 0.911, auc: 0.965 },
    evaluatedAt: '2024-01-14T10:15:00Z',
    duration: 956,
  },
  {
    id: 'eval-003',
    modelName: 'Sentiment Analysis',
    modelVersion: 'v3.0.0',
    dataset: 'reviews-test-2024',
    status: 'running',
    metrics: { accuracy: 0.0, precision: 0.0, recall: 0.0, f1Score: 0.0 },
    evaluatedAt: '2024-01-15T16:00:00Z',
    duration: 0,
  },
];

// ─────────────────────────────────────────────────────────────
// Model Eval Page
// ─────────────────────────────────────────────────────────────

interface ModelEvalPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const ModelEvalPage: React.FC<ModelEvalPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t('modelEval.tabs.all') },
    { id: 'completed', label: t('modelEval.tabs.completed') },
    { id: 'running', label: t('modelEval.tabs.running') },
  ];

  const filteredEvals = mockEvaluations.filter(ev => {
    const matchesSearch = ev.modelName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || ev.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getConfusionCellColor = (value: number, max: number) => {
    const intensity = value / max;
    if (intensity > 0.8) return { bg: 'rgba(34, 197, 94, 0.3)', color: '#16A34A' };
    if (intensity > 0.1) return { bg: 'rgba(251, 191, 36, 0.3)', color: '#D97706' };
    return { bg: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' };
  };

  return (
    <ContentArea title={t('modelEval.title')}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('modelEval.title')}</h1>
          <Button variant="primary">{t('modelEval.newEvaluation')}</Button>
        </div>

        <div style={styles.controls}>
          <div style={styles.searchWrapper}>
            <SearchInput
              placeholder={t('modelEval.searchPlaceholder')}
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

        {filteredEvals.length === 0 ? (
          <EmptyState
            title={t('modelEval.empty.title')}
            description={t('modelEval.empty.description')}
          />
        ) : (
          <div>
            {filteredEvals.map(evaluation => (
              <div key={evaluation.id} style={styles.evalCard}>
                <div style={styles.evalHeader}>
                  <div style={styles.evalInfo}>
                    <h3 style={styles.evalTitle}>{evaluation.modelName}</h3>
                    <span style={styles.evalMeta}>
                      {evaluation.modelVersion} • {evaluation.dataset}
                    </span>
                  </div>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: statusStyles[evaluation.status].bg,
                      color: statusStyles[evaluation.status].color,
                    }}
                  >
                    {evaluation.status === 'running' ? t('modelEval.status.running') :
                     evaluation.status === 'completed' ? t('modelEval.status.completed') :
                     t('modelEval.status.failed')}
                  </span>
                </div>

                <div style={styles.evalBody}>
                  {evaluation.status === 'completed' ? (
                    <>
                      <div style={styles.metricsRow}>
                        <div style={styles.metricCard}>
                          <div style={styles.metricValue}>{(evaluation.metrics.accuracy * 100).toFixed(1)}%</div>
                          <div style={styles.metricLabel}>Accuracy</div>
                        </div>
                        <div style={styles.metricCard}>
                          <div style={styles.metricValue}>{(evaluation.metrics.precision * 100).toFixed(1)}%</div>
                          <div style={styles.metricLabel}>Precision</div>
                        </div>
                        <div style={styles.metricCard}>
                          <div style={styles.metricValue}>{(evaluation.metrics.recall * 100).toFixed(1)}%</div>
                          <div style={styles.metricLabel}>Recall</div>
                        </div>
                        <div style={styles.metricCard}>
                          <div style={styles.metricValue}>{(evaluation.metrics.f1Score * 100).toFixed(1)}%</div>
                          <div style={styles.metricLabel}>F1 Score</div>
                        </div>
                        {evaluation.metrics.auc && (
                          <div style={styles.metricCard}>
                            <div style={styles.metricValue}>{(evaluation.metrics.auc * 100).toFixed(1)}%</div>
                            <div style={styles.metricLabel}>AUC-ROC</div>
                          </div>
                        )}
                      </div>

                      {evaluation.confusionMatrix && (
                        <div style={styles.confusionSection}>
                          <div style={styles.sectionLabel}>{t('modelEval.confusionMatrix')}</div>
                          <div style={styles.confusionMatrix}>
                            {evaluation.confusionMatrix.flat().map((value, idx) => {
                              const maxVal = Math.max(...evaluation.confusionMatrix!.flat());
                              const cellStyle = getConfusionCellColor(value, maxVal);
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    ...styles.confusionCell,
                                    background: cellStyle.bg,
                                    color: cellStyle.color,
                                  }}
                                >
                                  {value}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={styles.chartPlaceholder}>
                      {t('modelEval.evaluationInProgress')}
                    </div>
                  )}
                </div>

                <div style={styles.evalFooter}>
                  <span style={styles.evalDate}>
                    {formatDate(evaluation.evaluatedAt)}
                    {evaluation.duration > 0 && ` • ${formatDuration(evaluation.duration)}`}
                  </span>
                  <div style={styles.evalActions}>
                    {evaluation.status === 'completed' && (
                      <>
                        <Button variant="outline" size="sm">{t('modelEval.exportReport')}</Button>
                        <Button variant="outline" size="sm">{t('modelEval.compareModels')}</Button>
                      </>
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

export const mainModelEvalFeature: MainFeatureModule = {
  id: 'main-ModelEval',
  name: 'Model Evaluation',
  sidebarSection: 'model',
  sidebarItems: [
    {
      id: 'model-eval',
      titleKey: 'sidebar.model.eval.title',
      descriptionKey: 'sidebar.model.eval.description',
    },
  ],
  routes: {
    'model-eval': ModelEvalPage,
  },
  requiresAuth: true,
};

export default mainModelEvalFeature;
