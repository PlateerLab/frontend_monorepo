'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';
import { useAuth } from '@xgen/auth-provider';
import { createApiClient } from '@xgen/api-client';

import type { DashboardData, DashboardOverview, LatestUpdateItem, TopAgentflowItem, DashboardErrorItem } from './types';
import { KpiSection } from './components/kpi-section';
import { LatestUpdatesSection } from './components/latest-updates-section';
import { TopAgentflowsSection } from './components/top-agentflows-section';
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
  { id: '3', prefix: '생성', text: '신규 FAQ 에이전트플로우 생성', isLink: true },
];

const MOCK_WORKFLOWS: TopAgentflowItem[] = [
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
    topAgentflows: MOCK_WORKFLOWS,
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
        topAgentflows: MOCK_WORKFLOWS,
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

  const handleViewAllAgentflows = useCallback(() => {
    onNavigate?.('workflows');
  }, [onNavigate]);

  const handleViewAllErrors = useCallback(() => {
    // TODO: Navigate to error monitoring page
  }, []);

  if (loading) {
    return (
      <ContentArea
        title={t('dashboard.welcome', { name: user?.username || 'User' })}
        description={t('dashboard.welcomeSubtitle')}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin" />
        </div>
      </ContentArea>
    );
  }

  return (
    <ContentArea
      title={t('dashboard.welcome', { name: user?.username || 'User' })}
      description={t('dashboard.welcomeSubtitle')}
    >
      <div className="flex flex-col gap-8 p-8 max-w-[1400px] mx-auto">
        {/* KPI Cards */}
        <KpiSection overview={data.overview} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-8 max-lg:grid-cols-1">
          <LatestUpdatesSection
            updates={data.latestUpdates}
            onViewAll={handleViewAllUpdates}
          />
          <TopAgentflowsSection
            workflows={data.topAgentflows}
            onViewAll={handleViewAllAgentflows}
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
  id: 'main-dashboard',
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
export type { DashboardData, DashboardOverview, LatestUpdateItem, TopAgentflowItem, DashboardErrorItem } from './types';
