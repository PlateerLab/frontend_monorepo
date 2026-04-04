'use client';

import React, { useState } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, Button, SearchInput, FilterTabs, EmptyState } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

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

const priorityClasses: Record<RequestPriority, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
  urgent: 'bg-red-600',
};

const priorityBadgeClasses: Record<RequestPriority, string> = {
  low: 'bg-green-500/10 text-green-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-red-500/10 text-red-500',
  urgent: 'bg-red-600/10 text-red-600',
};

const statusClasses: Record<RequestStatus, string> = {
  open: 'bg-indigo-500/10 text-indigo-500',
  'in-progress': 'bg-amber-600/10 text-amber-600',
  resolved: 'bg-green-600/10 text-green-600',
  closed: 'bg-gray-500/10 text-gray-500',
};

const categoryClasses: Record<RequestCategory, string> = {
  bug: 'bg-red-500/10 text-red-600',
  feature: 'bg-indigo-500/10 text-indigo-500',
  question: 'bg-cyan-500/10 text-cyan-700',
  access: 'bg-amber-500/10 text-amber-600',
  other: 'bg-gray-500/10 text-gray-500',
};

const summaryValueClasses = ['text-indigo-500', 'text-amber-600', 'text-green-600', 'text-red-500'];

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
    { key: 'all', label: t('serviceRequest.tabs.all') },
    { key: 'open', label: t('serviceRequest.tabs.open') },
    { key: 'in-progress', label: t('serviceRequest.tabs.inProgress') },
    { key: 'resolved', label: t('serviceRequest.tabs.resolved') },
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
    <ContentArea
      title={t('serviceRequest.title')}
      headerActions={
        <Button variant="primary">
          <PlusIcon />
          {t('serviceRequest.newRequest')}
        </Button>
      }
    >
      <div className="p-6">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { value: openCount, label: t('serviceRequest.summary.open'), cls: summaryValueClasses[0] },
            { value: inProgressCount, label: t('serviceRequest.summary.inProgress'), cls: summaryValueClasses[1] },
            { value: resolvedCount, label: t('serviceRequest.summary.resolved'), cls: summaryValueClasses[2] },
            { value: urgentCount, label: t('serviceRequest.summary.urgent'), cls: summaryValueClasses[3] },
          ].map((item, i) => (
            <div key={i} className="p-5 bg-white rounded-[14px] border border-border text-center">
              <div className={`text-[28px] font-bold mb-1 ${item.cls}`}>{item.value}</div>
              <div className="text-[13px] text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 max-w-[400px]">
            <SearchInput
              placeholder={t('serviceRequest.searchPlaceholder')}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <FilterTabs
            tabs={tabs}
            activeKey={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />
        </div>

        {filteredRequests.length === 0 ? (
          <EmptyState
            title={t('serviceRequest.empty.title')}
            description={t('serviceRequest.empty.description')}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredRequests.map(request => (
              <div key={request.id} className="bg-white rounded-[14px] border border-border p-5 flex gap-4 items-start">
                <div className={`w-1 rounded-sm min-h-[80px] ${priorityClasses[request.priority]}`} />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-[15px] font-semibold text-foreground m-0">{request.title}</h3>
                      <span className="text-xs text-muted-foreground/60 font-mono">{request.id}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-[10px] text-[11px] font-medium ${statusClasses[request.status]}`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">{request.description}</p>
                  <div className="flex gap-4 items-center flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${categoryClasses[request.category]}`}>
                      {request.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${priorityBadgeClasses[request.priority]}`}>
                      {request.priority}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {t('serviceRequest.by')} {request.requester}
                    </span>
                    {request.assignee && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        → {request.assignee}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CommentIcon />
                      {request.responses}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {formatDate(request.updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
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
