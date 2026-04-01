'use client';
import './locales';
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiFile } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import type { CanvasPagePlugin } from '@xgen/types';
import styles from './styles/canvas-document-drop-modal.module.scss';

// ── Types ──────────────────────────────────────────────────────

interface CollectionItem {
    id: number;
    collection_name: string;
    collection_make_name: string;
    points_count?: number;
    description?: string;
}

export interface CanvasDocumentDropModalProps {
    file: File;
    onComplete: (collectionName: string) => void;
    onCancel: () => void;
    /** Default collection when dropped on Search Context node */
    defaultCollectionName?: string;
    /** Injected API: fetch available collections */
    fetchCollections?: () => Promise<CollectionItem[]>;
    /** Injected API: create a new collection */
    createCollection?: (name: string) => Promise<any>;
}

// ── Constants ──────────────────────────────────────────────────

/** Supported document extensions for canvas drop — .json excluded (used for workflow load) */
export const DOCUMENT_DROP_EXTENSIONS = new Set([
    // Documents
    '.pdf', '.docx', '.doc', '.pptx', '.ppt', '.hwp', '.hwpx',
    // Text
    '.txt', '.md', '.markdown', '.rtf',
    // Code
    '.py', '.js', '.ts', '.java', '.cpp', '.c', '.h', '.cs', '.go', '.rs',
    '.php', '.rb', '.swift', '.kt', '.scala', '.dart', '.r', '.sql',
    '.html', '.css', '.jsx', '.tsx', '.vue', '.svelte',
    // Config
    '.yaml', '.yml', '.xml', '.toml', '.ini', '.cfg', '.conf', '.properties', '.env',
    // Data
    '.csv', '.tsv', '.xlsx', '.xls',
    // Scripts
    '.sh', '.bat', '.ps1', '.zsh', '.fish',
    // Other
    '.log', '.htm', '.xhtml',
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
]);

/** Check if a file name matches document drop extensions */
export function isDocumentDropFile(fileName: string): boolean {
    const dotIdx = fileName.lastIndexOf('.');
    if (dotIdx < 0) return false;
    return DOCUMENT_DROP_EXTENSIONS.has(fileName.slice(dotIdx).toLowerCase());
}

// ── Helpers ────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Component ──────────────────────────────────────────────────

