'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RouteComponentProps, MainFeatureModule } from '@xgen/types';
import { ContentArea, SearchInput, FilterTabs, Button, EmptyState } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type DocumentType = 'pdf' | 'doc' | 'txt' | 'md' | 'html' | 'csv' | 'xlsx';
export type DocumentStatus = 'processing' | 'indexed' | 'failed';

export interface DocumentItem {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  status: DocumentStatus;
  workflowId?: string;
  workflowName?: string;
  chunkCount?: number;
  embedding?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const DocumentIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 6H14C12.939 6 11.922 6.421 11.172 7.172C10.421 7.922 10 8.939 10 10V38C10 39.061 10.421 40.078 11.172 40.828C11.922 41.579 12.939 42 14 42H34C35.061 42 36.078 41.579 36.828 40.828C37.579 40.078 38 39.061 38 38V16L28 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 6V16H38M32 26H16M32 34H16M20 18H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PdfIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.667 1.667H5C4.558 1.667 4.134 1.842 3.822 2.155C3.51 2.467 3.333 2.891 3.333 3.333V16.667C3.333 17.109 3.51 17.533 3.822 17.845C4.134 18.158 4.558 18.333 5 18.333H15C15.442 18.333 15.866 18.158 16.178 17.845C16.49 17.533 16.667 17.109 16.667 16.667V6.667L11.667 1.667Z" stroke="#E53935" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.667 1.667V6.667H16.667" stroke="#E53935" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UploadIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.75 11.25V14.25C15.75 14.648 15.592 15.029 15.311 15.311C15.029 15.592 14.648 15.75 14.25 15.75H3.75C3.352 15.75 2.971 15.592 2.689 15.311C2.408 15.029 2.25 14.648 2.25 14.25V11.25M12.75 6L9 2.25M9 2.25L5.25 6M9 2.25V11.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChunkIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.75" y="1.75" width="4.083" height="4.083" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="8.167" y="1.75" width="4.083" height="4.083" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="1.75" y="8.167" width="4.083" height="4.083" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="8.167" y="8.167" width="4.083" height="4.083" rx="1" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-001',
    name: '전자상거래법_가이드.pdf',
    type: 'pdf',
    size: 2456000,
    status: 'indexed',
    workflowId: 'wf-001',
    workflowName: '이커머스 법률 상담',
    chunkCount: 124,
    embedding: 'text-embedding-ada-002',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-20T10:05:00Z',
  },
  {
    id: 'doc-002',
    name: '고객문의_FAQ_v2.docx',
    type: 'doc',
    size: 845000,
    status: 'indexed',
    workflowId: 'wf-002',
    workflowName: '고객지원 자동응답',
    chunkCount: 56,
    embedding: 'text-embedding-ada-002',
    createdAt: '2025-01-18T14:30:00Z',
    updatedAt: '2025-01-18T14:32:00Z',
  },
  {
    id: 'doc-003',
    name: 'HR_규정집.pdf',
    type: 'pdf',
    size: 5234000,
    status: 'processing',
    chunkCount: 0,
    createdAt: '2025-01-28T09:00:00Z',
    updatedAt: '2025-01-28T09:00:00Z',
  },
  {
    id: 'doc-004',
    name: '기술문서_API.md',
    type: 'md',
    size: 125000,
    status: 'indexed',
    chunkCount: 34,
    embedding: 'text-embedding-ada-002',
    createdAt: '2025-01-15T16:00:00Z',
    updatedAt: '2025-01-15T16:01:00Z',
  },
];

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: { padding: '24px', maxWidth: '1400px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '16px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '300px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  card: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' },
  cardIcon: { width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(48, 94, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardContent: { flex: 1, minWidth: 0 },
  cardName: { fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  cardMeta: { fontSize: '12px', color: '#6B7280', display: 'flex', gap: '12px' },
  statusBadge: { padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 },
  indexed: { background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' },
  processing: { background: 'rgba(234, 179, 8, 0.1)', color: '#EAB308' },
  failed: { background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' },
  spinner: { width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: '#305EEB', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};

// ─────────────────────────────────────────────────────────────
// Documents Page
// ─────────────────────────────────────────────────────────────

interface DocumentsPageProps extends RouteComponentProps {
  onNavigate?: (sectionId: string) => void;
}

const DocumentsPage: React.FC<DocumentsPageProps> = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState('');

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setDocuments(MOCK_DOCUMENTS);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    if (!search) return documents;
    return documents.filter(doc => doc.name.toLowerCase().includes(search.toLowerCase()));
  }, [documents, search]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <ContentArea
      title={t('documents.title')}
      headerActions={
        <Button>
          <UploadIcon />
          {t('documents.upload')}
        </Button>
      }
    >
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('documents.searchPlaceholder')}
              size="sm"
            />
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <EmptyState
            icon={<DocumentIcon />}
            title={t('documents.empty.title')}
            description={t('documents.empty.description')}
          />
        ) : (
          <div style={styles.grid}>
            {filteredDocuments.map(doc => (
              <div key={doc.id} style={styles.card}>
                <div style={styles.cardIcon}>
                  <PdfIcon />
                </div>
                <div style={styles.cardContent}>
                  <h3 style={styles.cardName}>{doc.name}</h3>
                  <div style={styles.cardMeta}>
                    <span>{formatSize(doc.size)}</span>
                    {doc.chunkCount !== undefined && doc.chunkCount > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ChunkIcon />
                        {doc.chunkCount} chunks
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ ...styles.statusBadge, ...(doc.status === 'indexed' ? styles.indexed : doc.status === 'processing' ? styles.processing : styles.failed) }}>
                  {doc.status}
                </span>
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

export const mainDocumentsFeature: MainFeatureModule = {
  id: 'main-Documents',
  name: 'Documents',
  sidebarSection: 'workflow',
  sidebarItems: [
    {
      id: 'documents',
      titleKey: 'sidebar.workflow.documents.title',
      descriptionKey: 'sidebar.workflow.documents.description',
    },
  ],
  routes: {
    'documents': DocumentsPage,
  },
  requiresAuth: true,
};

export default mainDocumentsFeature;
