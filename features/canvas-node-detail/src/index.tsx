import './locales';
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    FiCpu,
    FiArrowDownCircle,
    FiArrowUpCircle,
    FiSettings,
    FiChevronDown,
    FiAlertCircle,
} from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import type { CanvasPagePlugin } from '@xgen/types';
import styles from './styles/node-detail-modal.module.scss';

// ── Types ──────────────────────────────────────────────────────

interface PortInfo {
    id: string;
    name: string;
    type: string;
    multi?: boolean;
    required?: boolean;
    stream?: boolean;
    description?: string;
    description_ko?: string;
    value?: any;
    dependency?: string;
    dependencyValue?: any;
}

interface ParameterOption {
    value: string | number;
    label?: string;
}

interface ParameterInfo {
    id: string;
    name: string;
    type: string;
    value?: any;
    required?: boolean;
    optional?: boolean;
    options?: ParameterOption[];
    min?: number;
    max?: number;
    step?: number;
    is_api?: boolean;
    api_name?: string;
    description?: string;
    description_ko?: string;
    expandable?: boolean;
    dependency?: string;
    dependencyValue?: any;
}

interface NodeDetailData {
    id: string;
    nodeName: string;
    nodeNameKo?: string;
    categoryId?: string;
    categoryName?: string;
    functionId?: string;
    functionName?: string;
    description?: string;
    description_ko?: string;
    userTip?: string;
    userTip_ko?: string;
    tags?: string[];
    inputs?: PortInfo[];
    outputs?: PortInfo[];
    parameters?: ParameterInfo[];
    disable?: boolean;
}

export interface NodeDetailModalProps {
    isOpen: boolean;
    nodeId: string;
    nodeDataId: string;
    nodeName: string;
    onClose: () => void;
    /** Injected API: fetch node detail by nodeDataId */
    fetchNodeDetail?: (nodeDataId: string) => Promise<NodeDetailData>;
}

interface SectionState {
    description: boolean;
    category: boolean;
    tags: boolean;
    inputs: boolean;
    outputs: boolean;
    parameters: boolean;
}

// ── Component ──────────────────────────────────────────────────

