'use client';

import React, { useState } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, SearchInput, FilterTabs, EmptyState, CardGrid } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type DataSourceType = 'database' | 'file' | 'api' | 'stream';
type ConnectionStatus = 'connected' | 'disconnected' | 'error';

interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  connector: string;
  status: ConnectionStatus;
  tables: number;
  rows: number;
  size: number; // in bytes
  lastSync: string;
  schema?: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const DatabaseIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 6V12C4 13.657 7.582 15 12 15C16.418 15 20 13.657 20 12V6" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 12V18C4 19.657 7.582 21 12 21C16.418 21 20 19.657 20 18V12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const RefreshIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.2091 2 12.1287 3.27475 13.0653 5.12132" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10.5 5H13.5V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
  sourceCard: { background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' },
  cardHeader: { padding: '20px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: '16px', alignItems: 'flex-start' },
  sourceIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sourceInfo: { flex: 1 },
  sourceName: { fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px' },
  sourceType: { fontSize: '13px', color: '#6B7280' },
  statusIndicator: { display: 'flex', alignItems: 'center', gap: '6px' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
  statusText: { fontSize: '12px', fontWeight: 500 },
  cardBody: { padding: '20px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' },
  statItem: { textAlign: 'center' as const, padding: '12px', background: '#F9FAFB', borderRadius: '10px' },
  statValue: { fontSize: '20px', fontWeight: 700, color: '#1F2937' },
  statLabel: { fontSize: '11px', color: '#9CA3AF' },
  schemaRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px' },
  schemaLabel: { fontSize: '12px', color: '#10B981', fontWeight: 500 },
  schemaValue: { fontSize: '12px', color: '#1F2937', fontFamily: 'monospace' },
  cardFooter: { padding: '16px 20px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  lastSync: { fontSize: '11px', color: '#9CA3AF' },
  cardActions: { display: 'flex', gap: '8px' },
};

const typeColors: Record<DataSourceType, string> = {
  database: '#10B981',
  file: '#6366F1',
  api: '#F59E0B',
  stream: '#EC4899',
};

const statusColors: Record<ConnectionStatus, { dot: string; text: string }> = {
  connected: { dot: '#22C55E', text: '#16A34A' },
  disconnected: { dot: '#9CA3AF', text: '#6B7280' },
  error: { dot: '#EF4444', text: '#DC2626' },
};

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const mockDataSources: DataSource[] = [
  {
    id: 'ds-001',
    name: 'Production PostgreSQL',
    type: 'database',
    connector: 'PostgreSQL',
    status: 'connected',
    tables: 45,
    rows: 12500000,
    size: 8500000000,
    lastSync: '2024-01-15T16:30:00Z',
    schema: 'public',
  },
  {
    id: 'ds-002',
    name: 'Analytics MySQL',
    type: 'database',
    connector: 'MySQL',
    status: 'connected',
    tables: 28,
    rows: 5800000,
    size: 3200000000,
    lastSync: '2024-01-15T16:00:00Z',
    schema: 'analytics',
  },
  {
    id: 'ds-003',
    name: 'Customer Data Lake',
    type: 'file',
    connector: 'S3',
    status: 'connected',
    tables: 0,
    rows: 45000000,
    size: 25000000000,
    lastSync: '2024-01-15T14:00:00Z',
  },
  {
    id: 'ds-004',
    name: 'External API Feed',
    type: 'api',
    connector: 'REST API',
    status: 'error',
    tables: 0,
    rows: 0,
    size: 0,
    lastSync: '2024-01-15T10:00:00Z',
  },
  {
    id: 'ds-005',
    name: 'Real-time Events',
    type: 'stream',
    connector: 'Kafka',
    status: 'connected',
    tables: 5,
    rows: 89000000,
    size: 12000000000,
    lastSync: '2024-01-15T16:35:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// Data Station Page
// ─────────────────────────────────────────────────────────────

interface DataStationPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const DataStationPage: React.FC<DataStationPageProps> = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t('dataStation.tabs.all') },
    { id: 'database', label: t('dataStation.tabs.database') },
    { id: 'file', label: t('dataStation.tabs.file') },
    { id: 'api', label: t('dataStation.tabs.api') },
    { id: 'stream', label: t('dataStation.tabs.stream') },
  ];

  const filteredSources = mockDataSources.filter(source => {
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         source.connector.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || source.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-';
    if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
    return `${(bytes / 1e3).toFixed(0)} KB`;
  };

  const formatNumber = (num: number) => {
    if (num === 0) return '-';
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <ContentArea title={t('dataStation.title')}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('dataStation.title')}</h1>
          <Button variant="primary">
            <PlusIcon />
            {t('dataStation.addSource')}
          </Button>
        </div>

        <div style={styles.controls}>
          <div style={styles.searchWrapper}>
            <SearchInput
              placeholder={t('dataStation.searchPlaceholder')}
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

        {filteredSources.length === 0 ? (
          <EmptyState
            title={t('dataStation.empty.title')}
            description={t('dataStation.empty.description')}
          />
        ) : (
          <CardGrid columns={2}>
            {filteredSources.map(source => (
              <div key={source.id} style={styles.sourceCard}>
                <div style={styles.cardHeader}>
                  <div
                    style={{
                      ...styles.sourceIcon,
                      background: `${typeColors[source.type]}15`,
                      color: typeColors[source.type],
                    }}
                  >
                    <DatabaseIcon />
                  </div>
                  <div style={styles.sourceInfo}>
                    <h3 style={styles.sourceName}>{source.name}</h3>
                    <span style={styles.sourceType}>{source.connector}</span>
                  </div>
                  <div style={styles.statusIndicator}>
                    <div style={{ ...styles.statusDot, background: statusColors[source.status].dot }} />
                    <span style={{ ...styles.statusText, color: statusColors[source.status].text }}>
                      {source.status}
                    </span>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.statsGrid}>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{source.tables || '-'}</div>
                      <div style={styles.statLabel}>{t('dataStation.tables')}</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{formatNumber(source.rows)}</div>
                      <div style={styles.statLabel}>{t('dataStation.rows')}</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{formatSize(source.size)}</div>
                      <div style={styles.statLabel}>{t('dataStation.size')}</div>
                    </div>
                  </div>

                  {source.schema && (
                    <div style={styles.schemaRow}>
                      <span style={styles.schemaLabel}>{t('dataStation.schema')}:</span>
                      <span style={styles.schemaValue}>{source.schema}</span>
                    </div>
                  )}
                </div>

                <div style={styles.cardFooter}>
                  <span style={styles.lastSync}>
                    {t('dataStation.lastSync')}: {formatDate(source.lastSync)}
                  </span>
                  <div style={styles.cardActions}>
                    <Button variant="outline" size="sm">
                      <RefreshIcon />
                    </Button>
                    <Button variant="outline" size="sm">{t('dataStation.explore')}</Button>
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

export const mainDataStationFeature: MainFeatureModule = {
  id: 'main-DataStation',
  name: 'Data Station',
  sidebarSection: 'data',
  sidebarItems: [
    {
      id: 'data-station',
      titleKey: 'sidebar.data.station.title',
      descriptionKey: 'sidebar.data.station.description',
    },
  ],
  routes: {
    'data-station': DataStationPage,
  },
  requiresAuth: true,
};

export default mainDataStationFeature;
