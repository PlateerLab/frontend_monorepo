'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { createApiClient } from '@xgen/api-client';

import styles from './styles/dashboard.module.scss';
import type { DashboardData, DashboardOverview, LatestUpdateItem, TopWorkflowItem, DashboardErrorItem } from './types';
import { KpiSection } from './components/kpi-section';
import { LatestUpdatesSection } from './components/latest-updates-section';
import { TopWorkflowsSection } from './components/top-workflows-section';
import { ErrorsSection } from './components/errors-section';

// ─────────────────────────────────────────────────────────────
// Mock Data (TODO: API 연동 시 제거)
// ─────────────────────────────────────────────────────────────
const MOCK_OVERVIEW: DashboardOverview = {
  total: 127,
  normal: 98,
  paused: 24,
  error: 5,
  updatedAt: '2025-01-28 14:30',
};

const MOCK_UPDATES: LatestUpdateItem[] = [
  { id: '1', prefix: '배포', text: '이커머스 법률챗 v2.1', isLink: true },
  { id: '2', prefix: '수정', text: '고객지원 자동응답 플로우 업데이트' },
  { id: '3', prefix: '생성', text: '신규 FAQ 워크플로우 생성', isLink: true },
];

const MOCK_WORKFLOWS: TopWorkflowItem[] = [
  { id: '1', name: '이커머스 법률챗', isLink: true },
  { id: '2', name: '고객지원 자동응답', isLink: true },
  { id: '3', name: 'HR 문서 검색 어시스턴트', isLink: true },
];

const MOCK_ERRORS: DashboardErrorItem[] = [
  { id: '1', workflowName: '결제 처리 봇', time: '14:25', message: 'API 응답 타임아웃' },
  { id: '2', workflowName: '재고 알림 시스템', time: '13:45', message: '데이터베이스 연결 실패' },
];

// ─────────────────────────────────────────────────────────────
// Dashboard Page Component
// ─────────────────────────────────────────────────────────────

interface DashboardPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    overview: MOCK_OVERVIEW,
    latestUpdates: MOCK_UPDATES,
    topWorkflows: MOCK_WORKFLOWS,
    errors: MOCK_ERRORS,
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: 실제 API 연동
      // const api = createApiClient();
      // const response = await api.get<DashboardData>('/api/main/dashboard');
      // setData(response.data);

      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setData({
        overview: MOCK_OVERVIEW,
        latestUpdates: MOCK_UPDATES,
        topWorkflows: MOCK_WORKFLOWS,
        errors: MOCK_ERRORS,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleViewAllUpdates = useCallback(() => {
    onNavigate?.('workflows');
  }, [onNavigate]);

  const handleViewAllWorkflows = useCallback(() => {
    onNavigate?.('workflows');
  }, [onNavigate]);

  const handleViewAllErrors = useCallback(() => {
    // TODO: Navigate to error monitoring page
  }, []);

  if (loading) {
    return (
      <ContentArea>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea>
      <div className={styles.container}>
        {/* Welcome Section */}
        <section className={styles.welcome}>
          <h1 className={styles.welcomeTitle}>
            {t('dashboard.welcome', { name: user?.username || 'User' })}
          </h1>
          <p className={styles.welcomeSubtitle}>
            {t('dashboard.welcomeSubtitle')}
          </p>
        </section>

        {/* KPI Cards */}
        <KpiSection overview={data.overview} />

        {/* Two Column Layout */}
        <div className={styles.twoColumn}>
          <LatestUpdatesSection
            updates={data.latestUpdates}
            onViewAll={handleViewAllUpdates}
          />
          <TopWorkflowsSection
            workflows={data.topWorkflows}
            onViewAll={handleViewAllWorkflows}
          />
        </div>

        {/* Errors Table */}
        <ErrorsSection
          errors={data.errors}
          onViewAll={handleViewAllErrors}
        />
      </div>
    </ContentArea>
  );
};

// ─────────────────────────────────────────────────────────────
// Feature Export
// ─────────────────────────────────────────────────────────────

export const mainDashboardFeature: MainFeatureModule = {
  id: 'main-Dashboard',
  name: 'Main Dashboard',
  sidebarSection: 'workspace',
  sidebarItems: [
    {
      id: 'main-dashboard',
      titleKey: 'sidebar.workspace.mainDashboard.title',
      descriptionKey: 'sidebar.workspace.mainDashboard.description',
    },
  ],
  routes: {
    'main-dashboard': DashboardPage,
  },
  requiresAuth: true,
};

export default mainDashboardFeature;

// Re-export types
export type { DashboardData, DashboardOverview, LatestUpdateItem, TopWorkflowItem, DashboardErrorItem } from './types';
