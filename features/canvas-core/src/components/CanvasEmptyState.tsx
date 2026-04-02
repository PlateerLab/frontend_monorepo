'use client';

import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { LuPlus, LuChevronRight } from '@xgen/icons';

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

    const renderCardButton = (props: { topIcon: React.ReactNode; prefixIcon: React.ReactNode; content: string; variant: string; onClick: () => void; mutedDefault?: boolean }) => {
        if (CardButton) return <CardButton {...props} />;
        return (
            <button
                type="button"
                className="flex flex-col items-center justify-center gap-2 w-60 min-w-60 h-[120px] min-h-[120px] shrink-0 p-4 rounded-lg border border-gray-200 bg-white cursor-pointer transition-colors hover:bg-gray-50"
                onClick={props.onClick}
            >
                {props.prefixIcon}
                <span>{props.content}</span>
            </button>
        );
    };

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-[100] [&>*]:pointer-events-auto">
            <div className="flex items-start gap-7 flex-wrap justify-center">
                <div className="flex flex-col items-center gap-3 [&>button:first-of-type]:w-60 [&>button:first-of-type]:min-w-60 [&>button:first-of-type]:h-[120px] [&>button:first-of-type]:min-h-[120px] [&>button:first-of-type]:shrink-0">
                    {renderCardButton({
                        topIcon: <LuPlus />,
                        prefixIcon: WorkflowIcon ? (
                            <WorkflowIcon width={20} height={20} className="block shrink-0" aria-hidden />
                        ) : null,
                        content: t('canvas.emptyState.addStartNode', '시작 노드 추가'),
                        variant: 'primary',
                        mutedDefault: true,
                        onClick: onAddStartNode,
                    })}
                    <button
                        type="button"
                        className="m-0 inline-flex items-center gap-1 px-1.5 bg-transparent border-none cursor-pointer text-[#783ced] hover:text-violet-800 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                        onClick={(e) => { e.stopPropagation(); onTemplateStart(); }}
                    >
                        {TemplateIcon && (
                            <TemplateIcon width={20} height={20} className="w-5 h-5 shrink-0 fill-current" aria-hidden />
                        )}
                        <span className="text-sm font-bold leading-5">{t('canvas.emptyState.startFromTemplate', '템플릿으로 시작')}</span>
                        <LuChevronRight className="w-5 h-5 shrink-0" />
                    </button>
                </div>
                <span className="text-sm font-semibold text-gray-600 h-[120px] flex items-center justify-center shrink-0">
                    {t('canvas.emptyState.or', 'or')}
                </span>
                <div className="[&>button]:w-60 [&>button]:min-w-60 [&>button]:h-[120px] [&>button]:min-h-[120px] [&>button]:shrink-0">
                    {renderCardButton({
                        topIcon: <LuPlus />,
                        prefixIcon: SparkleIcon ? <SparkleIcon width={20} height={20} /> : null,
                        content: t('canvas.emptyState.aiCreate', 'AI로 생성'),
                        variant: 'secondary',
                        onClick: onAICreate,
                    })}
                </div>
            </div>
        </div>
    );
};

export default CanvasEmptyState;
