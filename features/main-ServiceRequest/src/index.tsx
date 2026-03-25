'use client';

import React, { useState } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, SearchInput, FilterTabs, EmptyState } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type RequestStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';
type RequestCategory = 'bug' | 'feature' | 'question' | 'access' | 'other';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  priority: RequestPriority;
  category: RequestCategory;
  requester: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  responses: number;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const PlusIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CommentIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 1H12C12.5523 1 13 1.44772 13 2V9C13 9.55228 12.5523 10 12 10H4L1 13V2C1 1.44772 1.44772 1 2 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  summaryCard: { padding: '20px', background: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', textAlign: 'center' as const },
  summaryValue: { fontSize: '28px', fontWeight: 700, marginBottom: '4px' },
  summaryLabel: { fontSize: '13px', color: '#6B7280' },
  requestList: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  requestCard: { background: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' },
  priorityIndicator: { width: '4px', height: '100%', borderRadius: '2px', minHeight: '80px' },
  requestContent: { flex: 1 },
  requestHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  requestTitle: { fontSize: '15px', fontWeight: 600, color: '#1F2937', margin: 0 },
  requestId: { fontSize: '12px', color: '#9CA3AF', fontFamily: 'monospace' },
  requestDesc: { fontSize: '13px', color: '#6B7280', lineHeight: 1.5, marginBottom: '12px' },
  requestMeta: { display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' as const },
  metaItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' },
  statusBadge: { padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 500 },
  categoryBadge: { padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600 },
  priorityBadge: { padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600 },
  requestActions: { display: 'flex', gap: '8px', flexShrink: 0 },
};

const priorityColors: Record<RequestPriority, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
  urgent: '#DC2626',
};

const statusStyles: Record<RequestStatus, { bg: string; color: string }> = {
  open: { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' },
  'in-progress': { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706' },
  resolved: { bg: 'rgba(34, 197, 94, 0.1)', color: '#16A34A' },
  closed: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' },
};

const categoryStyles: Record<RequestCategory, { bg: string; color: string }> = {
  bug: { bg: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' },
  feature: { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' },
  question: { bg: 'rgba(6, 182, 212, 0.1)', color: '#0891B2' },
  access: { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706' },
  other: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' },
};

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const mockRequests: ServiceRequest[] = [
  {
    id: 'SR-2024-001',
    title: '모델 배포 시 에러 발생',
    description: 'Customer Intent Classifier v2.1.0 모델을 프로덕션 환경에 배포할 때 메모리 부족 에러가 발생합니다.',
    status: 'in-progress',
    priority: 'high',
    category: 'bug',
    requester: '김철수',
    assignee: '박영희',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    responses: 3,
  },
  {
    id: 'SR-2024-002',
    title: 'GPU 리소스 증설 요청',
    description: 'ML 훈련 작업을 위해 추가 GPU 리소스가 필요합니다. 현재 2개에서 4개로 증설 요청드립니다.',
    status: 'open',
    priority: 'medium',
    category: 'access',
    requester: '이민수',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    responses: 0,
  },
  {
    id: 'SR-2024-003',
    title: 'Auto-scaling 기능 추가 요청',
    description: '모델 서빙 시 트래픽에 따른 자동 스케일링 기능이 있으면 좋겠습니다.',
    status: 'open',
    priority: 'low',
    category: 'feature',
    requester: '정수진',
    createdAt: '2024-01-14T16:00:00Z',
    updatedAt: '2024-01-14T16:00:00Z',
    responses: 1,
  },
  {
    id: 'SR-2024-004',
    title: 'API 호출 방법 문의',
    description: '외부 시스템에서 모델 API를 호출하는 방법에 대해 문의드립니다. 인증 방식이 궁금합니다.',
    status: 'resolved',
    priority: 'low',
    category: 'question',
    requester: '최지훈',
    assignee: '김서연',
    createdAt: '2024-01-13T11:00:00Z',
    updatedAt: '2024-01-14T09:00:00Z',
    responses: 4,
  },
  {
    id: 'SR-2024-005',
    title: '긴급: 프로덕션 모델 다운',
    description: '프로덕션 환경의 Document Parser 모델이 응답하지 않습니다. 즉시 확인 부탁드립니다.',
    status: 'resolved',
    priority: 'urgent',
    category: 'bug',
    requester: '한민국',
    assignee: '박영희',
    createdAt: '2024-01-12T08:00:00Z',
    updatedAt: '2024-01-12T10:30:00Z',
    responses: 8,
  },
];

// ─────────────────────────────────────────────────────────────
// Service Request Page
// ─────────────────────────────────────────────────────────────

interface ServiceRequestPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const ServiceRequestPage: React.FC<ServiceRequestPageProps> = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: t('serviceRequest.tabs.all') },
    { id: 'open', label: t('serviceRequest.tabs.open') },
    { id: 'in-progress', label: t('serviceRequest.tabs.inProgress') },
    { id: 'resolved', label: t('serviceRequest.tabs.resolved') },
  ];

  const filteredRequests = mockRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || request.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return t('serviceRequest.time.justNow');
    if (diffHours < 24) return `${diffHours}${t('serviceRequest.time.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays}${t('serviceRequest.time.daysAgo')}`;
    return date.toLocaleDateString();
  };

  // Summary stats
  const openCount = mockRequests.filter(r => r.status === 'open').length;
  const inProgressCount = mockRequests.filter(r => r.status === 'in-progress').length;
  const resolvedCount = mockRequests.filter(r => r.status === 'resolved').length;
  const urgentCount = mockRequests.filter(r => r.priority === 'urgent' || r.priority === 'high').length;

  return (
    <ContentArea title={t('serviceRequest.title')}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t('serviceRequest.title')}</h1>
          <Button variant="primary">
            <PlusIcon />
            {t('serviceRequest.newRequest')}
          </Button>
        </div>

        {/* Summary */}
        <div style={styles.summaryRow}>
          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryValue, color: '#6366F1' }}>{openCount}</div>
            <div style={styles.summaryLabel}>{t('serviceRequest.summary.open')}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryValue, color: '#D97706' }}>{inProgressCount}</div>
            <div style={styles.summaryLabel}>{t('serviceRequest.summary.inProgress')}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryValue, color: '#16A34A' }}>{resolvedCount}</div>
            <div style={styles.summaryLabel}>{t('serviceRequest.summary.resolved')}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={{ ...styles.summaryValue, color: '#EF4444' }}>{urgentCount}</div>
            <div style={styles.summaryLabel}>{t('serviceRequest.summary.urgent')}</div>
          </div>
        </div>

        <div style={styles.controls}>
          <div style={styles.searchWrapper}>
            <SearchInput
              placeholder={t('serviceRequest.searchPlaceholder')}
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

        {filteredRequests.length === 0 ? (
          <EmptyState
            title={t('serviceRequest.empty.title')}
            description={t('serviceRequest.empty.description')}
          />
        ) : (
          <div style={styles.requestList}>
            {filteredRequests.map(request => (
              <div key={request.id} style={styles.requestCard}>
                <div
                  style={{
                    ...styles.priorityIndicator,
                    background: priorityColors[request.priority],
                  }}
                />
                <div style={styles.requestContent}>
                  <div style={styles.requestHeader}>
                    <div>
                      <h3 style={styles.requestTitle}>{request.title}</h3>
                      <span style={styles.requestId}>{request.id}</span>
                    </div>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: statusStyles[request.status].bg,
                        color: statusStyles[request.status].color,
                      }}
                    >
                      {request.status}
                    </span>
                  </div>
                  <p style={styles.requestDesc}>{request.description}</p>
                  <div style={styles.requestMeta}>
                    <span
                      style={{
                        ...styles.categoryBadge,
                        background: categoryStyles[request.category].bg,
                        color: categoryStyles[request.category].color,
                      }}
                    >
                      {request.category}
                    </span>
                    <span
                      style={{
                        ...styles.priorityBadge,
                        background: `${priorityColors[request.priority]}15`,
                        color: priorityColors[request.priority],
                      }}
                    >
                      {request.priority}
                    </span>
                    <span style={styles.metaItem}>
                      {t('serviceRequest.by')} {request.requester}
                    </span>
                    {request.assignee && (
                      <span style={styles.metaItem}>
                        → {request.assignee}
                      </span>
                    )}
                    <span style={styles.metaItem}>
                      <CommentIcon />
                      {request.responses}
                    </span>
                    <span style={styles.metaItem}>
                      {formatDate(request.updatedAt)}
                    </span>
                  </div>
                </div>
                <div style={styles.requestActions}>
                  <Button variant="outline" size="sm">{t('serviceRequest.view')}</Button>
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

export const mainServiceRequestFeature: MainFeatureModule = {
  id: 'main-ServiceRequest',
  name: 'Service Request',
  sidebarSection: 'support',
  sidebarItems: [
    {
      id: 'service-request',
      titleKey: 'sidebar.support.request.title',
      descriptionKey: 'sidebar.support.request.description',
    },
  ],
  routes: {
    'service-request': ServiceRequestPage,
  },
  requiresAuth: true,
};

export default mainServiceRequestFeature;
