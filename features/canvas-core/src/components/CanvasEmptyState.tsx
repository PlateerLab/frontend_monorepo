'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { LuPlus, LuChevronRight } from '@xgen/icons';
import styles from '../styles/canvas-empty-state.module.scss';

export interface CanvasEmptyStateProps {
    onAddStartNode: () => void;
    onTemplateStart: () => void;
    onAICreate: () => void;
    /** Optional card button component — injected to avoid coupling to shared UI */
    CardButton?: React.ComponentType<any>;
    /** Optional icon components */
    WorkflowIcon?: React.ComponentType<any>;
    TemplateIcon?: React.ComponentType<any>;
    SparkleIcon?: React.ComponentType<any>;
}

const CanvasEmptyState: React.FC<CanvasEmptyStateProps> = ({
    onAddStartNode,
    onTemplateStart,
    onAICreate,
    CardButton,
    WorkflowIcon,
    TemplateIcon,
    SparkleIcon,
}) => {
    const { t } = useTranslation();

    // Fallback to simple buttons if no CardButton is injected
    const renderCardButton = (props: { topIcon: React.ReactNode; prefixIcon: React.ReactNode; content: string; variant: string; onClick: () => void; mutedDefault?: boolean }) => {
        if (CardButton) return <CardButton {...props} />;
        return (
            <button type="button" className={styles.fallbackCard} onClick={props.onClick}>
                {props.prefixIcon}
                <span>{props.content}</span>
            </button>
        );
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.wrapper}>
                <div className={styles.startBlock}>
                    {renderCardButton({
                        topIcon: <LuPlus />,
                        prefixIcon: WorkflowIcon ? (
                            <WorkflowIcon width={20} height={20} className={styles.leftCardIcon} aria-hidden />
                        ) : null,
                        content: t('canvas.emptyState.addStartNode', '시작 노드 추가'),
                        variant: 'primary',
                        mutedDefault: true,
                        onClick: onAddStartNode,
                    })}
                    <button
                        type="button"
                        className={styles.templateLink}
                        onClick={(e) => { e.stopPropagation(); onTemplateStart(); }}
                    >
                        {TemplateIcon && (
                            <TemplateIcon width={20} height={20} className={styles.templateIcon} aria-hidden />
                        )}
                        <span className={styles.templateText}>{t('canvas.emptyState.startFromTemplate', '템플릿으로 시작')}</span>
                        <LuChevronRight className={styles.templateArrow} />
                    </button>
                </div>
                <span className={styles.or}>{t('canvas.emptyState.or', 'or')}</span>
                {renderCardButton({
                    topIcon: <LuPlus />,
                    prefixIcon: SparkleIcon ? <SparkleIcon width={20} height={20} /> : null,
                    content: t('canvas.emptyState.aiCreate', 'AI로 생성'),
                    variant: 'secondary',
                    onClick: onAICreate,
                })}
            </div>
        </div>
    );
};

export default CanvasEmptyState;