const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
    isOpen,
    nodeId,
    nodeDataId,
    nodeName,
    onClose,
    fetchNodeDetail: fetchNodeDetailApi,
}) => {
    const [nodeDetail, setNodeDetail] = useState<NodeDetailData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { locale, t } = useTranslation();
    const [expandedSections, setExpandedSections] = useState<SectionState>({
        description: true,
        category: true,
        tags: true,
        inputs: false,
        outputs: false,
        parameters: false,
    });

    const fetchDetail = useCallback(async () => {
        if (!nodeDataId || !fetchNodeDetailApi) return;

        setIsLoading(true);
        setError(null);
        setNodeDetail(null);

        try {
            const detail = await fetchNodeDetailApi(nodeDataId);
            setNodeDetail(detail);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('canvas.nodeDetail.fetchFailed', '노드 정보를 불러오는데 실패했습니다.');
            setError(errorMessage);
            console.error('Failed to fetch node detail:', err);
        } finally {
            setIsLoading(false);
        }
    }, [nodeDataId, fetchNodeDetailApi, t]);

    useEffect(() => {
        if (isOpen && nodeDataId) {
            setIsLoading(true);
            setError(null);
            setNodeDetail(null);
            const timer = setTimeout(() => { fetchDetail(); }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen, nodeDataId, fetchDetail]);

    useEffect(() => {
        if (!isOpen) {
            setNodeDetail(null);
            setError(null);
            setIsLoading(true);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const toggleSection = (section: keyof SectionState) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    const formatValue = (value: any): string => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    const getLocalizedText = (en?: string, ko?: string): string | undefined => {
        if (locale === 'ko' && ko && ko.trim() !== '') return ko;
        return en;
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerInfo}>
                        <h3 className={styles.nodeName}>
                            <span className={styles.nodeIcon}><FiCpu /></span>
                            {(() => {
                                const name = nodeDetail?.nodeName || nodeName;
                                const nameKo = nodeDetail?.nodeNameKo;
                                return (locale === 'ko' && nameKo) ? nameKo : name;
                            })()}
                        </h3>
                        <div className={styles.headerMeta}>
                            <span className={styles.nodeId}>{nodeDataId}</span>
                            {nodeDetail?.tags && nodeDetail.tags.length > 0 && (
                                <div className={styles.headerTags}>
                                    {nodeDetail.tags.map((tag, index) => (
                                        <span key={index} className={styles.headerTag}>{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <button className={styles.closeButton} onClick={onClose} type="button" aria-label="Close">×</button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    <div className={styles.bodyContent}>
                        {isLoading ? (
                            <div className={styles.loadingContainer}>
                                <div className={styles.spinner} />
                                <span className={styles.loadingText}>{t('canvas.nodeDetail.loading', '노드 정보를 불러오는 중...')}</span>
                            </div>
                        ) : error ? (
                            <div className={styles.errorContainer}>
                                <span className={styles.errorIcon}><FiAlertCircle /></span>
                                <span className={styles.errorText}>{error}</span>
                                <button className={styles.retryButton} onClick={fetchDetail} type="button">
                                    {t('canvas.nodeDetail.retry', '다시 시도')}
                                </button>
                            </div>
                        ) : nodeDetail ? (
                            <>
                                {/* Basic info section */}
                                <div className={styles.basicInfoSection}>
                                    {(nodeDetail.description || nodeDetail.description_ko) && (
                                        <div className={styles.descriptionBlock}>
                                            <p className={styles.description} style={{ whiteSpace: 'pre-line' }}>
                                                {getLocalizedText(nodeDetail.description, nodeDetail.description_ko)}
                                            </p>
                                        </div>
                                    )}
                                    {(nodeDetail.categoryName || nodeDetail.functionName) && (
                                        <div className={styles.metaInfoRow}>
                                            <div className={styles.categoryBlock}>
                                                {nodeDetail.categoryName && (
                                                    <div className={styles.metaItem}>
                                                        <span className={styles.metaLabel}>{t('canvas.nodeDetail.category', '카테고리')}</span>
                                                        <span className={styles.metaValue}>{nodeDetail.categoryName}</span>
                                                    </div>
                                                )}
                                                {nodeDetail.functionName && (
                                                    <div className={styles.metaItem}>
                                                        <span className={styles.metaLabel}>{t('canvas.nodeDetail.function', '기능')}</span>
                                                        <span className={styles.metaValue}>{nodeDetail.functionName}</span>
                                                    </div>
                                                )}
                                                {nodeDetail.functionId && (
                                                    <div className={styles.metaItem}>
                                                        <span className={styles.metaLabel}>{t('canvas.nodeDetail.functionId', '기능 ID')}</span>
                                                        <span className={styles.metaValue}>{nodeDetail.functionId}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* User tip */}
                                {(() => {
                                    const tip = getLocalizedText(nodeDetail.userTip, nodeDetail.userTip_ko);
                                    return tip && tip.trim() !== '' ? (
                                        <div className={styles.userTipBlock}>
                                            <div className={styles.userTipHeader}>
                                                <span className={styles.userTipIcon}>💡</span>
                                                <span className={styles.userTipLabel}>{t('canvas.nodeDetail.usageTip', '사용 팁')}</span>
                                            </div>
                                            <p className={styles.userTipText}>{tip}</p>
                                        </div>
                                    ) : null;
                                })()}

                                {/* Collapsible sections */}
                                <div className={styles.collapsibleSections}>
                                    {/* Inputs */}
                                    <div className={styles.section}>
                                        <div className={styles.sectionHeader} onClick={() => toggleSection('inputs')}>
                                            <FiArrowDownCircle className={styles.sectionIcon} />
                                            <span className={styles.sectionTitle}>{t('canvas.nodeDetail.inputs', '입력 (Inputs)')}</span>
                                            <span className={styles.sectionCount}>{nodeDetail.inputs?.length || 0}</span>
                                            <FiChevronDown className={`${styles.expandIcon} ${expandedSections.inputs ? styles.expanded : ''}`} />
                                        </div>
                                        {expandedSections.inputs && (
                                            <div className={styles.sectionContent}>
                                                {nodeDetail.inputs && nodeDetail.inputs.length > 0 ? (
                                                    <div className={styles.portList}>
                                                        {nodeDetail.inputs.map((input) => (
                                                            <div key={input.id} className={styles.portItem}>
                                                                <div className={styles.portHeader}>
                                                                    <span className={styles.portName}>{input.name}</span>
                                                                    <span className={`${styles.portType} ${styles.inputType}`}>{input.type}</span>
                                                                    <div className={styles.portBadges}>
                                                                        {input.required && <span className={`${styles.badge} ${styles.requiredBadge}`}>{t('canvas.nodeDetail.required', '필수')}</span>}
                                                                        {input.multi && <span className={`${styles.badge} ${styles.multiBadge}`}>{t('canvas.nodeDetail.multi', '다중')}</span>}
                                                                    </div>
                                                                </div>
                                                                <div className={styles.portDetails}>
                                                                    <div className={styles.detailItem}>
                                                                        <span className={styles.detailLabel}>ID:</span>
                                                                        <span className={styles.detailValue}>{input.id}</span>
                                                                    </div>
                                                                </div>
                                                                {input.dependency && (
                                                                    <div className={styles.dependencyInfo}>
                                                                        <span className={styles.dependencyLabel}>{t('canvas.nodeDetail.dependency', '의존성')}: </span>
                                                                        {input.dependency} = {formatValue(input.dependencyValue)}
                                                                    </div>
                                                                )}
                                                                {(() => {
                                                                    const desc = getLocalizedText(input.description, input.description_ko);
                                                                    return desc ? <div className={styles.parameterDescription}>{desc}</div> : null;
                                                                })()}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className={styles.emptyState}>{t('canvas.nodeDetail.noInputs', '입력 포트가 없습니다')}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Outputs */}
                                    <div className={styles.section}>
                                        <div className={styles.sectionHeader} onClick={() => toggleSection('outputs')}>
                                            <FiArrowUpCircle className={styles.sectionIcon} />
                                            <span className={styles.sectionTitle}>{t('canvas.nodeDetail.outputs', '출력 (Outputs)')}</span>
                                            <span className={styles.sectionCount}>{nodeDetail.outputs?.length || 0}</span>
                                            <FiChevronDown className={`${styles.expandIcon} ${expandedSections.outputs ? styles.expanded : ''}`} />
                                        </div>
                                        {expandedSections.outputs && (
                                            <div className={styles.sectionContent}>
                                                {nodeDetail.outputs && nodeDetail.outputs.length > 0 ? (
                                                    <div className={styles.portList}>
                                                        {nodeDetail.outputs.map((output) => (
                                                            <div key={output.id} className={styles.portItem}>
                                                                <div className={styles.portHeader}>
                                                                    <span className={styles.portName}>{output.name}</span>
                                                                    <span className={`${styles.portType} ${styles.outputType}`}>{output.type}</span>
                                                                    <div className={styles.portBadges}>
                                                                        {output.stream && <span className={`${styles.badge} ${styles.streamBadge}`}>{t('canvas.nodeDetail.stream', '스트림')}</span>}
                                                                    </div>
                                                                </div>
                                                                <div className={styles.portDetails}>
                                                                    <div className={styles.detailItem}>
                                                                        <span className={styles.detailLabel}>ID:</span>
                                                                        <span className={styles.detailValue}>{output.id}</span>
                                                                    </div>
                                                                </div>
                                                                {output.dependency && (
                                                                    <div className={styles.dependencyInfo}>
                                                                        <span className={styles.dependencyLabel}>{t('canvas.nodeDetail.dependency', '의존성')}: </span>
                                                                        {output.dependency} = {formatValue(output.dependencyValue)}
                                                                    </div>
                                                                )}
                                                                {(() => {
                                                                    const desc = getLocalizedText(output.description, output.description_ko);
                                                                    return desc ? <div className={styles.parameterDescription}>{desc}</div> : null;
                                                                })()}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className={styles.emptyState}>{t('canvas.nodeDetail.noOutputs', '출력 포트가 없습니다')}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Parameters */}
                                    <div className={styles.section}>
                                        <div className={styles.sectionHeader} onClick={() => toggleSection('parameters')}>
                                            <FiSettings className={styles.sectionIcon} />
                                            <span className={styles.sectionTitle}>{t('canvas.nodeDetail.parameters', '파라미터 (Parameters)')}</span>
                                            <span className={styles.sectionCount}>{nodeDetail.parameters?.length || 0}</span>
                                            <FiChevronDown className={`${styles.expandIcon} ${expandedSections.parameters ? styles.expanded : ''}`} />
                                        </div>
                                        {expandedSections.parameters && (
                                            <div className={styles.sectionContent}>
                                                {nodeDetail.parameters && nodeDetail.parameters.length > 0 ? (
                                                    <div className={styles.parameterList}>
                                                        {nodeDetail.parameters.map((param) => (
                                                            <div key={param.id} className={styles.parameterItem}>
                                                                <div className={styles.parameterHeader}>
                                                                    <span className={styles.parameterName}>{param.name}</span>
                                                                    <span className={styles.parameterType}>{param.type}</span>
                                                                    <div className={styles.parameterBadges}>
                                                                        {param.required && <span className={`${styles.badge} ${styles.requiredBadge}`}>{t('canvas.nodeDetail.required', '필수')}</span>}
                                                                        {param.optional && <span className={`${styles.badge} ${styles.optionalBadge}`}>{t('canvas.nodeDetail.optional', '선택')}</span>}
                                                                    </div>
                                                                </div>
                                                                <div className={styles.parameterDetails}>
                                                                    <div className={styles.detailItem}>
                                                                        <span className={styles.detailLabel}>ID:</span>
                                                                        <span className={styles.detailValue}>{param.id}</span>
                                                                    </div>
                                                                    {param.value !== undefined && param.value !== '' && (
                                                                        <div className={styles.defaultValue}>
                                                                            <span className={styles.defaultLabel}>{t('canvas.nodeDetail.defaultValue', '기본값')}:</span>
                                                                            <span className={styles.defaultValueText} title={formatValue(param.value)}>
                                                                                {formatValue(param.value)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {param.min !== undefined && (
                                                                        <div className={styles.detailItem}>
                                                                            <span className={styles.detailLabel}>{t('canvas.nodeDetail.min', '최소')}:</span>
                                                                            <span className={styles.detailValue}>{param.min}</span>
                                                                        </div>
                                                                    )}
                                                                    {param.max !== undefined && (
                                                                        <div className={styles.detailItem}>
                                                                            <span className={styles.detailLabel}>{t('canvas.nodeDetail.max', '최대')}:</span>
                                                                            <span className={styles.detailValue}>{param.max}</span>
                                                                        </div>
                                                                    )}
                                                                    {param.step !== undefined && (
                                                                        <div className={styles.detailItem}>
                                                                            <span className={styles.detailLabel}>{t('canvas.nodeDetail.step', '단위')}:</span>
                                                                            <span className={styles.detailValue}>{param.step}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {(() => {
                                                                    const desc = getLocalizedText(param.description, param.description_ko);
                                                                    return desc ? <div className={styles.parameterDescription}>{desc}</div> : null;
                                                                })()}
                                                                {param.options && param.options.length > 0 && (
                                                                    <div className={styles.parameterOptions}>
                                                                        <div className={styles.optionsTitle}>{t('canvas.nodeDetail.options', '옵션')}</div>
                                                                        <div className={styles.optionsList}>
                                                                            {param.options.map((option, idx) => (
                                                                                <span key={idx} className={styles.optionItem}>
                                                                                    {option.label || option.value}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {param.dependency && (
                                                                    <div className={styles.dependencyInfo}>
                                                                        <span className={styles.dependencyLabel}>{t('canvas.nodeDetail.dependency', '의존성')}: </span>
                                                                        {param.dependency} = {formatValue(param.dependencyValue)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className={styles.emptyState}>{t('canvas.nodeDetail.noParameters', '파라미터가 없습니다')}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button className={styles.closeFooterButton} onClick={onClose} type="button">
                        {t('canvas.nodeDetail.close', '닫기')}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

// ── Plugin Export ───────────────────────────────────────────────

export const canvasNodeDetailPlugin: CanvasPagePlugin = {
    id: 'canvas-node-detail',
    name: 'Canvas Node Detail',
    modals: [
        {
            id: 'node-detail-modal',
            component: NodeDetailModal as any,
        },
    ],
};

export { NodeModal } from './components/NodeModal';
export { NodeDetailModal };
export default NodeDetailModal;
