'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@xgen/ui';
import { FiArrowLeft, FiFileText, FiClock } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import type { CollectionItem, DocumentItem } from '../api';
import { getDocumentDetail } from '../api';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch { return dateStr; }
}

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface DocumentDetailProps {
  collection: CollectionItem;
  document: DocumentItem;
  onBack: () => void;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const DocumentDetail: React.FC<DocumentDetailProps> = ({
  collection,
  document: initialDocument,
  onBack,
}) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<DocumentItem | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await getDocumentDetail(collection.name, initialDocument.documentId);
      setDocumentData(detail);
    } catch (err) {
      console.error('Failed to load document detail:', err);
      setError(t('documents.collection.detail.error.loadDetailFailed'));
    } finally {
      setLoading(false);
    }
  }, [collection.name, initialDocument.documentId, t]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const chunks = documentData?.chunks || [];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <FiArrowLeft />
        </Button>
        <div className="flex items-center gap-2">
          <FiFileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground truncate max-w-[400px]">
            {initialDocument.fileName}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span className="uppercase">{initialDocument.fileType}</span>
          <span>{initialDocument.totalChunks} chunks</span>
          {initialDocument.processedAt && (
            <span className="flex items-center gap-1">
              <FiClock className="w-3 h-3" />
              {formatDate(initialDocument.processedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={loadDetail}>{t('common.retry')}</Button>
          </div>
        ) : chunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
            <FiFileText className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t('documents.collection.detail.noChunks')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chunks.map((chunk) => (
              <div
                key={chunk.chunkId}
                className="border border-border rounded-lg bg-card overflow-hidden"
              >
                {/* Chunk Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
                  <span className="text-xs font-medium text-foreground">
                    Chunk #{chunk.chunkIndex}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatSize(chunk.chunkSize)}
                  </span>
                </div>
                {/* Chunk Content */}
                <div className="p-4">
                  <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-sans leading-relaxed">
                    {chunk.chunkText || chunk.chunkTextPreview || '(empty)'}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentDetail;
