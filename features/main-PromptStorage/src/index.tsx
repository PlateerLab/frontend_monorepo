'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, SearchInput, Button, EmptyState, FilterTabs } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type PromptType = 'system' | 'user' | 'template';

export interface PromptItem {
  id: string;
  name: string;
  description?: string;
  type: PromptType;
  content: string;
  variables?: string[];
  version: string;
  usageCount: number;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const PromptIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 18L6 24L16 30M32 18L42 24L32 30M28 8L20 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SystemIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M14.55 11.25C14.4374 11.505 14.4018 11.788 14.4479 12.064C14.494 12.339 14.6198 12.594 14.8087 12.799L14.8537 12.844C15.0047 12.995 15.1243 13.174 15.2056 13.373C15.2868 13.571 15.3282 13.784 15.3275 13.999C15.3275 14.214 15.284 14.426 15.2014 14.624C15.1188 14.822 14.998 15.001 14.8462 15.15C14.6945 15.3 14.514 15.418 14.316 15.499C14.118 15.58 13.905 15.622 13.69 15.622C13.476 15.622 13.263 15.58 13.065 15.499C12.867 15.418 12.686 15.3 12.535 15.15L12.49 15.105C12.285 14.916 12.03 14.79 11.754 14.744C11.479 14.698 11.196 14.734 10.941 14.846C10.691 14.953 10.478 15.131 10.329 15.358C10.179 15.585 10.099 15.851 10.099 16.124V16.25C10.099 16.681 9.927 17.094 9.622 17.399C9.317 17.704 8.904 17.876 8.473 17.876C8.042 17.876 7.629 17.704 7.324 17.399C7.019 17.094 6.847 16.681 6.847 16.25V16.183C6.842 15.903 6.754 15.63 6.594 15.4C6.433 15.171 6.209 14.996 5.948 14.898C5.693 14.785 5.41 14.749 5.135 14.795C4.86 14.842 4.604 14.967 4.4 15.156L4.355 15.201C4.203 15.351 4.022 15.469 3.824 15.55C3.626 15.631 3.413 15.673 3.199 15.673C2.984 15.673 2.772 15.631 2.573 15.55C2.375 15.469 2.194 15.351 2.043 15.201C1.893 15.05 1.775 14.869 1.694 14.671C1.613 14.472 1.571 14.26 1.572 14.045C1.572 13.831 1.614 13.618 1.694 13.42C1.775 13.221 1.894 13.041 2.043 12.889L2.088 12.844C2.277 12.64 2.403 12.385 2.449 12.109C2.495 11.834 2.46 11.551 2.347 11.296C2.24 11.046 2.063 10.833 1.836 10.684C1.609 10.534 1.342 10.454 1.07 10.454H0.943C0.512 10.454 0.098 10.282 -0.207 9.977C-0.511 9.672 -0.683 9.259 -0.683 8.828C-0.683 8.397 -0.511 7.984 -0.207 7.679C0.098 7.374 0.512 7.202 0.943 7.202H1.01C1.29 7.197 1.563 7.109 1.792 6.948C2.021 6.788 2.197 6.564 2.295 6.303C2.408 6.048 2.443 5.765 2.397 5.49C2.351 5.214 2.225 4.959 2.036 4.755L1.991 4.71C1.842 4.558 1.724 4.377 1.643 4.179C1.562 3.981 1.52 3.769 1.521 3.554C1.521 3.339 1.562 3.126 1.643 2.928C1.724 2.73 1.842 2.549 1.992 2.398C2.144 2.248 2.324 2.13 2.522 2.049C2.721 1.968 2.933 1.926 3.148 1.927C3.363 1.927 3.575 1.969 3.774 2.049C3.972 2.13 4.152 2.249 4.304 2.398L4.349 2.443C4.554 2.632 4.809 2.758 5.084 2.804C5.359 2.85 5.642 2.815 5.898 2.702H5.948C6.198 2.595 6.411 2.418 6.56 2.191C6.71 1.964 6.79 1.697 6.79 1.425V1.298C6.79 0.867 6.962 0.453 7.267 0.148C7.572 -0.157 7.985 -0.328 8.416 -0.328C8.847 -0.328 9.26 -0.157 9.565 0.148C9.87 0.453 10.042 0.867 10.042 1.298V1.365C10.042 1.638 10.122 1.904 10.272 2.131C10.421 2.358 10.634 2.535 10.884 2.643C11.139 2.755 11.422 2.791 11.697 2.745C11.973 2.699 12.228 2.573 12.433 2.384L12.477 2.339C12.629 2.189 12.81 2.071 13.008 1.99C13.206 1.909 13.419 1.867 13.633 1.868C13.848 1.868 14.061 1.91 14.259 1.991C14.457 2.071 14.638 2.19 14.789 2.34C14.939 2.491 15.057 2.672 15.138 2.87C15.219 3.068 15.261 3.281 15.26 3.496C15.261 3.71 15.219 3.923 15.138 4.121C15.057 4.319 14.939 4.5 14.789 4.651L14.744 4.696C14.555 4.901 14.43 5.156 14.383 5.432C14.337 5.707 14.373 5.99 14.486 6.245V6.296C14.593 6.546 14.77 6.758 14.997 6.908C15.224 7.057 15.491 7.137 15.763 7.138H15.89C16.321 7.138 16.734 7.309 17.039 7.614C17.344 7.919 17.516 8.333 17.516 8.763C17.516 9.194 17.344 9.608 17.039 9.913C16.734 10.217 16.321 10.389 15.89 10.389H15.823C15.55 10.39 15.284 10.47 15.057 10.619C14.83 10.769 14.652 10.981 14.545 11.231L14.55 11.25Z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const TemplateIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2.25 6.75H15.75M6.75 6.75V15.75" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const UserPromptIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 15.75V14.25C15 13.4544 14.6839 12.6913 14.1213 12.1287C13.5587 11.5661 12.7956 11.25 12 11.25H6C5.20435 11.25 4.44129 11.5661 3.87868 12.1287C3.31607 12.6913 3 13.4544 3 14.25V15.75M12 5.25C12 6.90685 10.6569 8.25 9 8.25C7.34315 8.25 6 6.90685 6 5.25C6 3.59315 7.34315 2.25 9 2.25C10.6569 2.25 12 3.59315 12 5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_PROMPTS: PromptItem[] = [
  {
    id: 'prompt-001',
    name: '법률 상담 시스템 프롬프트',
    description: '전자상거래 법률 상담을 위한 시스템 프롬프트',
    type: 'system',
    content: '당신은 전자상거래법 전문가입니다. 관련 법률과 판례를 기반으로 정확한 정보를 제공해주세요.',
    variables: ['domain', 'language'],
    version: '2.1.0',
    usageCount: 456,
    category: '법무',
    tags: ['법률', 'system'],
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-25T14:00:00Z',
  },
  {
    id: 'prompt-002',
    name: '고객 응대 템플릿',
    description: '고객 문의 응대를 위한 프롬프트 템플릿',
    type: 'template',
    content: '안녕하세요, {{customer_name}}님. {{company_name}}입니다. 문의하신 {{topic}}에 대해 답변드립니다.',
    variables: ['customer_name', 'company_name', 'topic'],
    version: '1.5.0',
    usageCount: 789,
    category: 'CS',
    tags: ['고객지원', 'template'],
    createdAt: '2025-01-12T11:00:00Z',
    updatedAt: '2025-01-26T10:00:00Z',
  },
  {
    id: 'prompt-003',
    name: '문서 요약 프롬프트',
    description: '긴 문서를 요약하기 위한 사용자 프롬프트',
    type: 'user',
    content: '다음 문서를 핵심 요점 위주로 3문장 이내로 요약해주세요.',
    version: '1.0.0',
    usageCount: 234,
    category: '일반',
    tags: ['요약', 'user'],
    createdAt: '2025-01-20T15:00:00Z',
    updatedAt: '2025-01-27T12:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: { padding: '24px', maxWidth: '1400px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '16px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px', flex: 1 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' },
  card: { display: 'flex', flexDirection: 'column' as const, padding: '20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' },
  cardIcon: { width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(48, 94, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#305EEB' },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px' },
  cardType: { fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  cardDescription: { fontSize: '13px', color: '#6B7280', margin: '0 0 12px', lineHeight: 1.5 },
  cardContent: { padding: '12px', background: '#F9FAFB', borderRadius: '8px', fontSize: '12px', color: '#4B5563', fontFamily: 'monospace', marginBottom: '12px', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardMeta: { fontSize: '12px', color: '#9CA3AF', display: 'flex', gap: '16px', marginTop: 'auto' },
  cardVariables: { display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '12px' },
  variable: { padding: '2px 8px', background: 'rgba(48, 94, 235, 0.1)', borderRadius: '4px', fontSize: '11px', color: '#305EEB', fontFamily: 'monospace' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' },
  spinner: { width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: '#305EEB', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};

// ─────────────────────────────────────────────────────────────
// Prompt Storage Page
// ─────────────────────────────────────────────────────────────

interface PromptStoragePageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const PromptStoragePage: React.FC<PromptStoragePageProps> = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setPrompts(MOCK_PROMPTS);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      if (search && !prompt.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter !== 'all' && prompt.type !== filter) return false;
      return true;
    });
  }, [prompts, search, filter]);

  const filterTabs = [
    { key: 'all', label: t('promptStorage.filter.all'), count: prompts.length },
    { key: 'system', label: 'System', count: prompts.filter(p => p.type === 'system').length },
    { key: 'user', label: 'User', count: prompts.filter(p => p.type === 'user').length },
    { key: 'template', label: 'Template', count: prompts.filter(p => p.type === 'template').length },
  ];

  const getTypeIcon = (type: PromptType) => {
    switch (type) {
      case 'system':
        return <SystemIcon />;
      case 'template':
        return <TemplateIcon />;
      case 'user':
        return <UserPromptIcon />;
      default:
        return <PromptIcon />;
    }
  };

  return (
    <ContentArea
      title={t('promptStorage.title')}
      headerActions={
        <Button>
          <PlusIcon />
          {t('promptStorage.createNew')}
        </Button>
      }
    >
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <FilterTabs
              tabs={filterTabs}
              activeKey={filter}
              onChange={setFilter}
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('promptStorage.searchPlaceholder')}
              size="sm"
            />
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
          </div>
        ) : filteredPrompts.length === 0 ? (
          <EmptyState
            icon={<PromptIcon />}
            title={t('promptStorage.empty.title')}
            description={t('promptStorage.empty.description')}
          />
        ) : (
          <div style={styles.grid}>
            {filteredPrompts.map(prompt => (
              <div key={prompt.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIcon}>
                    {getTypeIcon(prompt.type)}
                  </div>
                  <div style={styles.cardInfo}>
                    <h3 style={styles.cardName}>{prompt.name}</h3>
                    <span style={styles.cardType}>{prompt.type} · v{prompt.version}</span>
                  </div>
                </div>
                <p style={styles.cardDescription}>{prompt.description}</p>
                <div style={styles.cardContent}>{prompt.content}</div>
                {prompt.variables && prompt.variables.length > 0 && (
                  <div style={styles.cardVariables}>
                    {prompt.variables.map(v => (
                      <span key={v} style={styles.variable}>{`{{${v}}}`}</span>
                    ))}
                  </div>
                )}
                <div style={styles.cardMeta}>
                  <span>{prompt.usageCount.toLocaleString()} uses</span>
                  <span>{prompt.category}</span>
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

export const mainPromptStorageFeature: MainFeatureModule = {
  id: 'main-PromptStorage',
  name: 'Prompt Storage',
  sidebarSection: 'workflow',
  sidebarItems: [
    {
      id: 'prompt-storage',
      titleKey: 'sidebar.workflow.prompts.title',
      descriptionKey: 'sidebar.workflow.prompts.description',
    },
  ],
  routes: {
    'prompt-storage': PromptStoragePage,
  },
  requiresAuth: true,
};

export default mainPromptStorageFeature;