const CanvasDocumentDropModal: React.FC<CanvasDocumentDropModalProps> = ({
    file,
    onComplete,
    onCancel,
    defaultCollectionName,
    fetchCollections,
    createCollection: createCollectionApi,
}) => {
    const { t } = useTranslation();

    const [collections, setCollections] = useState<CollectionItem[]>([]);
    const [selectedCollectionName, setSelectedCollectionName] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingCollections, setIsLoadingCollections] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [newCollectionName, setNewCollectionName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const loadCollections = useCallback(async () => {
        if (!fetchCollections) return;
        setIsLoadingCollections(true);
        setLoadError(null);
        try {
            const items = await fetchCollections();
            setCollections(Array.isArray(items) ? items : []);
        } catch (err: any) {
            console.error('Failed to load collections for canvas drop:', err);
            setLoadError(err?.message || t('canvas.documentDrop.loadFailed', 'Failed to load collections'));
        } finally {
            setIsLoadingCollections(false);
        }
    }, [fetchCollections, t]);

    useEffect(() => { loadCollections(); }, [loadCollections]);

    useEffect(() => {
        if (defaultCollectionName && collections.length > 0 && !selectedCollectionName) {
            const match = collections.find((c) => c.collection_name === defaultCollectionName);
            if (match) setSelectedCollectionName(match.collection_name);
        }
    }, [defaultCollectionName, collections, selectedCollectionName]);

    const filteredCollections = collections.filter((c) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return c.collection_make_name.toLowerCase().includes(q) || c.collection_name.toLowerCase().includes(q);
    });

    const handleCreateCollection = useCallback(async () => {
        const trimmed = newCollectionName.trim();
        if (!trimmed || !createCollectionApi) return;

        setIsCreating(true);
        setCreateError(null);
        try {
            const result: any = await createCollectionApi(trimmed);
            const createdName: string = result?.collection_name ?? result?.collection?.collection_name ?? trimmed;
            onComplete(createdName);
        } catch (err: any) {
            console.error('Failed to create collection from canvas drop:', err);
            setCreateError(err?.message || t('canvas.documentDrop.createFailed', 'Failed to create collection'));
            setIsCreating(false);
        }
    }, [newCollectionName, createCollectionApi, onComplete, t]);

    const handleUploadClick = useCallback(() => {
        if (!selectedCollectionName) return;
        onComplete(selectedCollectionName);
    }, [selectedCollectionName, onComplete]);

    const handleOverlayClick = useCallback(
        (e: React.MouseEvent) => { if (e.target === e.currentTarget) onCancel(); },
        [onCancel],
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    return createPortal(
        <div className={styles.modalOverlay} onClick={handleOverlayClick} role="presentation">
            <div className={styles.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h3 className={styles.title}>{t('canvas.documentDrop.modalTitle', '문서 업로드')}</h3>
                    <button className={styles.closeButton} onClick={onCancel} type="button">
                        <FiX size={18} />
                    </button>
                </div>

                {/* File info */}
                <div className={styles.fileInfo}>
                    <div className={styles.fileIcon}><FiFile size={18} /></div>
                    <div className={styles.fileDetails}>
                        <div className={styles.fileName}>{file.name}</div>
                        <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                    </div>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    <div className={styles.sectionLabel}>{t('canvas.documentDrop.selectCollection', '컬렉션 선택')}</div>

                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder={t('canvas.documentDrop.searchPlaceholder', '컬렉션 검색...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <div className={styles.collectionList}>
                        {isLoadingCollections ? (
                            <div className={styles.listLoading}>
                                <span className={`${styles.spinner} ${styles.spinnerDark}`} />
                                {t('canvas.documentDrop.loading', 'Loading...')}
                            </div>
                        ) : loadError ? (
                            <div className={styles.emptyList}>
                                {loadError}
                                <br />
                                <button
                                    className={styles.createButton}
                                    style={{ marginTop: 8, fontSize: 12, height: 30, padding: '0 12px' }}
                                    onClick={loadCollections}
                                    type="button"
                                >
                                    {t('canvas.documentDrop.retry', '다시 시도')}
                                </button>
                            </div>
                        ) : filteredCollections.length === 0 ? (
                            <div className={styles.emptyList}>
                                {searchQuery.trim()
                                    ? t('canvas.documentDrop.noSearchResults', '검색 결과가 없습니다')
                                    : t('canvas.documentDrop.noCollections', '컬렉션이 없습니다')}
                            </div>
                        ) : (
                            filteredCollections.map((c) => (
                                <div
                                    key={c.collection_name}
                                    role="option"
                                    aria-selected={selectedCollectionName === c.collection_name}
                                    tabIndex={0}
                                    className={`${styles.collectionItem} ${selectedCollectionName === c.collection_name ? styles.selected : ''}`}
                                    onClick={() => setSelectedCollectionName(c.collection_name)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCollectionName(c.collection_name); }}
                                >
                                    <div className={`${styles.radioIndicator} ${selectedCollectionName === c.collection_name ? styles.checked : ''}`} />
                                    <span className={styles.collectionName}>{c.collection_make_name}</span>
                                    {c.points_count !== undefined && (
                                        <span className={styles.collectionMeta}>{c.points_count} docs</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Divider */}
                    <div className={styles.divider}>
                        <div className={styles.dividerLine} />
                        <span className={styles.dividerText}>{t('canvas.documentDrop.orCreateNew', '또는 새로 만들기')}</span>
                        <div className={styles.dividerLine} />
                    </div>

                    {/* Create new collection */}
                    <div className={styles.createForm}>
                        <input
                            type="text"
                            className={styles.createInput}
                            placeholder={t('canvas.documentDrop.newCollectionPlaceholder', '새 컬렉션 이름')}
                            value={newCollectionName}
                            onChange={(e) => { setNewCollectionName(e.target.value); setCreateError(null); }}
                            disabled={isCreating}
                            onKeyDown={(e) => { if (e.key === 'Enter' && newCollectionName.trim()) handleCreateCollection(); }}
                        />
                        <button
                            className={styles.createButton}
                            onClick={handleCreateCollection}
                            disabled={isCreating || !newCollectionName.trim()}
                            type="button"
                        >
                            {isCreating && <span className={styles.spinner} />}
                            {t('canvas.documentDrop.create', '생성')}
                        </button>
                    </div>
                    {createError && <div className={styles.errorMessage}>{createError}</div>}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button className={`${styles.footerButton} ${styles.cancel}`} onClick={onCancel} type="button">
                        {t('canvas.documentDrop.cancel', '취소')}
                    </button>
                    <button
                        className={`${styles.footerButton} ${styles.primary}`}
                        onClick={handleUploadClick}
                        disabled={!selectedCollectionName}
                        type="button"
                    >
                        {t('canvas.documentDrop.upload', '업로드')}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

// ── Plugin Export ───────────────────────────────────────────────

export const canvasDocumentDropPlugin: CanvasPagePlugin = {
    id: 'canvas-document-drop',
    name: 'Canvas Document Drop',
    modals: [
        {
            id: 'document-drop-modal',
            component: CanvasDocumentDropModal as any,
        },
    ],
    dropHandler: {
        id: 'document-drop-handler',
        canHandle: (file: File) => isDocumentDropFile(file.name),
    },
};

export { CanvasDocumentDropModal };
export default CanvasDocumentDropModal;
