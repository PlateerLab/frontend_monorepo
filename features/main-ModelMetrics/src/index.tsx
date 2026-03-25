'use client';

import React, { useState } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, FilterTabs, CardGrid } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ModelMetric {
  id: string;
  modelName: string;
  version: string;
  endpoint: string;
  requestsToday: number;
  avgLatency: number; // ms
  p99Latency: number; // ms
  errorRate: number;
  throughput: number; // req/sec
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  status: 'healthy' | 'degraded' | 'down';
  lastUpdated: string;
}

interface TimeSeriesData {
  timestamp: string;
  value: number;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: { padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 700, color: '#1F2937' },
  controls: { display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' },
  summaryCards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' },
  summaryCard: { padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB' },
  summaryValue: { fontSize: '32px', fontWeight: 700, marginBottom: '4px' },
  summaryLabel: { fontSize: '14px', color: '#6B7280' },
  summaryTrend: { fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' },
  modelCard: { background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' },
  modelHeader: { padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modelTitle: { fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: 0 },
  modelEndpoint: { fontSize: '12px', color: '#9CA3AF', marginTop: '4px', fontFamily: 'monospace' },
  statusIndicator: { display: 'flex', alignItems: 'center', gap: '8px' },
  statusDot: { width: '10px', height: '10px', borderRadius: '50%' },
  statusText: { fontSize: '12px', fontWeight: 500 },
  modelBody: { padding: '24px' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  metricItem: { padding: '16px', background: '#F9FAFB', borderRadius: '12px' },
  metricLabel: { fontSize: '12px', color: '#6B7280', marginBottom: '4px' },
  metricValue: { fontSize: '24px', fontWeight: 700, color: '#1F2937' },
  metricUnit: { fontSize: '12px', color: '#9CA3AF', marginLeft: '4px' },
  resourceSection: { marginTop: '20px' },
  resourceTitle: { fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' },
  resourceBars: { display: 'flex', gap: '20px' },
  resourceItem: { flex: 1 },
  resourceLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  resourceBarBg: { height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' },
  resourceBarFill: { height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' },
  chartPlaceholder: { height: '120px', background: '#F9FAFB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '13px' },
  modelFooter: { padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  lastUpdated: { fontSize: '12px', color: '#9CA3AF' },
};

const statusColors: Record<string, { dot: string; text: string }> = {
  healthy: { dot: '#22C55E', text: '#16A34A' },
  degraded: { dot: '#F59E0B', text: '#D97706' },
  down: { dot: '#EF4444', text: '#DC2626' },
};

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const mockMetrics: ModelMetric[] = [
  {
    id: 'metric-001',
    modelName: 'Customer Intent Classifier',
    version: 'v2.1.0',
    endpoint: '/api/v1/models/intent-classifier/predict',
    requestsToday: 15234,
    avgLatency: 45,
    p99Latency: 128,
    errorRate: 0.02,
    throughput: 127.5,
    cpuUsage: 45,
    memoryUsage: 62,
    status: 'healthy',
    lastUpdated: '2024-01-15T16:30:00Z',
  },
  {
    id: 'metric-002',
    modelName: 'Document Parser',
    version: 'v1.8.5',
    endpoint: '/api/v1/models/doc-parser/extract',
    requestsToday: 8567,
    avgLatency: 234,
    p99Latency: 456,
    errorRate: 0.15,
    throughput: 42.3,
    cpuUsage: 78,
    memoryUsage: 85,
    status: 'degraded',
    lastUpdated: '2024-01-15T16:30:00Z',
  },
  {
    id: 'metric-003',
    modelName: 'Sentiment Analyzer',
    version: 'v2.0.0',
    endpoint: '/api/v1/models/sentiment/analyze',
    requestsToday: 3421,
    avgLatency: 67,
    p99Latency: 189,
    errorRate: 0.01,
    throughput: 89.7,
    cpuUsage: 35,
    memoryUsage: 48,
    status: 'healthy',
    lastUpdated: '2024-01-15T16:30:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// Model Metrics Page
// ─────────────────────────────────────────────────────────────

interface ModelMetricsPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const ModelMetricsPage: React.FC<ModelMetricsPageProps> = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('24h');

  const timeRangeTabs = [
    { id: '1h', label: '1H' },
    { id: '6h', label: '6H' },
    { id: '24h', label: '24H' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
  ];

  // Calculate summary stats
  const totalRequests = mockMetrics.reduce((sum, m) => sum + m.requestsToday, 0);
  const avgLatency = mockMetrics.reduce((sum, m) => sum + m.avgLatency, 0) / mockMetrics.length;
  const avgErrorRate = mockMetrics.reduce((sum, m) => sum + m.errorRate, 0) / mockMetrics.length;
  const healthyCount = mockMetrics.filter(m => m.status === 'healthy').length;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const getResourceBarColor = (usage: number) => {
    if (usage >= 80) return '#EF4444';
    if (usage >= 60) return '#F59E0B';
    return '#22C55E';
  };

  return (
    <ContentArea title={t('modelMetrics.title')}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('modelMetrics.title')}</h1>
          <FilterTabs
            tabs={timeRangeTabs}
            activeTab={timeRange}
            onTabChange={setTimeRange}
          />
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryCards}>
          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryValue, color: '#305EEB' }}>{formatNumber(totalRequests)}</div>
            <div style={styles.summaryLabel}>{t('modelMetrics.totalRequests')}</div>
            <div style={{ ...styles.summaryTrend, color: '#16A34A' }}>↑ 12.5% vs yesterday</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryValue, color: '#1F2937' }}>{avgLatency.toFixed(0)}ms</div>
            <div style={styles.summaryLabel}>{t('modelMetrics.avgLatency')}</div>
            <div style={{ ...styles.summaryTrend, color: '#16A34A' }}>↓ 8.2% vs yesterday</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryValue, color: avgErrorRate > 0.05 ? '#EF4444' : '#1F2937' }}>
              {(avgErrorRate * 100).toFixed(2)}%
            </div>
            <div style={styles.summaryLabel}>{t('modelMetrics.errorRate')}</div>
            <div style={{ ...styles.summaryTrend, color: '#16A34A' }}>↓ 0.5% vs yesterday</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryValue, color: '#22C55E' }}>{healthyCount}/{mockMetrics.length}</div>
            <div style={styles.summaryLabel}>{t('modelMetrics.healthyModels')}</div>
          </div>
        </div>

        {/* Model Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mockMetrics.map(metric => (
            <div key={metric.id} style={styles.modelCard}>
              <div style={styles.modelHeader}>
                <div>
                  <h3 style={styles.modelTitle}>{metric.modelName} <span style={{ fontWeight: 400, color: '#9CA3AF' }}>{metric.version}</span></h3>
                  <div style={styles.modelEndpoint}>{metric.endpoint}</div>
                </div>
                <div style={styles.statusIndicator}>
                  <div style={{ ...styles.statusDot, background: statusColors[metric.status].dot }} />
                  <span style={{ ...styles.statusText, color: statusColors[metric.status].text }}>
                    {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                  </span>
                </div>
              </div>

              <div style={styles.modelBody}>
                <div style={styles.metricsGrid}>
                  <div style={styles.metricItem}>
                    <div style={styles.metricLabel}>{t('modelMetrics.requests')}</div>
                    <div style={styles.metricValue}>
                      {formatNumber(metric.requestsToday)}
                      <span style={styles.metricUnit}>today</span>
                    </div>
                  </div>
                  <div style={styles.metricItem}>
                    <div style={styles.metricLabel}>{t('modelMetrics.latency')} (avg / p99)</div>
                    <div style={styles.metricValue}>
                      {metric.avgLatency}
                      <span style={styles.metricUnit}>ms</span>
                      <span style={{ fontSize: '14px', color: '#6B7280', marginLeft: '8px' }}>
                        / {metric.p99Latency}ms
                      </span>
                    </div>
                  </div>
                  <div style={styles.metricItem}>
                    <div style={styles.metricLabel}>{t('modelMetrics.throughput')}</div>
                    <div style={styles.metricValue}>
                      {metric.throughput.toFixed(1)}
                      <span style={styles.metricUnit}>req/s</span>
                    </div>
                  </div>
                </div>

                {/* Resource Usage */}
                <div style={styles.resourceSection}>
                  <div style={styles.resourceTitle}>{t('modelMetrics.resourceUsage')}</div>
                  <div style={styles.resourceBars}>
                    <div style={styles.resourceItem}>
                      <div style={styles.resourceLabel}>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>CPU</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>{metric.cpuUsage}%</span>
                      </div>
                      <div style={styles.resourceBarBg}>
                        <div
                          style={{
                            ...styles.resourceBarFill,
                            width: `${metric.cpuUsage}%`,
                            background: getResourceBarColor(metric.cpuUsage),
                          }}
                        />
                      </div>
                    </div>
                    <div style={styles.resourceItem}>
                      <div style={styles.resourceLabel}>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>Memory</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>{metric.memoryUsage}%</span>
                      </div>
                      <div style={styles.resourceBarBg}>
                        <div
                          style={{
                            ...styles.resourceBarFill,
                            width: `${metric.memoryUsage}%`,
                            background: getResourceBarColor(metric.memoryUsage),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart placeholder */}
                <div style={{ marginTop: '20px' }}>
                  <div style={styles.chartPlaceholder}>
                    📊 Latency / Throughput Chart (Integration with charting library needed)
                  </div>
                </div>
              </div>

              <div style={styles.modelFooter}>
                <span style={styles.lastUpdated}>
                  Last updated: {new Date(metric.lastUpdated).toLocaleTimeString()}
                </span>
                <Button variant="outline" size="sm">{t('modelMetrics.viewDetails')}</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainModelMetricsFeature: MainFeatureModule = {
  id: 'main-ModelMetrics',
  name: 'Model Metrics',
  sidebarSection: 'model',
  sidebarItems: [
    {
      id: 'model-metrics',
      titleKey: 'sidebar.model.metrics.title',
      descriptionKey: 'sidebar.model.metrics.description',
    },
  ],
  routes: {
    'model-metrics': ModelMetricsPage,
  },
  requiresAuth: true,
};

export default mainModelMetricsFeature;
