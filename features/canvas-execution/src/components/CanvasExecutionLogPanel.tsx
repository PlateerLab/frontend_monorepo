import React from 'react';
import { useTranslation } from '@xgen/i18n';
import { cn } from '@xgen/ui';
import type { CanvasExecutionLogPanelProps } from '../types';

const iconBtnClass = 'w-7 h-7 rounded-lg border-none p-0 flex items-center justify-center bg-transparent cursor-pointer disabled:cursor-default disabled:opacity-50';

const CanvasExecutionLogPanel: React.FC<CanvasExecutionLogPanelProps> = ({
    expanded,
    onToggleExpand,
    onClearLogs,
    onFullscreen,
    children,
}) => {
    const { t } = useTranslation();

    return (
        <div
            className={cn(
                'absolute left-0 right-0 bottom-0 flex flex-col z-[11] pointer-events-none [&>*]:pointer-events-auto',
                expanded && 'h-[300px]',
            )}
            role="region"
            aria-label={t('canvas.bottom.execution', 'Execution')}
        >
            <div className="shrink-0 basis-[42px] h-[42px] flex items-center bg-white border-t border-b border-black/[0.08]">
                <div className="shrink-0 basis-[500px] min-w-[500px] max-w-[500px] flex items-center px-4">
                    <span className="text-xs font-bold leading-4 text-[#1d1f23]">{t('canvas.bottom.execution', 'Execution')}</span>
                </div>
                <div className="flex-1 min-w-0 h-full flex items-center justify-between px-4 border-l border-black/[0.08]">
                    <span className="text-xs font-bold leading-4 text-[#1d1f23]">{t('canvas.bottom.log', 'Log')}</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className={iconBtnClass}
                            onClick={onClearLogs}
                            aria-label={t('canvas.bottom.clear', 'Clear')}
                            title={t('canvas.bottom.clear', 'Clear')}
                        >
                            🗑
                        </button>
                        <span className="block w-px h-7 bg-black/[0.08] shrink-0" aria-hidden />
                        <button
                            type="button"
                            className={iconBtnClass}
                            aria-label={t('canvas.bottom.fullscreen', 'Fullscreen')}
                            title={t('canvas.bottom.fullscreen', 'Fullscreen')}
                            onClick={() => onFullscreen?.()}
                        >
                            ⛶
                        </button>
                        <button
                            type="button"
                            className={iconBtnClass}
                            aria-label={expanded ? t('canvas.bottom.collapse', 'Collapse') : t('canvas.bottom.expand', 'Expand')}
                            title={expanded ? t('canvas.bottom.collapse', 'Collapse') : t('canvas.bottom.expand', 'Expand')}
                            onClick={onToggleExpand}
                        >
                            {expanded ? '▼' : '▲'}
                        </button>
                    </div>
                </div>
            </div>
            <div className={expanded ? 'flex-1 min-h-0 overflow-hidden flex flex-col' : 'hidden'}>{children}</div>
        </div>
    );
};

export default CanvasExecutionLogPanel;
